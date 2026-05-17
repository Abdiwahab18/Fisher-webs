import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus,
  createOrderItem,
  getOrderItems
} from '../models/userModel.js';

const router = express.Router();

// Get all orders (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await getAllOrders();
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

    res.status(201).json({ order, items: orderItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updatedOrder = await updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order items
router.get('/:id/items', authenticateToken, async (req, res) => {
  try {
    const items = await getOrderItems(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;