import pool from '../config/db.js';

export async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query('SELECT id, name, email, role, profile_picture, status, phone, whatsapp, facebook FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createUser({ name, email, password, role, profile_picture = null }) {
  const result = await pool.query(
    'INSERT INTO users (name, email, password, role, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, profile_picture',
    [name, email, password, role, profile_picture]
  );
  return result.rows[0];
}

export async function getAllUsers() {
  const result = await pool.query('SELECT id, name, email, role, profile_picture, status, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function getUsersByRole(role) {
  const result = await pool.query('SELECT id, name, email, role, profile_picture, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
  return result.rows;
}

export async function deleteUserById(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

export async function updateUserStatus(id, status) {
  const result = await pool.query(
    'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status',
    [status, id]
  );
  return result.rows[0];
}

export async function updateUserProfile(id, { name, email, profile_picture, phone, whatsapp, facebook }) {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined && name !== null) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (email !== undefined && email !== null) {
    updates.push(`email = $${paramCount++}`);
    values.push(email);
  }

  if (profile_picture !== undefined) {
    updates.push(`profile_picture = $${paramCount++}`);
    values.push(profile_picture);
  }

  if (phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }

  if (whatsapp !== undefined) {
    updates.push(`whatsapp = $${paramCount++}`);
    values.push(whatsapp);
  }

  if (facebook !== undefined) {
    updates.push(`facebook = $${paramCount++}`);
    values.push(facebook);
  }

  if (updates.length === 0) {
    return null;
  }

  values.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, profile_picture, status, phone, whatsapp, facebook`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getSystemStats() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'fisherman') as total_fishermen,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status IN ('completed', 'delivered') AND payment_status = 'paid') as total_revenue,
      (SELECT COUNT(*) FROM fish_catches) as total_catches,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT COUNT(*) FROM orders WHERE status IN ('completed', 'delivered')) as completed_orders
  `);
  return result.rows[0];
}

export async function getRevenueByDay(days = 7) {
  const result = await pool.query(`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(total_price), 0) as revenue,
      COUNT(*) as order_count
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1 AND payment_status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [days]);
  return result.rows;
}

export async function getAdminContact() {
  const result = await pool.query(
    "SELECT name, email, phone, whatsapp, facebook FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
  );
  return result.rows[0];
}
