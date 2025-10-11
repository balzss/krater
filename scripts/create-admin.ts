/**
 * Create an admin user in the Better Auth database
 * Usage: ADMIN_PASSWORD=yourpassword npx tsx scripts/create-admin.ts
 */

import Database from 'better-sqlite3'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const scryptAsync = promisify(scrypt)

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

async function createAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable not set')
    console.error('Usage: ADMIN_PASSWORD=yourpassword npx tsx scripts/create-admin.ts')
    process.exit(1)
  }

  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './krater.db'
  const db = new Database(dbPath)

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT email FROM user WHERE email = ?').get('admin@krater.local')

    if (existing) {
      console.log('ℹ️  Admin user already exists')
      console.log('   Email: admin@krater.local')
      console.log('   To reset password, delete the user first or manually update the database')
      process.exit(0)
    }

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword)
    const now = Date.now()
    const userId = randomBytes(16).toString('hex')
    const accountId = randomBytes(16).toString('hex')

    // Insert user
    db.prepare(
      `
      INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(userId, 'Admin', 'admin@krater.local', 1, now, now)

    // Insert account (for email/password auth)
    db.prepare(
      `
      INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(accountId, 'admin@krater.local', 'credential', userId, hashedPassword, now, now)

    console.log('✅ Admin user created successfully!')
    console.log('   Email: admin@krater.local')
    console.log('   Name: Admin')
    console.log('')
    console.log('You can now login at http://localhost:3000/login')
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error creating admin user:', error.message)
    } else {
      console.error('❌ Unknown error:', error)
    }
    process.exit(1)
  } finally {
    db.close()
  }
}

createAdmin()
