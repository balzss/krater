/**
 * Initialize Better Auth database schema
 * This script will create the necessary tables for Better Auth
 */

import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './krater.db'

console.log('Initializing database at:', dbPath)

const db = new Database(dbPath)

// Create Better Auth tables
const schema = `
-- User table
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Session table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Account table
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Verification table
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
`

try {
  db.exec(schema)
  console.log('✓ Database schema created successfully')
  console.log('✓ Tables: user, session, account, verification')
} catch (error) {
  console.error('Error creating schema:', error)
  process.exit(1)
} finally {
  db.close()
}
