import pool from '../config/db.js';

export async function getDriversByFisherman(fishermanId) {
  const result = await pool.query(
    `SELECT dd.*, u.name AS account_name, u.email AS login_email, u.status AS account_status
     FROM delivery_drivers dd
     LEFT JOIN users u ON dd.user_id = u.id
     WHERE dd.fisherman_id = $1
     ORDER BY dd.created_at DESC`,
    [fishermanId]
  );
  return result.rows;
}

export async function createDriverUser({ name, email, password }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, email, password, 'driver', 'active']
  );
  return result.rows[0];
}

export async function createDriverDetails({ fishermanId, userId, name, phone, vehicle_type, vehicle_number, vehicle_color, status }) {
  const result = await pool.query(
    `INSERT INTO delivery_drivers (fisherman_id, user_id, name, phone, vehicle_type, vehicle_number, vehicle_color, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [fishermanId, userId, name, phone, vehicle_type || null, vehicle_number || null, vehicle_color || null, status]
  );
  return result.rows[0];
}

export async function getDriverByIdAndFisherman(driverId, fishermanId) {
  const result = await pool.query(
    'SELECT * FROM delivery_drivers WHERE id = $1 AND fisherman_id = $2',
    [driverId, fishermanId]
  );
  return result.rows[0];
}

export async function getDriverById(driverId) {
  const result = await pool.query(
    'SELECT * FROM delivery_drivers WHERE id = $1',
    [driverId]
  );
  return result.rows[0];
}

export async function updateDriverUser(userId, { name, email, password, status }) {
  const userUpdates = [];
  const userValues = [];
  let uIndex = 1;

  if (name !== undefined) {
    userUpdates.push(`name = $${uIndex++}`);
    userValues.push(name);
  }
  if (email !== undefined) {
    userUpdates.push(`email = $${uIndex++}`);
    userValues.push(email);
  }
  if (password !== undefined) {
    userUpdates.push(`password = $${uIndex++}`);
    userValues.push(password);
  }
  if (status !== undefined) {
    userUpdates.push(`status = $${uIndex++}`);
    userValues.push(status);
  }

  if (userUpdates.length === 0) return null;

  userValues.push(userId);
  await pool.query(
    `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${uIndex}`,
    userValues
  );
}

export async function updateDriverDetails(driverId, fishermanId, { name, phone, vehicle_type, vehicle_number, vehicle_color, status }) {
  const updates = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    updates.push(`name = $${index++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${index++}`);
    values.push(phone);
  }
  if (vehicle_type !== undefined) {
    updates.push(`vehicle_type = $${index++}`);
    values.push(vehicle_type);
  }
  if (vehicle_number !== undefined) {
    updates.push(`vehicle_number = $${index++}`);
    values.push(vehicle_number);
  }
  if (vehicle_color !== undefined) {
    updates.push(`vehicle_color = $${index++}`);
    values.push(vehicle_color);
  }
  if (status !== undefined) {
    updates.push(`status = $${index++}`);
    values.push(status);
  }

  if (updates.length === 0) return null;

  values.push(driverId, fishermanId);
  const result = await pool.query(
    `UPDATE delivery_drivers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index++} AND fisherman_id = $${index} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteDriverDetails(driverId) {
  const result = await pool.query('DELETE FROM delivery_drivers WHERE id = $1 RETURNING *', [driverId]);
  return result.rows[0];
}

export async function deleteUser(userId) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
  return result.rows[0];
}
