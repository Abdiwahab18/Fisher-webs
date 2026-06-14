import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axiosConfig';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationsHistory, setNotificationsHistory] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    try {
      const storedEnabled = localStorage.getItem('fisher_notifications_enabled');
      if (storedEnabled !== null) {
        setNotificationsEnabled(storedEnabled === 'true');
      }
    } catch (e) {
      // ignore storage read errors
    }
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const token = localStorage.getItem('fisher_token');
        if (!token) return;
        const response = await api.get('/notifications');
        setNotificationsHistory(response.data || []);
      } catch (err) {
        console.error('Unable to load saved notifications', err);
      }
    }

    loadNotifications();
  }, []);

  const updateNotificationsEnabled = useCallback((enabled) => {
    setNotificationsEnabled(enabled);
    try { localStorage.setItem('fisher_notifications_enabled', String(enabled)); } catch (e) {
      // ignore storage write errors
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    if (!notificationsEnabled) return null;
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    setNotificationsHistory(prev => [
      ...prev,
      { ...notification, time: new Date().toISOString(), is_read: false }
    ]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, [notificationsEnabled, removeNotification]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('fisher_token');
      if (token) {
        await api.patch(`/notifications/${id}/read`);
      }
    } catch (err) {
      console.warn('Failed to mark notification read', err);
    }
    setNotificationsHistory(prev => prev.map((notif) => (
      notif.id === id ? { ...notif, is_read: true } : notif
    )));
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('fisher_token');
      if (token) {
        await api.patch('/notifications/read-all');
      }
    } catch (err) {
      console.warn('Failed to mark all notifications as read', err);
    }
    setNotificationsHistory(prev => prev.map((notif) => ({ ...notif, is_read: true })));
    try { localStorage.removeItem('fisher_notifications'); } catch (e) {}
  }, []);

  const success = useCallback((message, duration = 5000) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const error = useCallback((message, duration = 5000) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const warning = useCallback((message, duration = 5000) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  const info = useCallback((message, duration = 5000) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notificationsHistory,
        notificationsEnabled,
        updateNotificationsEnabled,
        addNotification,
        removeNotification,
        clearHistory,
        markNotificationRead,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
