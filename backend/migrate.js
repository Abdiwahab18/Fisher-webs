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
      ADD COLUMN IF NOT EXISTS profile_picture TEXT,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
      ADD COLUMN IF NOT EXISTS facebook VARCHAR(255)
    `);
    console.log('✓ Status, profile_picture, and contact columns added to users table');

    // Create fish_species table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fish_species (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ fish_species table created');

    // Add some default fish species
    await pool.query(`
      INSERT INTO fish_species (name, description) VALUES
        ('Hamur', 'Also known as Grouper, a popular local fish.'),
        ('Kingfish', 'Highly prized commercial fish found in tropical seas.'),
        ('Tuna', 'Large pelagic fish, widely consumed and exported.'),
        ('Snapper', 'Popular reef fish with sweet, firm white meat.'),
        ('Mackerel', 'Pelagic species known for its rich flavor and oils.')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✓ Default fish species inserted');

    // Add fish_species_id to fish_catches
    await pool.query(`
      ALTER TABLE fish_catches
      ADD COLUMN IF NOT EXISTS fish_species_id INTEGER REFERENCES fish_species(id) ON DELETE SET NULL
    `);
    console.log('✓ Added fish_species_id to fish_catches table');

    // Migrate existing catches: insert missing fish names to fish_species, and link them to fish_catches
    // First, check if fish_name column exists in fish_catches before querying it
    const checkCol = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='fish_catches' and column_name='fish_name'
    `);
    
    if (checkCol.rows.length > 0) {
      await pool.query(`
        -- Insert any existing fish_name from fish_catches into fish_species
        INSERT INTO fish_species (name)
        SELECT DISTINCT fish_name 
        FROM fish_catches 
        WHERE fish_name IS NOT NULL AND TRIM(fish_name) <> ''
        ON CONFLICT (name) DO NOTHING;

        -- Update fish_species_id in fish_catches based on fish_name match
        UPDATE fish_catches fc
        SET fish_species_id = fs.id
        FROM fish_species fs
        WHERE LOWER(TRIM(fc.fish_name)) = LOWER(TRIM(fs.name))
          AND fc.fish_species_id IS NULL;
          
        -- Drop fish_name column
        ALTER TABLE fish_catches DROP COLUMN IF EXISTS fish_name;
      `);
      console.log('✓ Migrated existing fish_catches to use fish_species_id and dropped fish_name column');
    }

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
      ADD COLUMN IF NOT EXISTS fisherman_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS delivery_info TEXT,
      ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'purchase',
      ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS estimated_delivery_time VARCHAR(100),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ Order metadata and delivery fields added to orders table');

    // Backfill fisherman_id for existing orders
    await pool.query(`
      UPDATE orders o
      SET fisherman_id = (
        SELECT fc.user_id 
        FROM order_items oi 
        JOIN fish_catches fc ON oi.fish_id = fc.id 
        WHERE oi.order_id = o.id 
        LIMIT 1
      )
      WHERE o.fisherman_id IS NULL
    `);
    console.log('✓ Backfilled fisherman_id for existing orders');

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

    await pool.query(`
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
      )
    `);
    console.log('✓ Delivery driver registry table created');

    // Migrate quantity to weight
    try {
      await pool.query(`
        UPDATE fish_catches SET weight = quantity WHERE weight IS NULL;
        ALTER TABLE fish_catches DROP COLUMN IF EXISTS quantity;
      `);
    } catch (err) {
      if (err.code !== '42703') throw err;
    }
    
    // For order_items, rename quantity to weight if quantity exists
    try {
      await pool.query(`
        ALTER TABLE order_items RENAME COLUMN quantity TO weight;
      `);
    } catch (err) {
      // Ignore error if column is already renamed
      if (err.code !== '42703') {
        throw err;
      }
    }
    console.log('✓ Converted quantity to weight globally');

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