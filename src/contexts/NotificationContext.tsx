import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Notification } from '../types';
import { useFirebase } from './FirebaseContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, profile } = useFirebase();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        let timestamp = new Date().toISOString();
        try {
          if (data.createdAt?.toDate) {
            timestamp = data.createdAt.toDate().toISOString();
          } else if (data.createdAt instanceof Date) {
            timestamp = data.createdAt.toISOString();
          }
        } catch (e) {
          console.error("Error parsing notification timestamp:", e);
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp
        };
      }) as Notification[];
      setNotifications(fetchedNotifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback(async (n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...n,
        isRead: false,
        createdAt: serverTimestamp(),
        avatar: n.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.username}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.isRead) {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { isRead: true });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  }, [user, notifications]);

  const clearNotifications = useCallback(async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  }, [user, notifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
