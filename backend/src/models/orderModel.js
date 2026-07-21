import pool from '../config/db.js';
import { createNotification } from './notificationModel.js';

export async function createOrder({ user_id, fisherman_id = null, total_price, status = 'pending', delivery_info = null, order_type = 'purchase', payment_status = 'pending', delivery_status = null }) {
  const result = await pool.query(
    'INSERT INTO orders (user_id, fisherman_id, total_price, status, delivery_info, order_type, payment_status, delivery_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [user_id, fisherman_id, total_price, status, delivery_info, order_type, payment_status, delivery_status]
  );
  return result.rows[0];
}

export async function getOrdersByUser(user_id) {
  const result = await pool.query(
    `SELECT o.*, u.name AS customer_name,
            f.name AS fisherman_name,
            f.email AS fisherman_email,
            f.phone AS fisherman_phone,
            f.whatsapp AS fisherman_whatsapp,
            f.facebook AS fisherman_facebook,
            COALESCE(dd.name, d.name) AS driver_name,
            COALESCE(dd.phone, CASE WHEN d.email = 'demo_driver@fisher.com' THEN '1-800-555-0199' ELSE NULL END) AS driver_phone,
            COALESCE(dd.vehicle_type, CASE WHEN d.email = 'demo_driver@fisher.com' THEN 'Bicycle' ELSE NULL END) AS driver_vehicle_type,
            dd.vehicle_number AS driver_vehicle_number,
            dd.vehicle_color AS driver_vehicle_color
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN users f ON f.id = COALESCE(
       o.fisherman_id,
       (SELECT fc.user_id FROM order_items oi JOIN fish_catches fc ON oi.fish_id = fc.id WHERE oi.order_id = o.id LIMIT 1)
     )
     LEFT JOIN users d ON o.driver_id = d.id
     LEFT JOIN delivery_drivers dd ON o.driver_id = dd.user_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [user_id]
  );
  return result.rows;
}

export async function getAllOrders() {
  const result = await pool.query(
    `SELECT o.*, u.name AS customer_name,
            COALESCE(dd.name, d.name) AS driver_name,
            COALESCE(dd.phone, CASE WHEN d.email = 'demo_driver@fisher.com' THEN '1-800-555-0199' ELSE NULL END) AS driver_phone,
            COALESCE(dd.vehicle_type, CASE WHEN d.email = 'demo_driver@fisher.com' THEN 'Bicycle' ELSE NULL END) AS driver_vehicle_type,
            dd.vehicle_number AS driver_vehicle_number,
            dd.vehicle_color AS driver_vehicle_color
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN users d ON o.driver_id = d.id
     LEFT JOIN delivery_drivers dd ON o.driver_id = dd.user_id
     ORDER BY o.created_at DESC`
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

export async function assignOrderToDriver(orderId, io) {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (!order) return null;

  if (order.driver_id || ['assigned', 'picked_up', 'delivered'].includes(order.delivery_status)) {
    return order;
  }

  let driverRes = await pool.query(
    "SELECT * FROM users WHERE role = 'driver' AND status = 'active' ORDER BY id ASC LIMIT 1"
  );
  let driver = driverRes.rows[0];

  if (!driver) {
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash('demopass123', 10);
    const newDriverRes = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['Demo Driver', 'demo_driver@fisher.com', hashedPassword, 'driver', 'active']
    );
    driver = newDriverRes.rows[0];
  }

  const updatedRes = await pool.query(
    `UPDATE orders
     SET driver_id = $1, delivery_status = 'assigned', updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [driver.id, orderId]
  );
  const updatedOrder = updatedRes.rows[0];

  await createNotification({
    user_id: order.user_id,
    message: `A driver has accepted your order #${orderId} and is preparing for delivery.`,
    is_read: false
  });

  // Fetch delivery driver details if they exist in delivery_drivers table
  const ddRes = await pool.query('SELECT * FROM delivery_drivers WHERE user_id = $1', [driver.id]);
  const dd = ddRes.rows[0];

  if (io) {
    io.to(`user:${order.user_id}`).emit('order-updated', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      delivery_status: updatedOrder.delivery_status,
      driver_id: updatedOrder.driver_id,
      driver_name: dd ? dd.name : driver.name,
      driver_phone: dd ? dd.phone : (driver.email === 'demo_driver@fisher.com' ? '1-800-555-0199' : null),
      driver_vehicle_type: dd ? dd.vehicle_type : (driver.email === 'demo_driver@fisher.com' ? 'Bicycle' : null),
      driver_vehicle_number: dd ? dd.vehicle_number : null,
      driver_vehicle_color: dd ? dd.vehicle_color : null
    });
  }

  if (driver && driver.email === 'demo_driver@fisher.com') {
    setTimeout(async () => {
      try {
        const pickedUpRes = await pool.query(
          `UPDATE orders
           SET delivery_status = 'picked_up', status = 'out_for_delivery', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [orderId]
        );
        const pickedUpOrder = pickedUpRes.rows[0];

        await createNotification({
          user_id: order.user_id,
          message: `Your order #${orderId} is out for delivery.`,
          is_read: false
        });

        if (io) {
          io.to(`user:${order.user_id}`).emit('order-updated', {
            orderId,
            status: pickedUpOrder.status,
            delivery_status: pickedUpOrder.delivery_status,
            driver_id: pickedUpOrder.driver_id
          });
        }

        setTimeout(async () => {
          try {
            const deliveredRes = await pool.query(
              `UPDATE orders
               SET delivery_status = 'delivered', status = 'delivered', updated_at = CURRENT_TIMESTAMP
               WHERE id = $1
               RETURNING *`,
              [orderId]
            );
            const deliveredOrder = deliveredRes.rows[0];

            await createNotification({
              user_id: order.user_id,
              message: `Your order #${orderId} has been successfully delivered!`,
              is_read: false
            });

            if (io) {
              io.to(`user:${order.user_id}`).emit('order-updated', {
                orderId,
                status: deliveredOrder.status,
                delivery_status: deliveredOrder.delivery_status,
                driver_id: deliveredOrder.driver_id
              });
            }
          } catch (err) {
            console.error('Delivery progression error:', err);
          }
        }, 4000);
      } catch (err) {
        console.error('Pickup progression error:', err);
      }
    }, 3000);
  }

  return updatedOrder;
}

export async function getOrdersByFisherman(fisherman_id) {
  const result = await pool.query(
    `SELECT DISTINCT o.*, u.name AS customer_name,
            COALESCE(dd.name, d.name) AS driver_name,
            COALESCE(dd.phone, CASE WHEN d.email = 'demo_driver@fisher.com' THEN '1-800-555-0199' ELSE NULL END) AS driver_phone,
            COALESCE(dd.vehicle_type, CASE WHEN d.email = 'demo_driver@fisher.com' THEN 'Bicycle' ELSE NULL END) AS driver_vehicle_type,
            dd.vehicle_number AS driver_vehicle_number,
            dd.vehicle_color AS driver_vehicle_color
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN fish_catches fc ON oi.fish_id = fc.id
     LEFT JOIN users d ON o.driver_id = d.id
     LEFT JOIN delivery_drivers dd ON o.driver_id = dd.user_id
     WHERE fc.user_id = $1 OR o.user_id = $1 OR o.fisherman_id = $1
     ORDER BY o.created_at DESC`,
    [fisherman_id]
  );
  return result.rows;
}

export async function getOrderById(id) {
  const result = await pool.query(
    `SELECT o.*,
            f.name AS fisherman_name,
            f.email AS fisherman_email,
            f.phone AS fisherman_phone,
            f.whatsapp AS fisherman_whatsapp,
            f.facebook AS fisherman_facebook,
            COALESCE(dd.name, d.name) AS driver_name,
            COALESCE(dd.phone, CASE WHEN d.email = 'demo_driver@fisher.com' THEN '1-800-555-0199' ELSE NULL END) AS driver_phone,
            COALESCE(dd.vehicle_type, CASE WHEN d.email = 'demo_driver@fisher.com' THEN 'Bicycle' ELSE NULL END) AS driver_vehicle_type,
            dd.vehicle_number AS driver_vehicle_number,
            dd.vehicle_color AS driver_vehicle_color
     FROM orders o
     LEFT JOIN users f ON f.id = COALESCE(
       o.fisherman_id,
       (SELECT fc.user_id FROM order_items oi JOIN fish_catches fc ON oi.fish_id = fc.id WHERE oi.order_id = o.id LIMIT 1)
     )
     LEFT JOIN users d ON o.driver_id = d.id
     LEFT JOIN delivery_drivers dd ON o.driver_id = dd.user_id
     WHERE o.id = $1`,
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
    'SELECT oi.*, fs.name AS fish_name, fc.image FROM order_items oi JOIN fish_catches fc ON oi.fish_id = fc.id JOIN fish_species fs ON fc.fish_species_id = fs.id WHERE oi.order_id = $1',
    [order_id]
  );
  return result.rows;
}
