-- Run this script in PostgreSQL to create all tables.

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish catches table
CREATE TABLE IF NOT EXISTS fish_catches (
  id SERIAL PRIMARY KEY,
  fish_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  weight DECIMAL(10,2),
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
  order_type VARCHAR(50) DEFAULT 'purchase',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  fish_id INTEGER REFERENCES fish_catches(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
