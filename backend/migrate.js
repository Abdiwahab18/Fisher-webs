import dotenv from 'dotenv';
import pkg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function migrate() {
  try {
    // Add status column to users
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS profile_picture TEXT
    `);
    console.log('✓ Status and profile_picture columns added to users table');

    // Add missing columns to fish_catches
    await pool.query(`
      ALTER TABLE fish_catches
      ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS catch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'listed',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ Weight, catch_date, status, and updated_at columns added to fish_catches table');

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_info TEXT,
      ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'purchase'
    `);
    console.log('✓ Order metadata fields added to orders table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Notifications table created');

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate().catch(() => process.exit(1));
}