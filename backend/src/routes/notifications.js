import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../models/userModel.js';

const router = express.Router();

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await getNotificationsByUser(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a single notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read for current user
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const notifications = await markAllNotificationsRead(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Notification clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
