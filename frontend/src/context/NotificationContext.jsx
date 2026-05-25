import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  const updateNotificationsEnabled = useCallback((enabled) => {
    setNotificationsEnabled(enabled);
    try { localStorage.setItem('fisher_notifications_enabled', String(enabled)); } catch (e) {
      // ignore storage write errors
    }
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    if (!notificationsEnabled) return null;
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    setNotificationsHistory(prev => {
      const next = [...prev, { ...notification, time: new Date().toISOString() }];
      try { localStorage.setItem('fisher_notifications', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setNotificationsHistory([]);
    try { localStorage.removeItem('fisher_notifications'); } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fisher_notifications');
      if (raw) setNotificationsHistory(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
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
