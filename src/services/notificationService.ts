import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, onSnapshot, updateDoc, doc, Timestamp } from 'firebase/firestore';
import type { GeofenceAlert } from '../types/geofence';

export interface Notification {
    id: string;
    type: 'geofence_alert' | 'task_completed' | 'connection_request';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    link?: string;
    data?: any;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: Notification[]) => void
): () => void {
    // Listen for geofence alerts
    const alertsQuery = query(
        collection(db, 'geofenceAlerts'),
        where('caregiverId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
        const notifications: Notification[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                type: 'geofence_alert',
                title: 'Safety Alert',
                message: `${data.patientName} is outside the safe zone (${Math.round(data.distanceFromCenter)}m away)`,
                timestamp: data.timestamp?.toDate() || new Date(),
                isRead: data.isRead,
                link: '/caregiver/patients',
                data: data
            });
        });

        onUpdate(notifications);
    });

    return unsubscribe;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, type: string): Promise<void> {
    if (type === 'geofence_alert') {
        const alertRef = doc(db, 'geofenceAlerts', notificationId);
        await updateDoc(alertRef, {
            isRead: true
        });
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const alertsQuery = query(
        collection(db, 'geofenceAlerts'),
        where('caregiverId', '==', userId),
        where('isRead', '==', false)
    );

    const snapshot = await getDocs(alertsQuery);
    return snapshot.size;
}
