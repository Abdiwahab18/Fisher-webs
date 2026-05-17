import pool from '../config/db.js';

export async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createUser({ name, email, password, role }) {
  const result = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, email, password, role]
  );
  return result.rows[0];
}

export async function getAllUsers() {
  const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function deleteUserById(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}


// Fish catches functions
export async function createFishCatch({ fish_name, quantity, price, location, image, user_id }) {
  const result = await pool.query(
    'INSERT INTO fish_catches (fish_name, quantity, price, location, image, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [fish_name, quantity, price, location, image, user_id]
  );
  return result.rows[0];
}

export async function getFishCatchesByUser(user_id) {
  const result = await pool.query(
    'SELECT * FROM fish_catches WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return result.rows;
}

export async function getAllFishCatches() {
  const result = await pool.query('SELECT * FROM fish_catches ORDER BY created_at DESC');
  return result.rows;
}

export async function getFishCatchById(id) {
  const result = await pool.query('SELECT * FROM fish_catches WHERE id = $1', [id]);
  return result.rows[0];
}

// Orders functions
export async function createOrder({ user_id, total_price, status = 'pending' }) {
  const result = await pool.query(
    'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING *',
    [user_id, total_price, status]
  );
  return result.rows[0];
}

export async function getOrdersByUser(user_id) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return result.rows;
}

export async function getAllOrders() {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return result.rows;
}

export async function updateOrderStatus(id, status) {
  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

// Order items functions
export async function createOrderItem({ order_id, fish_id, quantity, price }) {
  const result = await pool.query(
    'INSERT INTO order_items (order_id, fish_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
    [order_id, fish_id, quantity, price]
  );
  return result.rows[0];
}

export async function getOrderItems(order_id) {
  const result = await pool.query(
    'SELECT oi.*, fc.fish_name, fc.image FROM order_items oi JOIN fish_catches fc ON oi.fish_id = fc.id WHERE oi.order_id = $1',
    [order_id]
  );
  return result.rows;
}
