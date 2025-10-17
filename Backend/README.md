# Backend Servers

This project contains two backend servers:

## 1. Express API Server (Port 3001)

Handles authentication, chat management, and AI API proxy.

### Features:
- User authentication (signup/signin)
- JWT-based authorization
- Chat CRUD operations
- AI response generation via OpenRouter API

### Installation:
```bash
cd Backend
npm install
```

### Configuration:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file and add your OpenRouter API key
# OPENROUTER_API_KEY=your-api-key-here
# Change JWT_SECRET for production
```

### Running:
```bash
node server.js
```

## 2. Python Encryption Server (Port 5001)

Provides AES-256 encryption/decryption services.

### Features:
- Generate encryption keys
- Encrypt/decrypt data with AES-256-CBC
- Session-based key management

### Installation:
```bash
cd Backend/encryption
pip install -r requirements.txt
```

### Running:
```bash
python app.py
```

## Starting Both Servers

On Windows, you can use the included `start.bat` script:

```cmd
Backend\start.bat
```

This will:
1. Install dependencies for both servers
2. Start the Express server on port 3001
3. Start the Python encryption server on port 5001

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in

### Chat Management
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id` - Update chat title
- `DELETE /api/chats/:id` - Delete specific chat
- `DELETE /api/chats` - Delete all user chats

### AI Generation
- `POST /api/ai/generate` - Generate AI response

### Encryption Services
- `GET /api/encryption/health` - Health check
- `POST /api/encryption/generate-key` - Generate encryption key
- `POST /api/encryption/encrypt` - Encrypt data
- `POST /api/encryption/decrypt` - Decrypt data

## Frontend Integration

The frontend has been updated to use these backend services instead of localStorage and direct API calls.

Key changes:
- Authentication now uses JWT tokens
- Chat data is persisted on the backend
- AI responses go through the backend proxy
- Encryption service available for secure chat sessions

## Database

Currently using in-memory storage. For production, implement persistent database storage with proper user isolation and data encryption.
