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
  async generateAiResponse(userMessage, chatHistory, model = "openai/gpt-3.5-turbo", encrypted = false, sessionId = null, userId = null) {
    try {
      // Prepare request body
      const requestBody = {
        userMessage,
        chatHistory,
        model,
        encrypted
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
      return `There was an error connecting to the AI. Please check the console and ensure your API key is valid and has the necessary permissions. \n\n**Error:** ${error.message}`;
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
  async request(endpoint, options = {}) {
    const url = `${ENCRYPTION_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

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
    return await this.request('/api/encryption/generate-key', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, user_id: userId })
    });
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

// Export instances
export const apiClient = new ApiClient();
export const encryptionClient = new EncryptionClient();

// For backward compatibility, export the original function but with backend integration
export const generateAiResponse = async (userMessage, chatHistory) => {
  return await apiClient.generateAiResponse(userMessage, chatHistory);
};
