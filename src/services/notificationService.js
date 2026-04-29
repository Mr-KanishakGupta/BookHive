import { NOTIFICATIONS } from './mockData';

// Get notifications for a student
export const getNotifications = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notifs = NOTIFICATIONS.filter(n => n.studentId === studentId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(notifs);
    }, 300);
  });
};

// Get unread count
export const getUnreadCount = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const count = NOTIFICATIONS.filter(
        n => n.studentId === studentId && !n.read
      ).length;
      resolve(count);
    }, 100);
  });
};

// Mark notification as read
export const markAsRead = (notificationId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notif = NOTIFICATIONS.find(n => n.id === notificationId);
      if (notif) notif.read = true;
      resolve({ success: true });
    }, 100);
  });
};

// Mark all as read
export const markAllAsRead = (studentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      NOTIFICATIONS.forEach(n => {
        if (n.studentId === studentId) n.read = true;
      });
      resolve({ success: true });
    }, 100);
  });
};
