require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initializeDatabase, executeQuery, getConnection } = require('./Database/database');
const { sendOTPReset } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3001;

// Helper function to generate OTP
function generateOTP() {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Environment variables
const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = process.env.OPENROUTER_API_URL;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('🚀 Starting Express Server...');
console.log('📋 Environment Variables:');
console.log('   - PORT:', PORT);
console.log('   - OPENROUTER_API_KEY:', API_KEY ? '✓ Configured' : '✗ Missing');
console.log('   - OPENROUTER_API_URL:', API_URL);
console.log('   - JWT_SECRET:', JWT_SECRET ? '✓ Configured' : '✗ Missing');

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('🔐 Authentication failed: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('🔐 Authentication failed: Invalid token');
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    console.log(`🔐 User ${user.email} authenticated successfully`);
    next();
  });
};

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  console.log('👤 [SIGNUP] Starting signup process...');
  const connection = await getConnection();
  try {
    const { fullName, email, password } = req.body;
    console.log(`👤 [SIGNUP] Attempting to create user: ${email}`);

    // Check if user exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      console.log(`❌ [SIGNUP] User already exists: ${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('🔒 [SIGNUP] Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await connection.execute(
      'INSERT INTO users (id, full_name, email, password, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, fullName, email, hashedPassword]
    );

    console.log(`✅ [SIGNUP] User created successfully: ${email} (ID: ${userId})`);

    console.log('🎫 [SIGNUP] Generating JWT token...');
    // Generate token
    const token = jwt.sign({ id: userId, email: email }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ [SIGNUP] Signup completed for: ${email}`);
    res.status(201).json({ token, user: { id: userId, fullName: fullName, email: email } });
  } catch (error) {
    console.error('❌ [SIGNUP] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

app.post('/api/auth/signin', async (req, res) => {
  console.log('🔑 [SIGNIN] Starting signin process...');
  const connection = await getConnection();
  try {
    const { email, password } = req.body;
    console.log(`🔑 [SIGNIN] Attempting login for: ${email}`);

    // Get user from database
    const [rows] = await connection.execute(
      'SELECT id, full_name, email, password FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log(`❌ [SIGNIN] User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    console.log('🔐 [SIGNIN] Verifying password...');
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      console.log(`❌ [SIGNIN] Invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🎫 [SIGNIN] Generating JWT token...');
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ [SIGNIN] Login successful for: ${email}`);
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (error) {
    console.error('❌ [SIGNIN] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// OTP Generation route (Step 1: Send OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('🔑 [FORGOT PASSWORD] Forgot password request...');
  const connection = await getConnection();
  try {
    const { email } = req.body;

    if (!email) {
      console.log('❌ [FORGOT PASSWORD] Email not provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`🔑 [FORGOT PASSWORD] Checking if user exists: ${email}`);

    // Check if user exists
    const [rows] = await connection.execute(
      'SELECT id, full_name FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log(`❌ [FORGOT PASSWORD] User not found: ${email}`);
      // Return error message instead of generic success to show error in UI
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const user = rows[0];
    console.log(`✅ [FORGOT PASSWORD] User found: ${email} (ID: ${user.id})`);

    // Generate OTP
    const otp = generateOTP();
    console.log(`🔑 [FORGOT PASSWORD] Generated OTP for user: ${user.id}`);

    // Calculate expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing OTPs for this user and email
    await connection.execute(
      'DELETE FROM otps WHERE user_id = ? AND email = ? AND purpose = ?',
      [user.id, email, 'password_reset']
    );

    // Store OTP
    const otpId = uuidv4();
    await connection.execute(
      'INSERT INTO otps (id, user_id, email, otp, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [otpId, user.id, email, otp, 'password_reset', expiresAt]
    );
    console.log(`💾 [FORGOT PASSWORD] OTP stored in database, expires at: ${expiresAt.toISOString()}`);

    console.log('📧 [FORGOT PASSWORD] Sending OTP email...');

    // Send OTP via email
    const emailResult = await sendOTPReset(email, user.full_name, otp);

    if (emailResult.success) {
      console.log(`✅ [FORGOT PASSWORD] OTP email sent to: ${email}`);
      res.json({ message: 'Verification code sent! Please check your inbox.' });
    } else {
      console.error(`❌ [FORGOT PASSWORD] Failed to send OTP to: ${email}`, emailResult.error);
      res.status(500).json({ error: 'Failed to send verification code. Please try again later.' });
    }

  } catch (error) {
    console.error('❌ [FORGOT PASSWORD] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// OTP Verification and Password Reset route (Step 2: Verify OTP and Reset Password)
app.post('/api/auth/verify-otp', async (req, res) => {
  console.log('🔐 [VERIFY OTP] OTP verification request...');
  const connection = await getConnection();
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      console.log('❌ [VERIFY OTP] Missing required fields');
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    console.log(`🔐 [VERIFY OTP] Verifying OTP for: ${email}`);

    // Find OTP in database
    const [otpRows] = await connection.execute(
      'SELECT id, user_id, otp, expires_at FROM otps WHERE email = ? AND otp = ? AND purpose = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp, 'password_reset']
    );

    if (otpRows.length === 0) {
      console.log(`❌ [VERIFY OTP] Invalid or expired OTP for: ${email}`);
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const otpRecord = otpRows[0];
    console.log(`✅ [VERIFY OTP] OTP verified for user: ${otpRecord.user_id}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`🔒 [VERIFY OTP] New password hashed successfully`);

    // Update user's password
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, otpRecord.user_id]
    );
    console.log(`💾 [VERIFY OTP] Password updated for user: ${otpRecord.user_id}`);

    // Mark OTP as used
    await connection.execute(
      'UPDATE otps SET used = TRUE WHERE id = ?',
      [otpRecord.id]
    );
    console.log(`✅ [VERIFY OTP] OTP marked as used`);

    // Clean up expired OTPs
    await connection.execute('DELETE FROM otps WHERE expires_at <= NOW()');
    console.log(`🧹 [VERIFY OTP] Expired OTPs cleaned up`);

    console.log(`✅ [VERIFY OTP] Password reset successful for: ${email}`);
    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });

  } catch (error) {
    console.error('❌ [VERIFY OTP] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});



// Chat routes
app.get('/api/chats', authenticateToken, async (req, res) => {
  console.log(`📋 [GET CHATS] User ${req.user.email} requesting chats`);
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute(
      'SELECT id, user_id as userId, title, encrypted, created_at as createdAt, updated_at as updatedAt FROM chats WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    console.log(`📋 [GET CHATS] Found ${rows.length} chats for user ${req.user.email}`);
    res.json(rows);
  } catch (error) {
    console.error('❌ [GET CHATS] Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve chats' });
  } finally {
    connection.release();
  }
});

app.post('/api/chats', authenticateToken, async (req, res) => {
  const { title, encrypted } = req.body;
  console.log(`💬 [CREATE CHAT] User ${req.user.email} creating chat: "${title}"`);
  const connection = await getConnection();

  try {
    const chatId = uuidv4();
    await connection.execute(
      'INSERT INTO chats (id, user_id, title, encrypted, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [chatId, req.user.id, title || 'New Chat', encrypted || false]
    );

    const chat = {
      id: chatId,
      userId: req.user.id,
      title: title || 'New Chat',
      encrypted: encrypted || false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ [CREATE CHAT] Chat created with ID: ${chatId}`);
    res.status(201).json(chat);
  } catch (error) {
    console.error('❌ [CREATE CHAT] Database error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  } finally {
    connection.release();
  }
});

app.put('/api/chats/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  console.log(`✏️ [UPDATE CHAT] User ${req.user.email} updating chat ${id} to: "${title}"`);
  const connection = await getConnection();

  try {
    // Check if chat exists and belongs to user
    const [existingChat] = await connection.execute(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingChat.length === 0) {
      console.log(`❌ [UPDATE CHAT] Chat not found: ${id}`);
      return res.status(404).json({ error: 'Chat not found' });
    }

    await connection.execute(
      'UPDATE chats SET title = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [title, id, req.user.id]
    );

    // Return updated chat
    const [rows] = await connection.execute(
      'SELECT id, user_id as userId, title, encrypted, created_at as createdAt, updated_at as updatedAt FROM chats WHERE id = ?',
      [id]
    );

    console.log(`✅ [UPDATE CHAT] Chat updated successfully: ${id}`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [UPDATE CHAT] Database error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  } finally {
    connection.release();
  }
});

app.delete('/api/chats/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [DELETE CHAT] User ${req.user.email} deleting chat: ${id}`);
  const connection = await getConnection();

  try {
    // Check if chat exists and belongs to user
    const [existingChat] = await connection.execute(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingChat.length === 0) {
      console.log(`❌ [DELETE CHAT] Chat not found: ${id}`);
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete will cascade to messages due to foreign key constraints
    await connection.execute('DELETE FROM chats WHERE id = ? AND user_id = ?', [id, req.user.id]);

    console.log(`✅ [DELETE CHAT] Chat deleted successfully: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('❌ [DELETE CHAT] Database error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  } finally {
    connection.release();
  }
});

// Store messages in chat (only encrypted versions are stored)
app.post('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { content = null, encryptedMessage = null, iv = null, sessionId = null, role = null, imageData = null, originalImageData = null, plainTextMessage = null } = req.body;

  console.log(`💾 [STORE MESSAGE] User ${req.user.email} storing message in chat: ${chatId}`);
  const connection = await getConnection();

  try {
    // Validate required fields
    if (!role) {
      console.log(`❌ [STORE MESSAGE] Missing required field: role`);
      return res.status(400).json({ error: 'Role is required' });
    }

    // Check if chat exists and belongs to user
    const [existingChat] = await connection.execute(
      'SELECT id, encrypted FROM chats WHERE id = ? AND user_id = ?',
      [chatId, req.user.id]
    );

    if (existingChat.length === 0) {
      console.log(`❌ [STORE MESSAGE] Chat not found: ${chatId}`);
      return res.status(404).json({ error: 'Chat not found' });
    }

    const isEncryptedChat = existingChat[0].encrypted;

    // Handle steganography for image uploads
    let processedImageData = imageData;
    if (imageData && plainTextMessage) {
      console.log('🖼️ [STEGANOGRAPHY] Applying steganography to hide message in image...');
      try {
        const stegoResponse = await axios.post('http://localhost:5001/api/steganography/hide', {
          image_data: imageData,
          text: plainTextMessage
        }, {
          timeout: 10000
        });

        if (stegoResponse.data.success) {
          processedImageData = stegoResponse.data.steganographic_image;
          console.log('✅ [STEGANOGRAPHY] Text successfully hidden in image');
        } else {
          console.log('❌ [STEGANOGRAPHY] Failed to apply steganography, using original image');
          processedImageData = imageData; // Fall back to original
        }
      } catch (error) {
        console.log('❌ [STEGANOGRAPHY] Steganography service error, using original image:', error.message);
        processedImageData = imageData; // Fall back to original
      }
    }

    const messageId = uuidv4();

    // For encrypted chats: ONLY store encrypted data, never plain text
    if (isEncryptedChat) {
      await connection.execute(
        'INSERT INTO messages (id, chat_id, user_id, role, content, encrypted_data, iv, session_id, image_data, original_image_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [messageId, chatId, req.user.id, role, null, encryptedMessage, iv, sessionId, processedImageData, originalImageData] // content is null for encrypted chats
      );
      console.log(`🔐 [STORE ENCRYPTED MESSAGE] Only encrypted data stored for secure chat: ${chatId}`);
      console.log(`🖼️ [STORE MESSAGE] Steganographic image stored: ${processedImageData ? 'Yes' : 'No'}`);
    }
    // For non-encrypted chats: Store plain text (legacy support, but should ideally be encrypted too)
    else {
      await connection.execute(
        'INSERT INTO messages (id, chat_id, user_id, role, content, encrypted_data, iv, session_id, image_data, original_image_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [messageId, chatId, req.user.id, role, content, null, null, null, processedImageData, originalImageData] // encrypted fields are null for plain text chats
      );
      console.log(`📝 [STORE PLAIN MESSAGE] Plain text stored (consider encrypting for security): ${chatId}`);
      console.log(`🖼️ [STORE MESSAGE] Steganographic image stored: ${processedImageData ? 'Yes' : 'No'}`);
    }

    const message = {
      id: messageId,
      encryptedMessage: isEncryptedChat ? encryptedMessage : null,
      iv: isEncryptedChat ? iv : null,
      sessionId: isEncryptedChat ? sessionId : null,
      content: isEncryptedChat ? null : content, // Plain text only returned for non-encrypted chats
      imageData: processedImageData,
      originalImageData: originalImageData,
      role,
      chatId,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      encrypted: isEncryptedChat
    };

    console.log(`✅ [STORE MESSAGE] Message stored securely in chat: ${chatId}`);
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ [STORE MESSAGE] Database error:', error);
    res.status(500).json({ error: 'Failed to store message securely' });
  } finally {
    connection.release();
  }
});

// Get messages for a chat (only returns encrypted data for secure chats)
app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  console.log(`📖 [GET MESSAGES] User ${req.user.email} retrieving messages for chat: ${chatId}`);
  const connection = await getConnection();

  try {
    // Check if chat exists and belongs to user, and get encryption status
    const [existingChat] = await connection.execute(
      'SELECT id, encrypted FROM chats WHERE id = ? AND user_id = ?',
      [chatId, req.user.id]
    );

    if (existingChat.length === 0) {
      console.log(`❌ [GET MESSAGES] Chat not found: ${chatId}`);
      return res.status(404).json({ error: 'Chat not found' });
    }

    const isEncryptedChat = existingChat[0].encrypted;

    const [rows] = await connection.execute(
      'SELECT id, role, content, encrypted_data as encryptedMessage, iv, session_id as sessionId, image_data, original_image_data, created_at as createdAt FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
      [chatId]
    );

    // For encrypted chats, ensure plain text content is never returned
    if (isEncryptedChat) {
      const secureMessages = rows.map(msg => ({
        ...msg,
        content: null, // Explicitly set plain text to null for encrypted chats
        encrypted: true
      }));
      console.log(`🔐 [GET ENCRYPTED MESSAGES] Returning ${secureMessages.length} encrypted messages (no plain text)`);
      console.log(`🖼️ [GET MESSAGES] Including ${rows.filter(m => m.image_data || m.original_image_data).length} messages with images`);
      return res.json(secureMessages);
    }

    // For non-encrypted chats, return plain text but warn about lack of security
    const plainMessages = rows.map(msg => ({
      ...msg,
      encrypted: false
    }));
    console.log(`📝 [GET PLAIN MESSAGES] Returning ${plainMessages.length} plain text messages (consider upgrading to encrypted)`);
    console.log(`🖼️ [GET MESSAGES] Including ${rows.filter(m => m.image_data || m.original_image_data).length} messages with images`);
    res.json(plainMessages);
  } catch (error) {
    console.error('❌ [GET MESSAGES] Database error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  } finally {
    connection.release();
  }
});

app.delete('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  console.log(`🗑️ [DELETE MESSAGES] User ${req.user.email} clearing messages in chat: ${chatId}`);
  const connection = await getConnection();

  try {
    // Check if chat exists and belongs to user
    const [existingChat] = await connection.execute(
      'SELECT id FROM chats WHERE id = ? AND user_id = ?',
      [chatId, req.user.id]
    );

    if (existingChat.length === 0) {
      console.log(`❌ [DELETE MESSAGES] Chat not found: ${chatId}`);
      return res.status(404).json({ error: 'Chat not found' });
    }

    const [result] = await connection.execute('DELETE FROM messages WHERE chat_id = ?', [chatId]);

    console.log(`✅ [DELETE MESSAGES] Cleared ${result.affectedRows} messages from chat: ${chatId}`);
    res.status(204).send();
  } catch (error) {
    console.error('❌ [DELETE MESSAGES] Database error:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  } finally {
    connection.release();
  }
});

app.delete('/api/chats', authenticateToken, async (req, res) => {
  console.log(`🗑️ [DELETE ALL CHATS] User ${req.user.email} deleting all chats`);
  const connection = await getConnection();

  try {
    // This will cascade delete all messages due to foreign key constraints
    const [result] = await connection.execute('DELETE FROM chats WHERE user_id = ?', [req.user.id]);

    console.log(`✅ [DELETE ALL CHATS] Deleted ${result.affectedRows} chats for user ${req.user.email}`);
    res.status(204).send();
  } catch (error) {
    console.error('❌ [DELETE ALL CHATS] Database error:', error);
    res.status(500).json({ error: 'Failed to delete chats' });
  } finally {
    connection.release();
  }
});

// Account deletion route
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  console.log(`🗑️ [DELETE ACCOUNT] User ${req.user.email} requesting account deletion`);

  // Get database connection
  const connection = await getConnection();

  try {
    // Store user info before deletion for logging
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Delete user - CASCADE will handle chats, messages, and sessions
    const [result] = await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      console.log(`❌ [DELETE ACCOUNT] Account not found: ${userEmail}`);
      return res.status(404).json({ error: 'Account not found' });
    }

    console.log(`✅ [DELETE ACCOUNT] Account deleted successfully: ${userEmail}`);
    console.log(`📊 [DELETE ACCOUNT] Deleted ${result.affectedRows} user record(s)`);

    res.status(200).json({
      message: 'Account deleted successfully',
      deletedUser: userEmail
    });

  } catch (error) {
    console.error('❌ [DELETE ACCOUNT] Database error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  } finally {
    connection.release();
  }
});

// AI response route with encryption support
app.post('/api/ai/generate', authenticateToken, async (req, res) => {
  const userEmail = req.user?.email || 'unknown';
  console.log(`🤖 [AI GENERATE] User ${userEmail} requesting AI response...`);
  try {
    const { userMessage, chatHistory, model, encrypted, sessionId, userId, imageData } = req.body;

    console.log(`🔐 [AI GENERATE] Encrypted: ${encrypted}`);
    console.log(`🤖 [AI GENERATE] Chat history: ${chatHistory.length} messages`);
    console.log(`🤖 [AI GENERATE] Model: ${model || 'openai/gpt-3.5-turbo'}`);
    console.log(`🖼️ [AI GENERATE] Image provided: ${imageData ? 'Yes' : 'No'}`);

    let plainTextMessage;

    // If encrypted, decrypt the incoming message first
    if (encrypted && sessionId && userId) {
      console.log(`🔓 [AI GENERATE] Decrypting incoming encrypted message...`);

      // When encrypted=true, userMessage is an object with encrypted_data and iv
      const { encrypted_data, iv } = userMessage;

      // Call Python encryption service to decrypt
      const decryptResponse = await axios.post('http://localhost:5001/api/encryption/decrypt', {
        encrypted_data: encrypted_data,
        iv: iv,
        session_id: sessionId
      });

      plainTextMessage = decryptResponse.data.decrypted_data;
      console.log(`✅ [AI GENERATE] Decrypted message: "${plainTextMessage.substring(0, 50)}${plainTextMessage.length > 50 ? '...' : ''}"`);
    } else {
      // Plain text message for non-encrypted chats
      plainTextMessage = userMessage;
      console.log(`🤖 [AI GENERATE] Plain message: "${plainTextMessage.substring(0, 50)}${plainTextMessage.length > 50 ? '...' : ''}"`);
    }

    // Format chat history for OpenRouter API (filter out any null/undefined content)
  const messages = chatHistory.filter(msg => msg.content).map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

    // Prepare the current user message
    let currentMessageContent;
    
    if (imageData) {
      // Vision API format with image
      currentMessageContent = [
        {
          type: "text",
          text: plainTextMessage
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${imageData}`
          }
        }
      ];
    } else {
      // Regular text-only message
      currentMessageContent = plainTextMessage;
    }

    // Ensure we always have at least the current user message
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: currentMessageContent });
    }

    console.log(`🤖 [AI GENERATE] Sending request to OpenRouter API...`);
    const response = await axios.post(API_URL, {
      model: model || "openai/gpt-3.5-turbo",
      messages: messages
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Chat App'
      }
    });

    const aiResponseText = response.data.choices?.[0]?.message?.content;

    if (!aiResponseText) {
      console.log(`❌ [AI GENERATE] No response generated from AI API`);
      return res.status(500).json({ error: 'No response generated' });
    }

    console.log(`✅ [AI GENERATE] AI response generated (${aiResponseText.length} characters)`);

    // If encrypted, encrypt the AI response before returning
    if (encrypted && sessionId && userId) {
      console.log(`🔒 [AI GENERATE] Encrypting AI response...`);

      // Call Python encryption service to encrypt
      const encryptResponse = await axios.post('http://localhost:5001/api/encryption/encrypt', {
        message: aiResponseText,
        session_id: sessionId
      });

      console.log(`✅ [AI GENERATE] Encrypted AI response`);
      res.json({
        response: encryptResponse.data.encrypted_data,
        iv: encryptResponse.data.iv,
        encrypted: true
      });
    } else {
      // Plain text response for non-encrypted chats
      res.json({ response: aiResponseText, encrypted: false });
    }

  } catch (error) {
    console.error('❌ [AI GENERATE] Error:', error.response?.data || error.message);

    // Return the full error object so frontend can show specific model error messages
    const errorData = error.response?.data || { error: error.message };

    res.status(500).json(errorData);
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🌟 Express Server Successfully Started!`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log(`🗄️ Connected to MySQL database: Chat_Encryption`);
    console.log(`📡 API endpoints available:`);
    console.log(`   POST /api/auth/signup - User registration`);
    console.log(`   POST /api/auth/signin - User login`);
    console.log(`   POST /api/auth/forgot-password - Password reset`);
    console.log(`   GET  /api/chats - Get user chats`);
    console.log(`   POST /api/chats - Create new chat`);
    console.log(`   POST /api/ai/generate - Generate AI response`);
    console.log('='.repeat(60));
    console.log('');
  });
}).catch(error => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});

module.exports = app;
