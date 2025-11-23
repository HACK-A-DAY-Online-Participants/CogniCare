import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, ShieldCheck, Map as MapIcon, EyeOff } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { isPatientUser } from '../../types/user';
import { startLocationTracking, stopLocationTracking } from '../../services/locationService';
import { checkAndCreateAlert, getGeofence } from '../../services/geofenceService';
import type { LocationPoint, Geofence } from '../../types/geofence';
import './LocationTracker.css';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationTracker: React.FC = () => {
    const { currentUser } = useAuth();
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'safe' | 'warning' | 'unknown'>('unknown');
    const [lastLocation, setLastLocation] = useState<LocationPoint | null>(null);
    const [geofence, setGeofence] = useState<Geofence | null>(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        const initTracking = async () => {
            try {
                // Load geofence first
                const loadedGeofence = await getGeofence(currentUser.id);
                setGeofence(loadedGeofence);

                // Start tracking
                await startLocationTracking(
                    currentUser.id,
                    (location) => handleLocationUpdate(location, loadedGeofence),
                    2 // Update every 2 minutes
                );
                setIsTracking(true);
                setStatus('safe');
            } catch (err) {
                console.error('Failed to start location tracking:', err);
                setError('Location access required for safety features');
                setIsTracking(false);
            }
        };

        initTracking();

        return () => {
            stopLocationTracking();
        };
    }, [currentUser]);

    const handleLocationUpdate = async (location: LocationPoint, currentGeofence: Geofence | null) => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        setLastLocation(location);

        try {
            if (currentGeofence && currentGeofence.isActive) {
                const alert = await checkAndCreateAlert(
                    currentUser.id,
                    currentUser.name,
                    location,
                    currentGeofence
                );

                if (alert) {
                    setStatus('warning');
                } else {
                    setStatus('safe');
                }
            }
        } catch (err) {
            console.error('Error checking geofence:', err);
        }
    };

    if (!currentUser || !isPatientUser(currentUser)) return null;

    return (
        <div className={`location-tracker-card ${status}`}>
            <div className="tracker-header-row">
                <div className="tracker-info-group">
                    <div className="tracker-icon">
                        {status === 'warning' ? (
                            <AlertTriangle size={24} />
                        ) : status === 'safe' ? (
                            <ShieldCheck size={24} />
                        ) : (
                            <MapPin size={24} />
                        )}
                    </div>

                    <div className="tracker-content">
                        <h3>Safety Monitor</h3>
                        {error ? (
                            <p className="tracker-error">{error}</p>
                        ) : (
                            <div className="tracker-status">
                                <span className="status-text">
                                    {status === 'safe' && 'You are in a safe zone'}
                                    {status === 'warning' && 'Outside safe zone - Caregiver notified'}
                                    {status === 'unknown' && 'Initializing location...'}
                                </span>
                                {isTracking && (
                                    <span className="tracking-indicator">
                                        <span className="pulse-dot"></span>
                                        Active
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className="btn-toggle-map"
                    onClick={() => setShowMap(!showMap)}
                    title={showMap ? "Hide Map" : "Show Map"}
                >
                    {showMap ? <EyeOff size={20} /> : <MapIcon size={20} />}
                    <span>{showMap ? 'Hide Map' : 'View Map'}</span>
                </button>
            </div>

            {showMap && lastLocation && (
                <div className="tracker-map-container">
                    <MapContainer
                        center={[lastLocation.latitude, lastLocation.longitude]}
                        zoom={13}
                        style={{ height: '300px', width: '100%', borderRadius: '12px' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        <Marker position={[lastLocation.latitude, lastLocation.longitude]}>
                            <Popup>You are here</Popup>
                        </Marker>

                        {geofence && geofence.isActive && (
                            <Circle
                                center={[geofence.center.latitude, geofence.center.longitude]}
                                radius={geofence.radiusMeters}
                                pathOptions={{
                                    color: status === 'warning' ? '#ef4444' : '#10b981',
                                    fillColor: status === 'warning' ? '#ef4444' : '#10b981',
                                    fillOpacity: 0.2
                                }}
                            />
                        )}
                    </MapContainer>
                    <div className="map-legend">
                        <div className="legend-item">
                            <span className="dot user-dot"></span> You
                        </div>
                        {geofence && (
                            <div className="legend-item">
                                <span className={`dot zone-dot ${status}`}></span> Safe Zone
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationTracker;
