const API_BASE_URL = "http://localhost:3001"; // Express server
const ENCRYPTION_BASE_URL = "http://localhost:5001"; // Python encryption service

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Auto-retrieve token from localStorage if not already set
    if (!this.token) {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Try to parse error body, but handle cases where there's no body (204, etc.)
        try {
          const errorBody = await response.json();
          throw new Error(`API request failed with status ${response.status}. Error: ${errorBody.error || 'Unknown error'}`);
        } catch (jsonError) {
          // If we can't parse JSON, create error from status
          throw new Error(`API request failed with status ${response.status}`);
        }
      }

      // Handle 204 No Content (successful DELETE operations)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Authentication
  async signUp(userData) {
    try {
      const result = await this.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      this.setToken(result.token);
      return result;
    } catch (error) {
      // Provide user-friendly error messages based on error type
      if (error.message.includes('User already exists')) {
        throw new Error('An account with this email already exists. Please use a different email or sign in instead.');
      } else if (error.message.includes('400')) {
        throw new Error('Please check your input and try again.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'Sign up failed. Please try again.');
      }
    }
  }

  async signIn(credentials) {
    try {
      const result = await this.request('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      this.setToken(result.token);
      return result;
    } catch (error) {
      // Provide user-friendly error messages based on error type
      if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'Sign in failed. Please try again.');
      }
    }
  }

  async deleteAccount() {
    return await this.request('/api/auth/account', {
      method: 'DELETE'
    });
  }

  // Chat operations
  async getChats() {
    return await this.request('/api/chats');
  }

  async createChat(chatData) {
    return await this.request('/api/chats', {
      method: 'POST',
      body: JSON.stringify(chatData)
    });
  }

  async updateChat(chatId, updateData) {
    return await this.request(`/api/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteChat(chatId) {
    return await this.request(`/api/chats/${chatId}`, {
      method: 'DELETE'
    });
  }

  async deleteAllChats() {
    return await this.request('/api/chats', {
      method: 'DELETE'
    });
  }

  // AI response generation
  async generateAiResponse(userMessage, chatHistory, model = "openai/gpt-3.5-turbo", encrypted = false, sessionId = null, userId = null, imageData = null) {
    try {
      // Prepare request body
      const requestBody = {
        userMessage,
        chatHistory,
        model,
        encrypted,
        imageData  // Add image data
      };

      // Add encryption parameters if provided
      if (encrypted && sessionId && userId) {
        requestBody.sessionId = sessionId;
        requestBody.userId = userId;
      }

      const result = await this.request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return result; // Return full result object (includes response, iv, encrypted flag)
    } catch (error) {
      console.error("Error calling AI API:", error);
      
      // Enhanced error message with model switching suggestion
      let errorMessage = `There was an error connecting to the AI. Please check the console and ensure your API key is valid and has the necessary permissions.\n\n**Error:** ${error.message}`;
      
      // Add suggestion to try different model if it's a 500 error
      if (error.message.includes('500')) {
        errorMessage += `\n\n💡 **Tip:** This model might be temporarily unavailable. Try switching to a different model using the model selector.`;
      }
      
      return errorMessage;
    }
  }

  // Chat message storage and retrieval for encrypted chats
  async storeEncryptedMessage(chatId, message, encryptedMessage, iv, sessionId, role = 'user') {
    return await this.request(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: message || null,  // Plain text content
        encryptedMessage: encryptedMessage || null,  // Encrypted data
        iv: iv || null,
        sessionId: sessionId || null,
        role: role || 'user'
      })
    });
  }

  async getEncryptedMessages(chatId) {
    return await this.request(`/api/chats/${chatId}/messages`);
  }
}

// Encryption service client
class EncryptionClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${ENCRYPTION_BASE_URL}${endpoint}`;
    
    // Auto-retrieve token from localStorage if not already set
    if (!this.token) {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Encryption API request failed with status ${response.status}. Error: ${errorBody.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Encryption API Error:", error);
      throw error;
    }
  }

  async generateKey(sessionId, userId) {
    try {
      console.log('🔐 Starting RSA key exchange for AES key generation...');

      // Generate RSA keys using simple implementation
      const rsaKeys = generateRSASimple(2048);

      console.log('🔑 RSA key pair generated, sending public key to server...');

      // Send public key to server and receive RSA-encrypted AES key
      const response = await this.request('/api/encryption/generate-key', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          public_key: [rsaKeys.public_key.n.toString(), rsaKeys.public_key.e.toString()]
        })
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate encryption key');
      }

      console.log('🔓 Received RSA-encrypted AES key, decrypting...');

      // Parse RSA-encrypted AES key (list of integers) and decrypt with simple RSA
      const encryptedInts = JSON.parse(response.encrypted_aes_key);
      const decryptedText = decryptRSASimple(encryptedInts, rsaKeys.private_key);

      console.log('✅ AES key successfully decrypted from RSA envelope');

      return {
        success: true,
        key: decryptedText,
        session_id: response.session_id
      };

    } catch (error) {
      console.error('Encryption key exchange error:', error);
      throw error;
    }
  }

  async encrypt(message, sessionId) {
    return await this.request('/api/encryption/encrypt', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId
      })
    });
  }

  async decrypt(encryptedData, iv, sessionId) {
    return await this.request('/api/encryption/decrypt', {
      method: 'POST',
      body: JSON.stringify({
        encrypted_data: encryptedData,
        iv,
        session_id: sessionId
      })
    });
  }
}

// Utility function to convert base64url to BigInt
function base64UrlToBigInt(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(paddedBase64);
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return BigInt('0x' + hex);
}

// Utility function to convert BigInt to Uint8Array
function bigIntToUint8Array(bigInt) {
  const hex = bigInt.toString(16).padStart(256, '0'); // Assume 2048-bit RSA (256 bytes)
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

// Simple RSA key generation (matches Python implementation)
function generateRSASimple(keySize = 1024) {
  // Use simplified key generation for compatibility
  // For demo purposes, using pre-computed small primes
  // In production, use proper random prime generation
  let p = 61n; // small prime for demo
  let q = 53n; // small prime for demo
  const n = p * q;
  const phi_n = (p - 1n) * (q - 1n);
  let e = 65537n; // common exponent
  if (gcd(e, phi_n) !== 1n) {
    e = 3n;
  }

  const d = modInverse(e, phi_n);

  return {
    public_key: { n, e },
    private_key: { n, d }
  };
}

// Euclidean algorithm to compute gcd
function gcd(a, b) {
  while (b !== 0n) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Modular inverse using extended Euclidean algorithm
function modInverse(a, m) {
  let m0 = m;
  let y = 0n, x = 1n;
  if (m === 1n) return 0n;

  while (a > 1n) {
    let q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = y;
    y = x - q * y;
    x = t;
  }

  if (x < 0n) x += m0;
  return x;
}

// RSA encryption (char by char, matches Python implementation)
function encryptRSASimple(message, public_key) {
  const { n, e } = public_key;
  const encmsg = [];
  for (let i = 0; i < message.length; i++) {
    const charCode = BigInt(message.charCodeAt(i));
    const encrypted = modPow(charCode, e, n);
    encmsg.push(encrypted);
  }
  return encmsg;
}

// RSA decryption (char by char, matches Python implementation)
function decryptRSASimple(encryptedInts, private_key) {
  const { n, d } = private_key;
  let decmsg = '';
  for (let i = 0; i < encryptedInts.length; i++) {
    const decrypted = modPow(BigInt(encryptedInts[i]), d, n);
    decmsg += String.fromCharCode(Number(decrypted));
  }
  return decmsg;
}

// Modular exponentiation
function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp >> 1n;
    base = (base * base) % mod;
  }
  return result;
}

// RSA encryption with simple implementation
function rsaEncrypt(message, public_key) {
  return encryptRSASimple(message, public_key);
}

// RSA decryption with simple implementation
function rsaDecrypt(encryptedInts, private_key) {
  return decryptRSASimple(encryptedInts, private_key);
}

// Export instances
export const apiClient = new ApiClient();
export const encryptionClient = new EncryptionClient();

// For backward compatibility, export the original function but with backend integration
export const generateAiResponse = async (userMessage, chatHistory) => {
  return await apiClient.generateAiResponse(userMessage, chatHistory);
};
