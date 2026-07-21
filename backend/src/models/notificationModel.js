import pool from '../config/db.js';

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
