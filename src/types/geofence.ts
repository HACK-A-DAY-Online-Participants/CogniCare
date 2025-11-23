export interface LocationPoint {
    latitude: number;
    longitude: number;
}

export interface Geofence {
    id: string;
    patientId: string;
    name: string;
    center: LocationPoint;
    radiusMeters: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string; // caregiver ID
}

export interface GeofenceAlert {
    id: string;
    patientId: string;
    patientName: string;
    caregiverId: string;
    geofenceId: string;
    geofenceName: string;
    location: LocationPoint;
    distanceFromCenter: number;
    timestamp: Date;
    isRead: boolean;
    severity: 'low' | 'medium' | 'high';
}

export interface LocationUpdate {
    patientId: string;
    location: LocationPoint;
    timestamp: Date;
    accuracy?: number; // in meters
}
