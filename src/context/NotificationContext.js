import React, { createContext, useContext, useState, useCallback } from 'react';
import * as notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async (studentId) => {
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(studentId),
        notificationService.getUnreadCount(studentId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId, studentId) => {
    await notificationService.markAsRead(notificationId);
    if (studentId) {
      const count = await notificationService.getUnreadCount(studentId);
      setUnreadCount(count);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    }
  }, []);

  const markAllAsRead = useCallback(async (studentId) => {
    await notificationService.markAllAsRead(studentId);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
