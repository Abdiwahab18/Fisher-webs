import {
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../models/notificationModel.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await getNotificationsByUser(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markRead(req, res) {
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
}

export async function markAllRead(req, res) {
  try {
    const notifications = await markAllNotificationsRead(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Notification clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
