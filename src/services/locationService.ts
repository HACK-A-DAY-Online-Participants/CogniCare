import { db } from '../config/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { LocationPoint } from '../types/geofence';

let watchId: number | null = null;
let trackingInterval: number | null = null;

/**
 * Request location permission from the browser
 */
export async function requestLocationPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return false;
    }

    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted' || permission.state === 'prompt';
    } catch (error) {
        console.error('Error checking location permission:', error);
        return true; // Assume we can try to request
    }
}

/**
 * Get current location from browser
 */
export async function getCurrentLocation(): Promise<LocationPoint> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * Update patient location in Firebase
 */
export async function updatePatientLocation(
    patientId: string,
    location: LocationPoint
): Promise<void> {
    const patientRef = doc(db, 'users', patientId);
    await updateDoc(patientRef, {
        lastKnownLocation: location,
        locationUpdatedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
    });
}

/**
 * Start tracking patient location
 * @param patientId Patient ID
 * @param onLocationUpdate Callback when location is updated
 * @param intervalMinutes How often to update location (default: 2 minutes)
 */
export async function startLocationTracking(
    patientId: string,
    onLocationUpdate: (location: LocationPoint) => void,
    intervalMinutes: number = 2
): Promise<void> {
    // Stop any existing tracking
    stopLocationTracking();

    // Check permission
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        throw new Error('Location permission not granted');
    }

    // Function to update location
    const updateLocation = async () => {
        try {
            const location = await getCurrentLocation();
            await updatePatientLocation(patientId, location);
            onLocationUpdate(location);
            console.log('Location updated:', location);
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    // Update immediately
    await updateLocation();

    // Set up interval for periodic updates
    trackingInterval = setInterval(updateLocation, intervalMinutes * 60 * 1000);

    // Also watch for significant position changes
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const location: LocationPoint = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                await updatePatientLocation(patientId, location);
                onLocationUpdate(location);
            },
            (error) => {
                console.error('Error watching position:', error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000, // 30 seconds
                timeout: 27000,
            }
        );
    }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

/**
 * Check if location tracking is active
 */
export function isTrackingActive(): boolean {
    return trackingInterval !== null || watchId !== null;
}
