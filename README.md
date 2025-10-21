# RSA-AES Encrypted Chat Application

## Overview
This is a secure chat application implementing end-to-end encryption using hybrid cryptography (RSA for key exchange + AES-256 for bulk encryption). All chats are encrypted by default, ensuring complete privacy and security.

---

## Architecture Overview
- **Frontend**: React with Web Crypto API for RSA operations
- **Backend**: Node.js + Python Flask microservice
- **Database**: MySQL with encrypted data storage
- **Encryption**: Hybrid RSA/ECB + AES-256-CBC
- **Authentication**: JWT with bcrypt password hashing

---

## Complete Application Flow

### 1. User Registration & Authentication

**Flow**:
1. **Frontend**: User provides email/password → Client-side bcrypt validation
2. **Backend**: Store hashed password (bcrypt, 10 rounds) in database
3. **JWT Generation**: Return signed JWT token (24-hour expiry)
4. **Session Persistence**: Token stored in localStorage for subsequent requests

**Security Features**:
- Passwords never transmitted in plain text
- Secure password hashing prevents credential breaches
- JWT prevents session hijacking

---

### 2. Chat Creation & RSA Key Exchange

**When User Starts a New Chat**:

1. **Client RSA Key Generation**:
   ```javascript
   // Generate 1024-bit RSA key pair using math implementation
   generateRSASimple(1024) → {public_key: {n, e}, private_key: {n, d}}
   ```

2. **Public Key Transmission**:
   ```javascript
   POST /api/encryption/generate-key
   {
     session_id: uuidv4(),
     user_id: currentUser.id,
     public_key: [n.toString(), e.toString()]
   }
   ```

3. **Server-Side AES Key Generation**:
   ```python
   # Generate random 256-bit AES key
   aes_key = os.urandom(32)
   aes_key_b64 = base64.b64encode(aes_key).decode()

   # Encrypt AES key with client's RSA public key (char-by-char)
   rsa_encrypted = [pow(ord(char), int(e), int(n)) for char in aes_key_b64]
   ```

4. **Secure Key Storage**:
   ```python
   # Store encrypted AES key in database
   session_data = {
     'encryption_key': aes_key_b64,
     'algorithm': 'AES-256-CBC'
   }
   insert into sessions (id, user_id, session_data)

   # Cache plain AES key in memory for operations
   encryption_keys[session_id] = aes_key
   ```

5. **Secure Key Delivery**:
   ```javascript
   // Client receives encrypted AES key as integer list
   encryptedInts = JSON.parse(response.encrypted_aes_key)

   // Decrypt using RSA private key (char-by-char)
   aesKeyB64 = decryptRSASimple(encryptedInts, private_key)

   // Store for session use
   encryptionSessions[sessionId] = aesKeyB64
   ```

---

### 3. Message Encryption & Transmission

**User Sends Message**:

1. **Immediate UI Feedback**:
   ```javascript
   // Show user message instantly
   setChats([...prev, {role: 'user', content: userMessage}])

   // Auto-scroll to show new message
   setTimeout(() => scrollToBottom(), 100)
   ```

2. **AES Encryption**:
   ```javascript
   POST /api/encryption/encrypt
   {
     message: userMessage,
     session_id: chatSessionId
   }

   // Server response:
   {
     encrypted_data: base64(encrypted_content),
     iv: base64(initialization_vector)
   }
   ```

3. **AI Processing Pipeline**:
   ```javascript
   POST /api/ai/generate
   {
     userMessage: {encrypted_data, iv},
     chatHistory: filtered_messages,
     model: 'openai/gpt-3.5-turbo',
     encrypted: true
   }
   ```

4. **Backend Decryption & AI Processing**:
   ```python
   # Decrypt incoming message
   plain_message = aes_decrypt(encrypted_data, iv, session_key)

   # Send to OpenAI API
   ai_response = openai_client.generate(plain_message, history)

   # Re-encrypt AI response
   encrypted_response = aes_encrypt(ai_response, session_key)

   return {response: encrypted_response, iv: new_iv}
   ```

5. **Client Response Handling**:
   ```javascript
   // Decrypt AI response
   ai_plaintext = await encryptionClient.decrypt(response, iv, sessionId)

   // Update UI with decrypted AI message
   setChats([...prev, {role: 'ai', content: ai_plaintext}])

   // No auto-scroll to preserve reading position
   ```

---

### 4. Secure Message Storage

**Database Schema** (Encrypted Only):
```sql
-- Chats table
CREATE TABLE chats (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  title VARCHAR(255),
  encrypted BOOLEAN DEFAULT TRUE
);

-- Messages table (ZERO PLAINTEXT STORAGE)
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  chat_id VARCHAR(36),
  role ENUM('user', 'ai'),
  encrypted_data LONGTEXT,     -- AES-encrypted content
  iv VARCHAR(255),             -- Base64 initialization vector
  session_id VARCHAR(36)       -- Links to encryption key
);

-- Sessions table (Key management)
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  session_data JSON,           -- {encryption_key: base64_encoded}
  created_at TIMESTAMP
);
```

**Data Flow for Message Storage**:
1. Messages encrypted before database insertion
2. Only encrypted data + metadata stored
3. Plain text never touches persistent storage
4. Decryption happens only in client application

---

### 5. Existing Chat Resumption

**Loading Previous Messages**:

1. **Chat Selection**: `setCurrentChatId(chatId)`

2. **Encrypted Message Fetch**:
   ```javascript
   GET /api/chats/:chatId/messages
   // Returns encrypted data only
   [
     {encryptedMessage, iv, sessionId, /* no plain content */},
     ...
   ]
   ```

3. **Client-Side Decryption**:
   ```javascript
   for (const msg of messages) {
     try {
       const plainText = await encryptionClient.decrypt(
         msg.encryptedMessage, msg.iv, msg.sessionId
       );
       // Display decrypted content
     } catch (error) {
       // Show error for undecryptable messages
       displayPlainText('[⚠️ Encrypted message - unable to decrypt]');
     }
   }
   ```

4. **Caching**: Decrypted messages cached in client state

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User authentication
- `DELETE /api/auth/account` - Account deletion

### Chat Management
- `GET /api/chats` - List user chats
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id` - Update chat metadata
- `DELETE /api/chats/:id` - Delete chat
- `GET /api/chats/:id/messages` - Get encrypted messages
- `POST /api/chats/:id/messages` - Store encrypted message

### AI Processing
- `POST /api/ai/generate` - Generate AI response (encrypted)

### Encryption Service (Python)
- `POST /api/encryption/generate-key` - RSA-AES key exchange
- `POST /api/encryption/encrypt` - AES encrypt message
- `POST /api/encryption/decrypt` - AES decrypt message

---

## Security Architecture

### Encryption Layers
1. **RSA (2048-bit)**: Asymmetric key exchange (OAEP padding)
2. **AES-256-CBC**: Symmetric bulk encryption
3. **bcrypt**: Password hashing (10 rounds)
4. **JWT**: Session authentication (24-hour expiry)

### Security Properties
- **Confidentiality**: AES-256 encryption of all messages
- **Integrity**: Message authentication through encryption
- **Forward Secrecy**: Per-session AES keys
- **Perfect Forward Secrecy**: RSA key exchange per chat
- **Zero-Knowledge**: Server never sees plaintext messages

### Threat Protections
- **Man-in-the-Middle**: TLS + End-to-End Encryption
- **Credential Breach**: bcrypt password hashing
- **Session Hijacking**: JWT with expiration
- **Data Breach**: Encrypted database storage
- **Key Compromise**: Session-based key rotation

---

## Technical Implementation Details

### Frontend Technologies
- React 18 with Hooks
- Web Crypto API for RSA operations
- Custom AES implementation
- Local storage for session management

### Backend Technologies
- Node.js + Express (main API)
- Python Flask (encryption microservice)
- MySQL database
- JWT authentication
- OpenRouter/OpenAI integration

### Cryptographic Libraries
- Python: PyCryptoDome (AES, RSA)
- JavaScript: Web Crypto API (RSA) + Custom implementation
- Password hashing: bcrypt

---

## Deployment Options

### 🐳 Docker Deployment (Recommended)
The easiest way to run the application is using Docker:

```bash
# Quick start with Docker
git clone https://github.com/CHINMAYBHT/IS-PROJECT.git
cd IS-PROJECT
cp Backend/.env.example Backend/.env
# Edit Backend/.env with API keys
docker compose up --build
```

**Access:** http://localhost:5173

📖 **See detailed Docker guide**: [`DOCKER_README.md`](DOCKER_README.md)

### 🔧 Manual Development Setup

1. **Database Setup:**
   ```bash
   # Install MySQL and create database manually
   # Follow SETUP.md for complete database setup
   ```

2. **Environment Variables:**
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=password123
   DB_NAME=secure_chat_db

   # Server
   PORT=3001
   JWT_SECRET=your-32-char-jwt-secret

   # AI API
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxx
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   ```

3. **Install Dependencies:**
   ```bash
   # Backend (Node.js)
   cd Backend
   npm install

   # Encryption Service (Python)
   cd ../Backend/encryption
   pip install -r requirements.txt

   # Frontend (React)
   cd ../../Frontend
   npm install
   ```

4. **Start Services:**
   ```bash
   # Terminal 1: MySQL (if not running)
   # Terminal 2: Backend
   cd Backend && npm start

   # Terminal 3: Encryption Service
   cd Backend/encryption && python app.py

   # Terminal 4: Frontend
   cd Frontend && npm run dev
   ```

📖 **See complete setup guide**: [`SETUP.md`](SETUP.md)

### Production Deployment
- Use HTTPS (mandatory for Web Crypto API)
- Secure environment variable management
- Database connection pooling
- Rate limiting on API endpoints
- Key rotation policies

---

## Security Best Practices

1. **Key Management**: AES keys generated per-session, stored encrypted
2. **Data Minimization**: Only encrypted data reaches backend
3. **Secure Transmission**: HTTPS throughout application
4. **Access Control**: JWT authentication with proper scopes
5. **Audit Trail**: Encryption operations logged (no content)
6. **Key Rotation**: Sessions expire preventing stale key use

---

## Compliance & Standards