import pool from '../config/db.js';

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
