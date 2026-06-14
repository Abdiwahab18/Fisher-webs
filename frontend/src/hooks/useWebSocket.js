import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';

export function useWebSocket() {
  const socketRef = useRef(null);
  const { success, error, info } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('fisher_token');
    const userId = localStorage.getItem('fisher_user_id');

    if (!token) return;

    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    
    socketRef.current = io(socketURL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
      if (userId) {
        socketRef.current.emit('join-user', userId);
      }
    });

    socketRef.current.on('order-placed', (data) => {
      success(`Order placed: ${data.fish_name} x${data.quantity}`);
    });

    socketRef.current.on('order-updated', (data) => {
      const statusLabel = data.status || 'updated';
      info(`Order status: ${statusLabel}`);
    });

    socketRef.current.on('catch-added', (data) => {
      info(`New catch added: ${data.fish_name}`);
    });

    socketRef.current.on('error', (errorMsg) => {
      error(`Connection error: ${errorMsg}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [success, error, info]);

  return socketRef.current;
}
