/**
 * migrate-to-neon.js
 * 
 * Waxaan isticmaalnaa script-kan si aan u:
 * 1. Tables-ka Neon ku samaynno (init.sql schema)
 * 2. Data-da local PostgreSQL ka qaadanno
 * 3. Neon-ka ku shubno
 * 
 * Run: node migrate-to-neon.js
 */

import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// ── Neon (cloud) connection ──────────────────────────────────────────────────
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Local PostgreSQL connection ──────────────────────────────────────────────
const localPool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'root123',
  database: 'Fishingapp',
});

// ── Schema SQL ───────────────────────────────────────────────────────────────
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  profile_picture TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  facebook VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_species (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_catches (
  id SERIAL PRIMARY KEY,
  fish_species_id INTEGER REFERENCES fish_species(id) ON DELETE CASCADE,
  weight DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(255),
  image TEXT,
  status VARCHAR(50) DEFAULT 'listed',
  catch_date DATE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  fisherman_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  delivery_info TEXT,
  order_type VARCHAR(50) DEFAULT 'purchase',
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  delivery_confirmed BOOLEAN DEFAULT FALSE,
  customer_confirmed BOOLEAN DEFAULT FALSE,
  estimated_delivery_time VARCHAR(100),
  truck_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_drivers (
  id SERIAL PRIMARY KEY,
  fisherman_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  vehicle_type VARCHAR(100),
  vehicle_number VARCHAR(100),
  vehicle_color VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  fish_id INTEGER REFERENCES fish_catches(id) ON DELETE CASCADE,
  weight DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50),
  reference VARCHAR(255),
  sender_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// ── Helper: copy table ────────────────────────────────────────────────────────
async function copyTable(tableName, localClient, neonClient) {
  try {
    const result = await localClient.query(`SELECT * FROM ${tableName} ORDER BY id`);
    const rows = result.rows;

    if (rows.length === 0) {
      console.log(`   ⚪ ${tableName}: empty, skipping`);
      return;
    }

    const columns = Object.keys(rows[0]);
    const colList = columns.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of rows) {
      const values = columns.map(c => row[c]);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      try {
        await neonClient.query(
          `INSERT INTO ${tableName} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (rowErr) {
        console.warn(`   ⚠️  Skipped row id=${row.id}: ${rowErr.message}`);
      }
    }

    // Sync sequence
    await neonClient.query(
      `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM ${tableName}), 1))`
    );

    console.log(`   ✅ ${tableName}: ${inserted}/${rows.length} rows copied`);
  } catch (err) {
    console.warn(`   ⚠️  Could not copy ${tableName}: ${err.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n🚀 Starting migration: Local PostgreSQL → Neon\n');

  const neonClient = await neonPool.connect();
  let localClient = null;
  let hasLocalData = false;

  // Step 1: Create schema on Neon
  console.log('📐 Step 1: Creating schema on Neon...');
  try {
    await neonClient.query(SCHEMA_SQL);
    console.log('   ✅ Schema created successfully\n');
  } catch (err) {
    console.error('   ❌ Schema creation failed:', err.message);
    neonClient.release();
    process.exit(1);
  }

  // Step 2: Try connecting to local DB for data migration
  console.log('📦 Step 2: Connecting to local database...');
  try {
    localClient = await localPool.connect();
    hasLocalData = true;
    console.log('   ✅ Local DB connected\n');
  } catch (err) {
    console.warn('   ⚠️  Could not connect to local DB (skipping data migration):', err.message);
    console.log('   ℹ️  Tables were created on Neon — you can start fresh.\n');
  }

  // Step 3: Copy data in dependency order
  if (hasLocalData) {
    console.log('📋 Step 3: Copying data to Neon...');
    const tables = [
      'users',
      'fish_species',
      'fish_catches',
      'orders',
      'delivery_drivers',
      'order_items',
      'notifications',
      'payments',
    ];

    for (const table of tables) {
      await copyTable(table, localClient, neonClient);
    }

    localClient.release();
    console.log('');
  }

  neonClient.release();
  await neonPool.end();
  if (hasLocalData) await localPool.end();

  console.log('🎉 Migration complete! Your database is now on Neon.\n');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
