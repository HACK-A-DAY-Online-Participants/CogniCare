import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { MapPin, Save, Trash2, X } from 'lucide-react';
import type { Geofence, LocationPoint } from '../../types/geofence';
import { createGeofence, updateGeofence, deleteGeofence } from '../../services/geofenceService';
import 'leaflet/dist/leaflet.css';
import './GeofenceManager.css';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeofenceManagerProps {
    patientId: string;
    patientName: string;
    caregiverId: string;
    existingGeofence?: Geofence;
    onClose: () => void;
    onSave: () => void;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            onClick(e.latlng);
        },
    });
    return null;
}

const GeofenceManager: React.FC<GeofenceManagerProps> = ({
    patientId,
    patientName,
    caregiverId,
    existingGeofence,
    onClose,
    onSave,
}) => {
    const [center, setCenter] = useState<LocationPoint>(
        existingGeofence?.center || { latitude: 40.7128, longitude: -74.0060 } // Default to NYC
    );
    const [radius, setRadius] = useState<number>(existingGeofence?.radiusMeters || 500);
    const [name, setName] = useState<string>(existingGeofence?.name || `${patientName}'s Safe Zone`);
    const [isActive, setIsActive] = useState<boolean>(existingGeofence?.isActive ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get user's current location on mount
    useEffect(() => {
        if (!existingGeofence && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCenter({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, [existingGeofence]);

    const handleMapClick = (latlng: LatLng) => {
        setCenter({
            latitude: latlng.lat,
            longitude: latlng.lng,
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const geofenceData = {
                patientId,
                name,
                center,
                radiusMeters: radius,
                isActive,
                createdBy: caregiverId,
            };

            if (existingGeofence) {
                await updateGeofence(patientId, geofenceData);
            } else {
                await createGeofence(patientId, geofenceData);
            }

            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving geofence:', err);
            setError('Failed to save geofence. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this safe zone?')) {
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await deleteGeofence(patientId);
            onSave();
            onClose();
        } catch (err) {
            console.error('Error deleting geofence:', err);
            setError('Failed to delete geofence. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="geofence-manager-overlay">
            <div className="geofence-manager-modal">
                <div className="geofence-manager-header">
                    <h2>
                        <MapPin size={24} />
                        {existingGeofence ? 'Edit Safe Zone' : 'Create Safe Zone'}
                    </h2>
                    <button className="close-btn" onClick={onClose} disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>

                <div className="geofence-manager-content">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="geofence-form">
                        <div className="form-group">
                            <label htmlFor="geofence-name">Safe Zone Name</label>
                            <input
                                id="geofence-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Home Safe Zone"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="geofence-radius">
                                Radius: {radius}m ({(radius / 1000).toFixed(2)}km)
                            </label>
                            <input
                                id="geofence-radius"
                                type="range"
                                min="100"
                                max="5000"
                                step="50"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                disabled={isSaving}
                            />
                            <div className="radius-labels">
                                <span>100m</span>
                                <span>2.5km</span>
                                <span>5km</span>
                            </div>
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    disabled={isSaving}
                                />
                                <span>Active (alerts enabled)</span>
                            </label>
                        </div>
                    </div>

                    <div className="map-container">
                        <p className="map-instruction">
                            <MapPin size={16} />
                            Click on the map to set the center of the safe zone
                        </p>
                        <MapContainer
                            center={[center.latitude, center.longitude]}
                            zoom={13}
                            style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickHandler onClick={handleMapClick} />
                            <Marker position={[center.latitude, center.longitude]} />
                            <Circle
                                center={[center.latitude, center.longitude]}
                                radius={radius}
                                pathOptions={{
                                    color: isActive ? '#3b82f6' : '#9ca3af',
                                    fillColor: isActive ? '#3b82f6' : '#9ca3af',
                                    fillOpacity: 0.2,
                                }}
                            />
                        </MapContainer>
                    </div>
                </div>

                <div className="geofence-manager-footer">
                    <div className="footer-left">
                        {existingGeofence && (
                            <button
                                className="btn-delete"
                                onClick={handleDelete}
                                disabled={isSaving}
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="footer-right">
                        <button
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Safe Zone'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeofenceManager;
