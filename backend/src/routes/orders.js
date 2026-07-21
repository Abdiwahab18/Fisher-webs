import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getOrders,
  getMyOrders,
  createOrderController,
  updateOrderStatusController,
  getOrderItemsController,
  getAvailableDeliveries,
  getMyDeliveries,
  assignDriver,
  acceptDelivery,
  updateDeliveryStatus,
  confirmReceived,
  completeOrder,
  autopilot
} from '../controllers/orderController.js';

const router = express.Router();

// Get orders for admin and fisherman
router.get('/', authenticateToken, getOrders);

// Get orders for current user
router.get('/my-orders', authenticateToken, getMyOrders);

// Create new order with delivery details
router.post('/', authenticateToken, createOrderController);

// Update order status
router.patch('/:id/status', authenticateToken, updateOrderStatusController);

// Get order items
router.get('/:id/items', authenticateToken, getOrderItemsController);

// Get available deliveries (status = 'processing' and driver_id IS NULL)
router.get('/available-deliveries', authenticateToken, getAvailableDeliveries);

// Get deliveries accepted by the current driver
router.get('/my-deliveries', authenticateToken, getMyDeliveries);

// Assign a registered driver to an order from the fisherman
router.post('/:id/assign-driver', authenticateToken, assignDriver);

// Accept a delivery job
router.post('/:id/accept-delivery', authenticateToken, acceptDelivery);

// Update delivery status
router.patch('/:id/delivery-status', authenticateToken, updateDeliveryStatus);

// Customer confirms receipt of the order
router.post('/:id/confirm-received', authenticateToken, confirmReceived);

// Mark order as completed when the fisherman accepts the confirmation
router.post('/:id/complete-order', authenticateToken, completeOrder);

// Autopilot Order Flow Simulation
router.post('/:id/autopilot', authenticateToken, autopilot);

export default router;