import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/db.js';
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersByFisherman,
  isOrderOwnedByFisherman,
  createOrderItem,
  getOrderItems,
  createNotification,
  getFishCatchById,
  reduceFishCatchWeight,
  restoreFishCatchWeight,
  assignOrderToDriver
} from '../models/userModel.js';

const router = express.Router();

// Get orders for admin and fisherman
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'customer') {
      return res.status(403).json({ message: 'Forbidden: customers cannot access all orders' });
    }

    const orders = req.user.role === 'admin'
      ? await getAllOrders()
      : await getOrdersByFisherman(req.user.id);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders for current user
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order with delivery details
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { total_price, items, delivery_info } = req.body;

    if (!total_price || !items || items.length === 0) {
      return res.status(400).json({ message: 'Total price and items are required' });
    }

    if (!delivery_info) {
      return res.status(400).json({ message: 'Delivery/contact information is required' });
    }

    for (const item of items) {
      const fishCatch = await getFishCatchById(item.fish_id);
      if (!fishCatch) {
        return res.status(404).json({ message: `Fish catch ${item.fish_id} not found` });
      }
      if (fishCatch.user_id === req.user.id) {
        return res.status(400).json({ message: `You cannot purchase your own catch (${fishCatch.fish_name})` });
      }
      const available = Number(fishCatch.weight) || 0;
      if (item.weight > available) {
        return res.status(400).json({ message: `Only ${available} kg available for ${fishCatch.fish_name}` });
      }
    }

    const order = await createOrder({
      user_id: req.user.id,
      total_price,
      status: 'pending',
      delivery_info
    });

    const orderItems = [];
    for (const item of items) {
      const orderItem = await createOrderItem({
        order_id: order.id,
        fish_id: item.fish_id,
        weight: item.weight,
        price: item.price
      });
      orderItems.push(orderItem);
      await reduceFishCatchWeight(item.fish_id, item.weight);
    }

    await createNotification({
      user_id: req.user.id,
      message: `Your order #${order.id} has been placed and is pending confirmation.`,
      is_read: false
    });

    const io = req.app.get('io');
    if (io) {
      let fishName = null;
      let qty = null;
      try {
        if (items && items.length > 0) {
          qty = items[0].weight;
          const res = await pool.query('SELECT fish_name FROM fish_catches WHERE id = $1', [items[0].fish_id]);
          fishName = res.rows[0]?.fish_name || null;
        }
      } catch (e) {
        console.warn('Failed to lookup fish name for websocket notification', e.message);
      }

      io.to(`user:${req.user.id}`).emit('order-placed', {
        orderId: order.id,
        totalPrice: total_price,
        itemCount: items.length,
        fish_name: fishName,
        weight: qty,
        items
      });
    }

    res.status(201).json({ order, items: orderItems });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    let { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    status = String(status).toLowerCase();
    const validStatuses = ['pending', 'processing', 'cancelled', 'rejected', 'completed', 'delivered', 'pending_verification', 'out_for_delivery'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid values are: ${validStatuses.join(', ')}` });
    }

    const previousOrder = await getOrderById(req.params.id);
    if (!previousOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'customer') {
      if (previousOrder.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: you can only update your own orders' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Forbidden: customers may only cancel orders' });
      }
    } else if (req.user.role === 'fisherman') {
      const ownsOrder = await isOrderOwnedByFisherman(req.params.id, req.user.id);
      if (!ownsOrder) {
        return res.status(403).json({ message: 'Forbidden: you can only update orders for your own catches' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only customers, fishermen, and admins can update order status' });
    }

    const updatedOrder = await updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore stock if the order is cancelled or rejected
    if (['cancelled', 'rejected'].includes(status) && !['cancelled', 'rejected'].includes(previousOrder.status)) {
      const items = await getOrderItems(req.params.id);
      for (const item of items) {
        await restoreFishCatchWeight(item.fish_id, item.weight);
      }
    }

    const io = req.app.get('io');
    if (updatedOrder.status === 'processing' && updatedOrder.payment_status === 'paid') {
      await assignOrderToDriver(updatedOrder.id, io);
    }

    // Emit notification via WebSocket
    await createNotification({
      user_id: updatedOrder.user_id,
      message: `Order #${updatedOrder.id} status updated to ${updatedOrder.status}.`,
      is_read: false
    });

    if (io) {
      io.to(`user:${updatedOrder.user_id}`).emit('order-updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.status
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order items
router.get('/:id/items', authenticateToken, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'customer') {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: you can only view your own orders' });
      }
    }

    if (req.user.role === 'fisherman') {
      const ownsOrder = await isOrderOwnedByFisherman(req.params.id, req.user.id);
      if (!ownsOrder) {
        return res.status(403).json({ message: 'Forbidden: you can only view items for your own catch orders' });
      }
    }

    const items = await getOrderItems(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available deliveries (status = 'processing' and driver_id IS NULL)
router.get('/available-deliveries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only drivers and admins can access available deliveries' });
    }

    const result = await pool.query(
      `SELECT o.*, u.name as customer_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.status = 'processing' AND o.driver_id IS NULL 
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get deliveries accepted by the current driver
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only drivers and admins can access their deliveries' });
    }

    const result = await pool.query(
      `SELECT o.*, u.name as customer_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.driver_id = $1 
       ORDER BY o.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my deliveries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign a registered driver to an order from the fisherman
router.post('/:id/assign-driver', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only fishermen and admins can assign drivers' });
    }

    const { driver_id, estimated_delivery_time } = req.body;
    const orderId = req.params.id;

    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'fisherman') {
      const ownsOrder = await isOrderOwnedByFisherman(orderId, req.user.id);
      if (!ownsOrder) {
        return res.status(403).json({ message: 'Forbidden: you can only assign drivers for your own orders' });
      }
    }

    if (!driver_id) {
      return res.status(400).json({ message: 'A driver is required' });
    }

    const driverRes = await pool.query(
      `SELECT * FROM delivery_drivers WHERE id = $1 AND fisherman_id = $2 AND status = 'active'`,
      [driver_id, req.user.role === 'fisherman' ? req.user.id : order.fisherman_id || req.user.id]
    );
    const driver = driverRes.rows[0];
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found or inactive' });
    }

    const updatedRes = await pool.query(
      `UPDATE orders
       SET driver_id = $1, delivery_status = 'assigned', estimated_delivery_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [driver.user_id, estimated_delivery_time || null, orderId]
    );

    const updatedOrder = updatedRes.rows[0];

    await createNotification({
      user_id: order.user_id,
      message: `Your order #${orderId} has been assigned to ${driver.name}. Phone: ${driver.phone || 'N/A'}. Vehicle: ${driver.vehicle_type || 'N/A'} ${driver.vehicle_number || ''}`,
      is_read: false
    });

    await createNotification({
      user_id: driver.user_id,
      message: `You have a new delivery assignment for Order #${orderId}.`,
      is_read: false
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order-updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        delivery_status: updatedOrder.delivery_status,
        driver_id: updatedOrder.driver_id,
        estimated_delivery_time: updatedOrder.estimated_delivery_time,
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_info: `${driver.vehicle_type || ''} ${driver.vehicle_number || ''}`.trim()
      });
      io.to(`user:${driver.user_id}`).emit('order-updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        delivery_status: updatedOrder.delivery_status,
        driver_id: updatedOrder.driver_id,
        estimated_delivery_time: updatedOrder.estimated_delivery_time
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a delivery job
router.post('/:id/accept-delivery', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only drivers and admins can accept deliveries' });
    }

    const orderId = req.params.id;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.driver_id && Number(order.driver_id) !== Number(req.user.id)) {
      return res.status(400).json({ message: 'Order has already been assigned to a driver' });
    }

    const updatedRes = await pool.query(
      `UPDATE orders 
       SET driver_id = $1, delivery_status = 'assigned', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [req.user.id, orderId]
    );

    await createNotification({
      user_id: order.user_id,
      message: `A driver has accepted your order #${orderId} and is preparing for delivery.`,
      is_read: false
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order-updated', {
        orderId: order.id,
        status: order.status,
        delivery_status: 'assigned'
      });
    }

    res.json(updatedRes.rows[0]);
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update delivery status
router.patch('/:id/delivery-status', authenticateToken, async (req, res) => {
  try {
    const { delivery_status } = req.body;
    if (!delivery_status) {
      return res.status(400).json({ message: 'Delivery status is required' });
    }

    const validDeliveryStatuses = ['assigned', 'picked_up', 'delivered'];
    if (!validDeliveryStatuses.includes(delivery_status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const orderId = req.params.id;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.driver_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: you are not the assigned driver for this order' });
    }

    let orderStatusUpdate = '';
    if (delivery_status === 'delivered') {
      orderStatusUpdate = `, status = 'delivered'`;
    } else if (delivery_status === 'picked_up') {
      orderStatusUpdate = `, status = 'out_for_delivery'`;
    }

    const updatedRes = await pool.query(
      `UPDATE orders 
       SET delivery_status = $1 ${orderStatusUpdate}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [delivery_status, orderId]
    );

    const updatedOrder = updatedRes.rows[0];
    let finalOrder = updatedOrder;

    // Check if both driver delivered and customer confirmed are true
    if (updatedOrder.delivery_status === 'delivered' && updatedOrder.customer_confirmed) {
      const completedRes = await pool.query(
        `UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [orderId]
      );
      finalOrder = completedRes.rows[0];

      await createNotification({
        user_id: order.user_id,
        message: `Your order #${orderId} is now marked as Completed.`,
        is_read: false
      });
      if (order.fisherman_id) {
        await createNotification({
          user_id: order.fisherman_id,
          message: `Order #${orderId} has been completed successfully.`,
          is_read: false
        });
      }
    }

    let msg = `Your order #${orderId} delivery status updated to ${delivery_status}.`;
    if (delivery_status === 'delivered') {
      msg = `Your order #${orderId} has been successfully delivered!`;
    } else if (delivery_status === 'picked_up') {
      msg = `Your order #${orderId} is out for delivery.`;
    }

    await createNotification({
      user_id: order.user_id,
      message: msg,
      is_read: false
    });

    if (order.fisherman_id) {
      await createNotification({
        user_id: order.fisherman_id,
        message: `Order #${orderId} has been ${delivery_status === 'delivered' ? 'delivered' : 'picked up'} by the driver.`,
        is_read: false
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order-updated', {
        orderId: finalOrder.id,
        status: finalOrder.status,
        delivery_status: finalOrder.delivery_status
      });
      if (order.fisherman_id) {
        io.to(`user:${order.fisherman_id}`).emit('order-updated', {
          orderId: finalOrder.id,
          status: finalOrder.status,
          delivery_status: finalOrder.delivery_status
        });
      }
    }

    res.json(finalOrder);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer confirms receipt of the order
router.post('/:id/confirm-received', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can confirm receipt' });
    }

    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: you can only confirm your own orders' });
    }

    const updatedRes = await pool.query(
      `UPDATE orders
       SET customer_confirmed = TRUE, status = 'customer_confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    const updatedOrder = updatedRes.rows[0];
    let finalOrder = updatedOrder;

    // Check if both driver delivered and customer confirmed are true
    if (updatedOrder.delivery_status === 'delivered' && updatedOrder.customer_confirmed) {
      const completedRes = await pool.query(
        `UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      finalOrder = completedRes.rows[0];

      await createNotification({
        user_id: order.user_id,
        message: `Your order #${order.id} is now marked as Completed.`,
        is_read: false
      });
      if (order.fisherman_id) {
        await createNotification({
          user_id: order.fisherman_id,
          message: `Order #${order.id} has been completed successfully.`,
          is_read: false
        });
      }
    }

    await createNotification({
      user_id: order.fisherman_id || req.user.id,
      message: `Customer has confirmed receiving Order #${order.id}.`,
      is_read: false
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order-updated', {
        orderId: finalOrder.id,
        status: finalOrder.status,
        customer_confirmed: finalOrder.customer_confirmed
      });
      if (order.fisherman_id) {
        io.to(`user:${order.fisherman_id}`).emit('order-updated', {
          orderId: finalOrder.id,
          status: finalOrder.status,
          customer_confirmed: finalOrder.customer_confirmed
        });
      }
    }

    res.json(finalOrder);
  } catch (error) {
    console.error('Error confirming receipt:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark order as completed when the fisherman accepts the confirmation
router.post('/:id/complete-order', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only fishermen and admins can complete orders' });
    }

    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'fisherman') {
      const ownsOrder = await isOrderOwnedByFisherman(req.params.id, req.user.id);
      if (!ownsOrder) {
        return res.status(403).json({ message: 'Forbidden: you can only complete your own orders' });
      }
    }

    const updatedRes = await pool.query(
      `UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    res.json(updatedRes.rows[0]);
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Autopilot Order Flow Simulation
router.post('/:id/autopilot', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Autopilot mode activated! The order is now being processed automatically.' });

    // Start autopilot async sequence
    const io = req.app.get('io');
    const runAutopilot = async () => {
      try {
        console.log(`[Autopilot] Starting flow for Order #${orderId}`);

        // Step 1: Pay the order (if pending)
        const currentOrderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        const currentOrder = currentOrderRes.rows[0];
        if (currentOrder.status === 'pending') {
          // Check if payment already exists
          const paymentCheck = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
          if (paymentCheck.rows.length === 0) {
            await pool.query(
              `INSERT INTO payments (order_id, user_id, amount, method, reference, sender_phone, status) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [orderId, currentOrder.user_id, currentOrder.total_price, 'autopilot', `AP_${Date.now()}`, 'Autopilot', 'verified']
            );
          }

          // Update order to processing/paid
          await pool.query(
            `UPDATE orders SET status = 'processing', payment_method = 'autopilot', payment_reference = $1, payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [`AP_${Date.now()}`, orderId]
          );

          await createNotification({
            user_id: currentOrder.user_id,
            message: `Your payment for order #${orderId} was verified. Order is now processing.`,
            is_read: false
          });

          if (io) {
            io.to(`user:${currentOrder.user_id}`).emit('payment-updated', { orderId, status: 'processing' });
            io.to(`user:${currentOrder.user_id}`).emit('order-updated', { orderId, status: 'processing' });
          }
          console.log(`[Autopilot] Step 1 Complete: Order #${orderId} Paid & Processing`);
        }

        // Wait 3 seconds before driver assignment
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 2: Driver Acceptance
        // Find or create a demo driver
        let driverRes = await pool.query("SELECT * FROM users WHERE role = 'driver' LIMIT 1");
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
          console.log(`[Autopilot] Created demo driver: ${driver.email}`);
        }

        // Assign driver
        await pool.query(
          `UPDATE orders 
           SET driver_id = $1, delivery_status = 'assigned', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [driver.id, orderId]
        );

        await createNotification({
          user_id: currentOrder.user_id,
          message: `A driver has accepted your order #${orderId} and is preparing for delivery.`,
          is_read: false
        });

        if (io) {
          io.to(`user:${currentOrder.user_id}`).emit('order-updated', {
            orderId,
            status: 'processing',
            delivery_status: 'assigned'
          });
        }
        console.log(`[Autopilot] Step 2 Complete: Order #${orderId} Assigned to Driver #${driver.id}`);

        // Wait 3 seconds before pick up
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Out for Delivery (Picked Up)
        await pool.query(
          `UPDATE orders 
           SET delivery_status = 'picked_up', status = 'out_for_delivery', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [orderId]
        );

        await createNotification({
          user_id: currentOrder.user_id,
          message: `Your order #${orderId} is out for delivery.`,
          is_read: false
        });

        if (currentOrder.fisherman_id) {
          await createNotification({
            user_id: currentOrder.fisherman_id,
            message: `Order #${orderId} has been picked up by the driver.`,
            is_read: false
          });
        }

        if (io) {
          io.to(`user:${currentOrder.user_id}`).emit('order-updated', {
            orderId,
            status: 'out_for_delivery',
            delivery_status: 'picked_up'
          });
          if (currentOrder.fisherman_id) {
            io.to(`user:${currentOrder.fisherman_id}`).emit('order-updated', {
              orderId,
              status: 'out_for_delivery',
              delivery_status: 'picked_up'
            });
          }
        }
        console.log(`[Autopilot] Step 3 Complete: Order #${orderId} Out for Delivery`);

        // Wait 3.5 seconds before delivery completion
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Step 4: Delivered
        await pool.query(
          `UPDATE orders 
           SET delivery_status = 'delivered', status = 'delivered', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [orderId]
        );

        await createNotification({
          user_id: currentOrder.user_id,
          message: `Your order #${orderId} has been successfully delivered!`,
          is_read: false
        });

        if (currentOrder.fisherman_id) {
          await createNotification({
            user_id: currentOrder.fisherman_id,
            message: `Order #${orderId} has been delivered by the driver.`,
            is_read: false
          });
        }

        if (io) {
          io.to(`user:${currentOrder.user_id}`).emit('order-updated', {
            orderId,
            status: 'delivered',
            delivery_status: 'delivered'
          });
          if (currentOrder.fisherman_id) {
            io.to(`user:${currentOrder.fisherman_id}`).emit('order-updated', {
              orderId,
              status: 'delivered',
              delivery_status: 'delivered'
            });
          }
        }
        console.log(`[Autopilot] Step 4 Complete: Order #${orderId} Delivered`);

      } catch (err) {
        console.error('[Autopilot] Error running autopilot flow:', err);
      }
    };

    runAutopilot();

  } catch (error) {
    console.error('Error in autopilot route handler:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;