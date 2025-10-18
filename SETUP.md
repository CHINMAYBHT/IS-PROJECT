# Setup and Running Guide - RSA-AES Encrypted Chat Application

This guide will walk you through setting up and running the complete encrypted chat application with end-to-end encryption using RSA-AES hybrid cryptography.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/CHINMAYBHT/IS-PROJECT.git
cd IS-PROJECT

# Follow the detailed setup guide below
```

---

## Prerequisites

### Required Software
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://python.org/)
- **MySQL Server** (v5.7+) - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

### Optional Tools (Recommended)
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Postman** (for API testing) - [Download](https://www.postman.com/)

### Verify Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version

# Check MySQL (connect to verify)
mysql --version
```

---

## 📁 Project Structure

```
IS_Project_EncryptedLLM/
├── Frontend/              # React application
├── Backend/               # Node.js API server
├── Backend/encryption/    # Python encryption microservice
├── Backend/Database/      # Database connection setup
├── README.md              # Project documentation
└── SETUP.md              # This file
```

---

## 🔧 1. Database Setup

### Install and Start MySQL

**Windows:**
1. Download MySQL from [mysql.com](https://dev.mysql.com/downloads/mysql/)
2. Run installer with default settings
3. Set root password: `password123` (or your choice)
4. Note down the password for .env file

**macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### Create Database (Database Only)
**Important:** Tables are created automatically when you run the server!

1. **Connect to MySQL:**
   ```bash
   mysql -u root -p
   # Enter your MySQL root password
   ```

2. **Create just the database:**
   ```sql
   -- Create database only
   CREATE DATABASE secure_chat_db;

   -- Verify database was created
   SHOW DATABASES;

   -- Exit MySQL
   EXIT;
   ```

   #### Option 2: MySQL Workbench (Recommended for beginners)

   **MySQL Workbench** is a graphical tool that's easier for visual learners:

   1. **Download MySQL Workbench** from [mysql.com](https://dev.mysql.com/downloads/workbench/)
   2. **Open MySQL Workbench** and connect to your MySQL server
   3. **Create new connection** if first time:
      - Connection Name: Local MySQL
      - Hostname: 127.0.0.1
      - Port: 3306
      - Username: root
      - Password: your_password (same as .env)
   4. **Click the connection** to open the Query Editor
   5. **Run this SQL:**
      ```sql
      CREATE DATABASE secure_chat_db;
      ```

   **Note:** For creating tables, you can also use Workbench with the same SQL commands if you prefer the graphical interface. But again, the application auto-creates them!

   **⚠️ Table Creation:** The application automatically creates all required tables when server.js starts. You do NOT need to manually create individual tables!

---

## 📝 2. Environment Configuration

### Main Backend (.env)

1. **Copy environment template:**
   ```bash
   cd Backend
   cp .env.example .env
   ```

2. **Edit .env file:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=password123
   DB_NAME=secure_chat_db

   # Server Configuration
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # AI API Configuration (using OpenRouter)
   OPENROUTER_API_KEY=your-openrouter-api-key-here
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions

   # Node Environment
   NODE_ENV=development
   ```

   **⚠️ Important:**
   - Replace `your-super-secret-jwt-key-change-this-in-production` with a strong random string
   - Get OpenRouter API key from [openrouter.ai](https://openrouter.ai/)

### Frontend Configuration

The frontend uses hardcoded URLs (can be changed in `Frontend/src/utils/api.js`):
```javascript
const API_BASE_URL = "http://localhost:3001"; // Express server
const ENCRYPTION_BASE_URL = "http://localhost:5001"; // Python encryption service
```

---

## 🔨 3. Installation & Setup

### Backend (Node.js)

1. **Install dependencies:**
   ```bash
   cd Backend
   npm install
   ```

2. **Test database connection:**
   ```bash
   npm test
   # Look for "Database connection successful" message
   ```

### Python Encryption Service

1. **Install Python dependencies from requirements.txt:**
   ```bash
   cd Backend/encryption
   pip install -r requirements.txt
   ```

   **Contents of requirements.txt:**
   - `PyCryptoDome==3.19.0` - Cryptography library for AES encryption
   - `flask==2.3.3` - Web framework for the encryption microservice
   - `flask-cors==4.0.0` - CORS support for API requests
   - `python-dotenv==1.0.0` - Environment variable loading

2. **Verify installation:**
   ```bash
   python -c "import Crypto; print('PyCryptoDome installed')"
   python -c "from flask import Flask; print('Flask installed')"
   ```

### Frontend (React)

1. **Install dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

---

## 🚀 4. Running the Application

### Start in Order

1. **Start MySQL Server**
   ```bash
   # Windows: Use MySQL Workbench or start service
   # Linux/Mac: sudo systemctl start mysql (or brew services start mysql)
   ```

2. **Start Encryption Service (Python)**
   ```bash
   cd Backend/encryption
   python app.py
   ```
   **Expected output:**
   ```
   🚀 Starting Python Encryption Server...
   💾 Initializing encryption service...
   * Running on http://0.0.0.0:5001/
   ```

3. **Start Main Backend (Node.js)**
   ```bash
   cd Backend
   npm start
   ```
   **Expected output:**
   ```
   🚀 Server is running on port 3001
   💾 Database connected successfully
   ```

4. **Start Frontend (React)**
   ```bash
   cd Frontend
   npm run dev
   ```
   **Expected output:**
   ```
   VITE v5.0.0 ready in 234 ms
   ➜ Local:   http://localhost:5173/
   ➜ Network: http://192.168.1.100:5173/
   ```

### Access the Application

Open your browser and go to: **http://localhost:5173**

---

## 🔐 5. Testing Encryption Features

### 1. User Registration
1. Visit http://localhost:5173
2. Click "Sign Up"
3. Create an account with a strong password
4. Verify JWT token is received

### 2. Create Encrypted Chat
1. Sign in to your account
2. The system will automatically create encrypted chats
3. Look for the blue lock icon indicating encryption

### 3. Test Message Encryption
1. Send a message in chat
2. Check backend console for encryption logs:
   ```
   🔐 [ENCRYPT] Encrypting message...
   ✅ [ENCRYPT] Message encrypted successfully
   🤖 [AI RESPONSE] Decrypted and got response
   ```

### 4. Verify Database Security
1. Connect to MySQL: `mysql -u root -p secure_chat_db`
2. Check messages table:
   ```sql
   SELECT id, encrypted_data, iv, session_id FROM messages LIMIT 5;
   ```
3. Verify only encrypted data is stored (no plain text)

### 5. API Testing (Optional)

**Create Chat:**
```bash
curl -X POST http://localhost:3001/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title": "Test Chat"}'
```

**Test Encryption:**
```bash
curl -X POST http://localhost:5001/api/encryption/generate-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "session_id": "test-session",
    "user_id": "your-user-id",
    "public_key": ["12345", "65537"]
  }'
```

---

## 🔧 6. Troubleshooting

### Common Issues

**Issue: "Database connection failed"**
```
Error: ECONNREFUSED
```
**Solution:**
- Ensure MySQL server is running
- Check DB_HOST, DB_USER, DB_PASS in .env
- Verify database exists: `CREATE DATABASE secure_chat_db;`

**Issue: "Python module not found"**
```
ImportError: No module named 'Crypto'
```
**Solution:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install requirements
cd Backend/encryption
pip install -r requirements.txt

# If still failing, try:
pip install pycryptodome
```

**Issue: "CORS error"**
```
Access to fetch... blocked by CORS policy
```
**Solution:**
- Check if both servers are running on correct ports
- Frontend API_BASE_URL should match backend
- Ensure backend has proper CORS headers

**Issue: "JWT authentication error"**
**Solution:**
- Check JWT_SECRET in backend .env
- Verify token is stored in localStorage
- Check token expiration (24 hours)

**Issue: "Encryption service unavailable"**
```
Failed to fetch http://localhost:5001
```
**Solution:**
1. Ensure Python service is running
2. Check port 5001 is not blocked
3. Verify Flask app is running without errors

**Issue: "OpenRouter API errors"**
**Solution:**
1. Get API key from [openrouter.ai](https://openrouter.ai/)
2. Update OPENROUTER_API_KEY in .env
3. Ensure sufficient credits/quota

### Debugging Tools

**Check running processes:**
```bash
# Check Node.js
netstat -an | find "3001"

# Check Python Flask
netstat -an | find "5001"

# Check MySQL
netstat -an | find "3306"
```

**View logs:**
- Frontend: Browser DevTools Console
- Node.js Backend: Terminal running `npm start`
- Python Service: Terminal running `python app.py`

**Database debugging:**
```sql
-- Check database exists
SHOW DATABASES;

-- Check tables
USE secure_chat_db;
SHOW TABLES;

-- View recent messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
```

---

## 🏗️ Development Workflow

### Code Changes

**Frontend:**
```bash
cd Frontend
npm run dev  # Auto reloads on changes
```

**Backend:**
```bash
cd Backend
npm run dev  # If using nodemon
# or just use npm start
```

**Python Service:**
```bash
cd Backend/encryption
python app.py  # Restart manually after changes
```

### Adding Features

1. **Frontend changes:** Edit React components in `Frontend/src/`
2. **API changes:** Edit `Backend/server.js`
3. **Encryption changes:** Edit `Backend/encryption/app.py` or `AES.py`
4. **Database changes:** Update `Backend/Database/database.js` and run SQL

---

## 📦 Production Deployment

### Environment Setup
1. Use production-grade database (AWS RDS, Google Cloud SQL)
2. Set secure JWT_SECRET (256-bit random string)
3. Use HTTPS certificates
4. Configure firewall rules
5. Set up monitoring and logging

### Performance Optimization
1. Keep Python Flask service behind reverse proxy
2. Use Redis for session caching
3. Implement rate limiting
4. Set up load balancing

### Security Hardening
1. Use environment variable encryption
2. Implement API rate limiting
3. Set up proper CORS policies
4. Enable audit logging
5. Regular security updates

---

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide first
2. Verify all prerequisites are installed
3. Check console logs for error messages
4. Ensure ports 3001, 5001 are available
5. Test database connectivity separately

**Common Questions:**
- **Q:** "Can I use MongoDB instead of MySQL?"
- **A:** The application is specifically designed for MySQL. MongoDB would require significant code changes.

- **Q:** "Can I deploy this on a single server?"
- **A:** Yes, but separate Node.js and Python services for better security isolation.

- **Q:** "How do I reset the database?"
- **A:** Drop and recreate the database, then restart all services.

---

## 📋 Checklist

- ✅ MySQL installed and running
- ✅ Database created with all tables
- ✅ Environment variables configured
- ✅ Backend dependencies installed (npm install)
- ✅ Python dependencies installed (pip install)
- ✅ Frontend dependencies installed (npm install)
- ✅ OpenRouter API key obtained
- ✅ All services can be started successfully
- ✅ User can register and login
- ✅ Encrypted chat creation works
- ✅ Messages are encrypted/decrypted properly
- ✅ AI responses are generated and displayed

**Congratulations!** 🎉 Your RSA-AES encrypted chat application is now running.
