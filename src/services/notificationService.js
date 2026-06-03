import { db } from '../config/firebase';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, updateDoc, writeBatch, addDoc, serverTimestamp 
} from 'firebase/firestore';

const notificationsRef = collection(db, 'notifications');

export const createNotification = async (userId, type, message) => {
  await addDoc(notificationsRef, {
    userId,
    type,
    message,
    isRead: false,
    createdAt: serverTimestamp()
  });
};

export const getNotifications = async (studentId) => {
  const q = query(
    notificationsRef, 
    where('userId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().createdAt?.toDate?.()?.toISOString()
  }));
};

export const getUnreadCount = async (studentId) => {
  const q = query(
    notificationsRef, 
    where('userId', '==', studentId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const markAsRead = async (notificationId) => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, { isRead: true });
  return { success: true };
};

export const markAllAsRead = async (studentId) => {
  const q = query(
    notificationsRef, 
    where('userId', '==', studentId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, { isRead: true });
  });
  
  await batch.commit();
  return { success: true };
};
