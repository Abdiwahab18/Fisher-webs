import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersByFisherman,
  isOrderOwnedByFisherman,
  createOrderItem,
  getOrderItems
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

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { total_price, items } = req.body;

    if (!total_price || !items || items.length === 0) {
      return res.status(400).json({ message: 'Total price and items are required' });
    }

    // Create order
    const order = await createOrder({
      user_id: req.user.id,
      total_price
    });

    // Create order items
    const orderItems = [];
    for (const item of items) {
      const orderItem = await createOrderItem({
        order_id: order.id,
        fish_id: item.fish_id,
        quantity: item.quantity,
        price: item.price
      });
      orderItems.push(orderItem);
    }

    // Emit notification via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user.id}`).emit('order-placed', {
        orderId: order.id,
        totalPrice: total_price,
        itemCount: items.length
      });
    }

    res.status(201).json({ order, items: orderItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (fisherman and admin)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'fisherman'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: only fishermen and admins can update order status' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (req.user.role === 'fisherman') {
      const ownsOrder = await isOrderOwnedByFisherman(req.params.id, req.user.id);
      if (!ownsOrder) {
        return res.status(403).json({ message: 'Forbidden: you can only update orders for your own catches' });
      }
    }

    const updatedOrder = await updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit notification via WebSocket
    const io = req.app.get('io');
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

export default router;