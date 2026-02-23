import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../config';

export const createNotification = async (notificationData) => {
    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            isRead: false,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        throw new Error(`Error creating notification: ${error.message}`);
    }
};

export const subscribeToNotifications = (userId, callback) => {
    if (!userId) {
        callback([]);
        return () => { };
    }

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        callback(notifications);
    }, (error) => {
        console.error("Error subscribing to notifications:", error);
        callback([]);
    });
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, {
            isRead: true,
            readAt: Timestamp.now(),
        });
    } catch (error) {
        throw new Error(`Error marking notification as read: ${error.message}`);
    }
};

export const markAllNotificationsAsRead = async (userId) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('isRead', '==', false)
        );
        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { isRead: true, readAt: Timestamp.now() }));
        await Promise.all(promises);
    } catch (error) {
        throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
}

export const deleteNotification = async (notificationId) => {
    try {
        const docRef = doc(db, 'notifications', notificationId);
        await deleteDoc(docRef);
    } catch (error) {
        throw new Error(`Error deleting notification: ${error.message}`);
    }
};

export const clearAllNotifications = async (userId) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map(d => deleteDoc(doc(db, 'notifications', d.id)));
        await Promise.all(promises);
    } catch (error) {
        throw new Error(`Error clearing notifications: ${error.message}`);
    }
};
