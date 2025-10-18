require('dotenv').config();

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create database connection pool
let dbPool;

console.log('🗄️ [DATABASE] Initializing MySQL connection...');

// Initialize database and create tables
async function initializeDatabase() {
  try {
    dbPool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await dbPool.getConnection();
    console.log('✅ [DATABASE] Connected to MySQL database');

    // Create tables if they don't exist
    await createTables();

    connection.release();
  } catch (error) {
    console.error('❌ [DATABASE] Failed to connect to database:', error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  console.log('🛠️ [DATABASE] Creating tables if needed...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      encrypted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      chat_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('user', 'ai') NOT NULL,
      content LONGTEXT,
      encrypted_data LONGTEXT,
      iv VARCHAR(255),
      session_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      session_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of tables) {
    await dbPool.execute(sql);
  }

  console.log('✅ [DATABASE] All tables created/verified');
}

// Execute a query and return connection for cleanup
async function executeQuery(sql, params = []) {
  const connection = await dbPool.getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    return result;
  } finally {
    connection.release();
  }
}

// Get a database connection for transactions or multiple queries
async function getConnection() {
  return await dbPool.getConnection();
}

module.exports = {
  initializeDatabase,
  executeQuery,
  getConnection,
  dbPool
};
