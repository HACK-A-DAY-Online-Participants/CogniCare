import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, deleteField, collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Geofence, GeofenceAlert, LocationPoint } from '../types/geofence';

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First location point
 * @param point2 Second location point
 * @returns Distance in meters
 */
export function calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Check if a location is outside the geofence boundary
 */
export function isOutsideGeofence(location: LocationPoint, geofence: Geofence): boolean {
    const distance = calculateDistance(location, geofence.center);
    return distance > geofence.radiusMeters;
}

/**
 * Create a new geofence for a patient
 */
export async function createGeofence(
    patientId: string,
    geofenceData: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Geofence> {
    const now = new Date();
    const geofence: Geofence = {
        ...geofenceData,
        id: `geofence_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
    };

    // Update patient document with geofence
    const patientRef = doc(db, 'users', patientId);
    await updateDoc(patientRef, {
        geofence: {
            ...geofence,
            createdAt: Timestamp.fromDate(geofence.createdAt),
            updatedAt: Timestamp.fromDate(geofence.updatedAt),
        },
        updatedAt: Timestamp.fromDate(now),
    });

    return geofence;
}

/**
 * Update an existing geofence
 */
export async function updateGeofence(
    patientId: string,
    geofenceData: Partial<Geofence>
): Promise<void> {
    const patientRef = doc(db, 'users', patientId);
    const patientDoc = await getDoc(patientRef);

    if (!patientDoc.exists()) {
        throw new Error('Patient not found');
    }

    const currentGeofence = patientDoc.data().geofence;
    if (!currentGeofence) {
        throw new Error('No geofence exists for this patient');
    }

    const updatedGeofence = {
        ...currentGeofence,
        ...geofenceData,
        updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(patientRef, {
        geofence: updatedGeofence,
        updatedAt: Timestamp.fromDate(new Date()),
    });
}

/**
 * Delete a geofence from a patient
 */
export async function deleteGeofence(patientId: string): Promise<void> {
    const patientRef = doc(db, 'users', patientId);
    await updateDoc(patientRef, {
        geofence: deleteField(),
        updatedAt: Timestamp.fromDate(new Date()),
    });
}

/**
 * Get geofence for a patient
 */
export async function getGeofence(patientId: string): Promise<Geofence | null> {
    const patientRef = doc(db, 'users', patientId);
    const patientDoc = await getDoc(patientRef);

    if (!patientDoc.exists()) {
        return null;
    }

    const geofenceData = patientDoc.data().geofence;
    if (!geofenceData) {
        return null;
    }

    return {
        ...geofenceData,
        createdAt: geofenceData.createdAt?.toDate() || new Date(),
        updatedAt: geofenceData.updatedAt?.toDate() || new Date(),
    };
}

/**
 * Check location against geofence and create alert if violated
 */
export async function checkAndCreateAlert(
    patientId: string,
    patientName: string,
    location: LocationPoint,
    geofence: Geofence
): Promise<GeofenceAlert | null> {
    if (!geofence.isActive) {
        return null;
    }

    const distance = calculateDistance(location, geofence.center);

    if (distance > geofence.radiusMeters) {
        // Patient is outside the geofence - create alert
        const alert: Omit<GeofenceAlert, 'id'> = {
            patientId,
            patientName,
            caregiverId: geofence.createdBy,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            location,
            distanceFromCenter: distance,
            timestamp: new Date(),
            isRead: false,
            severity: distance > geofence.radiusMeters * 1.5 ? 'high' : distance > geofence.radiusMeters * 1.2 ? 'medium' : 'low',
        };

        // Save alert to Firestore
        const alertRef = await addDoc(collection(db, 'geofenceAlerts'), {
            ...alert,
            timestamp: Timestamp.fromDate(alert.timestamp),
        });

        return {
            ...alert,
            id: alertRef.id,
        };
    }

    return null;
}

/**
 * Get alerts for a caregiver
 */
export async function getAlertsForCaregiver(
    caregiverId: string,
    unreadOnly: boolean = false
): Promise<GeofenceAlert[]> {
    let q = query(
        collection(db, 'geofenceAlerts'),
        where('caregiverId', '==', caregiverId),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    if (unreadOnly) {
        q = query(
            collection(db, 'geofenceAlerts'),
            where('caregiverId', '==', caregiverId),
            where('isRead', '==', false),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
    }

    const snapshot = await getDocs(q);
    const alerts: GeofenceAlert[] = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
            id: doc.id,
            patientId: data.patientId,
            patientName: data.patientName,
            caregiverId: data.caregiverId,
            geofenceId: data.geofenceId,
            geofenceName: data.geofenceName,
            location: data.location,
            distanceFromCenter: data.distanceFromCenter,
            timestamp: data.timestamp?.toDate() || new Date(),
            isRead: data.isRead,
            severity: data.severity,
        });
    });

    return alerts;
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
    const alertRef = doc(db, 'geofenceAlerts', alertId);
    await updateDoc(alertRef, {
        isRead: true,
    });
}

/**
 * Mark all alerts as read for a caregiver
 */
export async function markAllAlertsAsRead(caregiverId: string): Promise<void> {
    const q = query(
        collection(db, 'geofenceAlerts'),
        where('caregiverId', '==', caregiverId),
        where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
}
