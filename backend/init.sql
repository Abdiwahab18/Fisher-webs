-- Run this script in PostgreSQL to create all tables.

-- Users table
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

-- Fish species table
CREATE TABLE IF NOT EXISTS fish_species (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish catches table
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

-- Orders table
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

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  fish_id INTEGER REFERENCES fish_catches(id) ON DELETE CASCADE,
  weight DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
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
