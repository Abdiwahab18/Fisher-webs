import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markRead,
  markAllRead
} from '../controllers/notificationController.js';

const router = express.Router();

// Get notifications for current user
router.get('/', authenticateToken, getNotifications);

// Mark a single notification as read
router.patch('/:id/read', authenticateToken, markRead);

// Mark all notifications as read for current user
router.patch('/read-all', authenticateToken, markAllRead);

export default router;
