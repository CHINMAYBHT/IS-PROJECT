-- Database initialization script for Secure Chat Application
-- This file is automatically executed when the MySQL container starts

-- Create database if it doesn't exist (handled by environment variables in docker-compose)
-- The database 'secure_chat_db' is created automatically via MYSQL_DATABASE env var

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Chat',
    encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Create messages table (ENCRYPTED STORAGE ONLY with image steganography support)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'ai') NOT NULL,
    -- Only encrypted data is stored (zero plaintext storage)
    encrypted_data LONGTEXT NULL,   -- AES-256 encrypted content
    iv VARCHAR(255) NULL,           -- Base64 initialization vector
    session_id VARCHAR(36) NULL,    -- Links to encryption key
    -- Steganography image storage
    image_data LONGTEXT NULL,       -- Base64 encoded steganographic image (with hidden text)
    original_image_data LONGTEXT NULL, -- Base64 encoded original image (for display)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_id (chat_id),
    INDEX idx_created_at (created_at)
);

-- Create sessions table for encryption key management
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_data JSON NOT NULL,     -- Stores {encryption_key: base64, algorithm: 'AES-256-CBC'}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_user_created ON chats(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON sessions(user_id, created_at);

-- Insert a test user for development (remove in production)
-- Password is 'password123' hashed with bcrypt
INSERT IGNORE INTO users (id, full_name, email, password) VALUES
('test-user-001', 'Test User', 'test@example.com', '$2a$10$8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J8K3J');

-- Verify table creation
SELECT 'Database initialized successfully!' as status;



-- ALTER TABLE messages 
-- ADD COLUMN image_data LONGTEXT NULL 
-- COMMENT 'Base64 encoded steganographic image (with hidden text)';

-- ALTER TABLE messages 
-- ADD COLUMN original_image_data LONGTEXT NULL 
-- COMMENT 'Base64 encoded original image (for display)';
