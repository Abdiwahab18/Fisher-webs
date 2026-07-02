import pool from '../config/db.js';

export async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query('SELECT id, name, email, role, profile_picture, status FROM users WHERE id = $1', [id]);
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

export async function updateUserProfile(id, { name, email, profile_picture }) {
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

  if (updates.length === 0) {
    return null;
  }

  values.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, profile_picture, status`;
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


// Fish catches functions
export async function findActiveCatchBySpeciesAndUser(userId, fishName) {
  const result = await pool.query(
    `SELECT * FROM fish_catches 
     WHERE user_id = $1 
       AND LOWER(TRIM(fish_name)) = LOWER(TRIM($2)) 
       AND status = 'listed'
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId, fishName]
  );
  return result.rows[0];
}

export async function incrementCatchWeight(id, additionalWeight, { price, location, image, catch_date }) {
  const result = await pool.query(
    `UPDATE fish_catches
     SET weight = weight + $1,
         price = COALESCE($2, price),
         location = COALESCE($3, location),
         image = COALESCE($4, image),
         catch_date = COALESCE($5, catch_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [additionalWeight, price, location, image, catch_date, id]
  );
  return result.rows[0];
}

export async function createFishCatch({ fish_name, weight, price, location, image, catch_date, user_id }) {
  const result = await pool.query(
    'INSERT INTO fish_catches (fish_name, weight, price, location, image, catch_date, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [fish_name, weight, price, location, image, catch_date, user_id]
  );
  return result.rows[0];
}

export async function getFishCatchesByUser(user_id) {
  const result = await pool.query(
    `SELECT
      fc.*,
      u.id AS fisherman_id,
      u.name AS fisherman_name,
      u.email AS fisherman_email,
      u.profile_picture AS fisherman_profile_picture
    FROM fish_catches fc
    LEFT JOIN users u ON fc.user_id = u.id
    WHERE fc.user_id = $1
    ORDER BY fc.created_at DESC`,
    [user_id]
  );
  return result.rows;
}

export async function getAllFishCatches() {
  const result = await pool.query(
    `SELECT
      fc.*,
      u.id AS fisherman_id,
      u.name AS fisherman_name,
      u.email AS fisherman_email,
      u.profile_picture AS fisherman_profile_picture
    FROM fish_catches fc
    LEFT JOIN users u ON fc.user_id = u.id
    ORDER BY fc.created_at DESC`
  );
  return result.rows;
}

export async function getFishCatchById(id) {
  const result = await pool.query('SELECT * FROM fish_catches WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateFishCatch(id, { fish_name, weight, price, location, image, catch_date, status }) {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (fish_name !== undefined) {
    updates.push(`fish_name = $${paramCount++}`);
    values.push(fish_name);
  }
  if (weight !== undefined) {
    updates.push(`weight = $${paramCount++}`);
    values.push(weight);
  }
  if (price !== undefined) {
    updates.push(`price = $${paramCount++}`);
    values.push(price);
  }
  if (location !== undefined) {
    updates.push(`location = $${paramCount++}`);
    values.push(location);
  }
  if (image !== undefined) {
    updates.push(`image = $${paramCount++}`);
    values.push(image);
  }
  if (catch_date !== undefined) {
    updates.push(`catch_date = $${paramCount++}`);
    values.push(catch_date);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE fish_catches SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function reduceFishCatchWeight(id, weight) {
  const result = await pool.query(
    `UPDATE fish_catches
       SET weight = GREATEST(weight - $1, 0),
           status = CASE WHEN weight - $1 <= 0 THEN 'sold' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [weight, id]
  );
  return result.rows[0];
}

export async function restoreFishCatchWeight(id, weight) {
  const result = await pool.query(
    `UPDATE fish_catches
       SET weight = weight + $1,
           status = CASE WHEN weight + $1 > 0 AND status = 'sold' THEN 'listed' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [weight, id]
  );
  return result.rows[0];
}

export async function deleteFishCatch(id) {
  const result = await pool.query('DELETE FROM fish_catches WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

// Earnings functions
export async function getFishermanEarnings(fisherman_id) {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN o.total_price ELSE 0 END), 0) as total_earnings,
      COALESCE(SUM(CASE WHEN o.status = 'pending' THEN o.total_price ELSE 0 END), 0) as pending_earnings,
      COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'delivered') THEN o.id END) as completed_orders,
      COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN fish_catches fc ON oi.fish_id = fc.id
     WHERE fc.user_id = $1`,
    [fisherman_id]
  );
  return result.rows[0];
}

export async function getDailyEarnings(fisherman_id, days = 30) {
  const result = await pool.query(
    `SELECT
      DATE(o.created_at) as date,
      COALESCE(SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN o.total_price ELSE 0 END), 0) as earnings,
      COUNT(DISTINCT o.id) as order_count
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN fish_catches fc ON oi.fish_id = fc.id
     WHERE fc.user_id = $1 AND o.created_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY DATE(o.created_at)
     ORDER BY date ASC`,
    [fisherman_id, days]
  );
  return result.rows;
}

export async function getMonthlyEarnings(fisherman_id, months = 12) {
  const result = await pool.query(
    `SELECT
      DATE_TRUNC('month', o.created_at)::DATE as month,
      COALESCE(SUM(CASE WHEN o.status IN ('completed', 'delivered') THEN o.total_price ELSE 0 END), 0) as earnings,
      COUNT(DISTINCT o.id) as order_count
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN fish_catches fc ON oi.fish_id = fc.id
     WHERE fc.user_id = $1 AND o.created_at >= NOW() - INTERVAL '1 month' * $2
     GROUP BY DATE_TRUNC('month', o.created_at)
     ORDER BY month ASC`,
    [fisherman_id, months]
  );
  return result.rows;
}
export async function createOrder({ user_id, total_price, status = 'pending', delivery_info = null, order_type = 'purchase' }) {
  const result = await pool.query(
    'INSERT INTO orders (user_id, total_price, status, delivery_info, order_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user_id, total_price, status, delivery_info, order_type]
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

export async function createNotification({ user_id, message, is_read = false }) {
  const result = await pool.query(
    'INSERT INTO notifications (user_id, message, is_read) VALUES ($1, $2, $3) RETURNING *',
    [user_id, message, is_read]
  );
  return result.rows[0];
}

export async function getNotificationsByUser(user_id) {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return result.rows;
}

export async function markNotificationRead(notification_id, user_id) {
  const result = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [notification_id, user_id]
  );
  return result.rows[0];
}

export async function markAllNotificationsRead(user_id) {
  const result = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 RETURNING *',
    [user_id]
  );
  return result.rows;
}

export async function updateOrderStatus(id, status) {
  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

export async function getOrdersByFisherman(fisherman_id) {
  const result = await pool.query(
    `SELECT DISTINCT o.*
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN fish_catches fc ON oi.fish_id = fc.id
     WHERE fc.user_id = $1
     ORDER BY o.created_at DESC`,
    [fisherman_id]
  );
  return result.rows;
}

export async function getOrderById(id) {
  const result = await pool.query(
    'SELECT * FROM orders WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function isOrderOwnedByFisherman(order_id, fisherman_id) {
  const result = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE fc.user_id = $2) AS own_count,
            COUNT(*) AS total_count
     FROM order_items oi
     JOIN fish_catches fc ON oi.fish_id = fc.id
     WHERE oi.order_id = $1`,
    [order_id, fisherman_id]
  );

  if (!result.rows[0]) return false;
  return Number(result.rows[0].own_count) > 0;
}

// Order items functions
export async function createOrderItem({ order_id, fish_id, weight, price }) {
  const result = await pool.query(
    'INSERT INTO order_items (order_id, fish_id, weight, price) VALUES ($1, $2, $3, $4) RETURNING *',
    [order_id, fish_id, weight, price]
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
