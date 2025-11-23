import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import GeofenceManager from '../../components/caregiver/GeofenceManager';
import { Search, Plus, MoreVertical, Phone, Mail, Calendar, Activity, X, Link, UserPlus, Loader2, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isCaregiverUser } from '../../types/user';
import type { PatientUser } from '../../types/user';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Patients.css';

const Patients: React.FC = () => {
    const { currentUser, sendCaregiverRequest, addPatient } = useAuth();
    const [patients, setPatients] = useState<PatientUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionMethod, setConnectionMethod] = useState<'code' | 'add'>('code');
    const [showGeofenceModal, setShowGeofenceModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientUser | null>(null);

    // Connection Form State (for existing patients)
    const [patientCode, setPatientCode] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean, message: string } | null>(null);

    // Add Patient Form State (for new patients)
    const [newPatientData, setNewPatientData] = useState({
        name: '',
        email: '',
        condition: '',
        age: 0
    });

    useEffect(() => {
        loadPatients();
    }, [currentUser]);

    const loadPatients = async () => {
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        try {
            // Get all patients connected to this caregiver
            const patientIds = currentUser.patients || [];

            if (patientIds.length === 0) {
                setPatients([]);
                return;
            }

            // Fetch patient details from Firestore
            const patientsData: PatientUser[] = [];
            for (const patientId of patientIds) {
                const q = query(collection(db, 'users'), where('__name__', '==', patientId));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.role === 'patient') {
                        patientsData.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate() || new Date(),
                            updatedAt: data.updatedAt?.toDate() || new Date(),
                            lastVisit: data.lastVisit?.toDate()
                        } as PatientUser);
                    }
                });
            }

            setPatients(patientsData);
        } catch (error) {
            console.error('Error loading patients:', error);
        }
    };

    const handleConnectByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientCode.trim() || !currentUser) return;

        setIsLoading(true);
        setConnectionStatus(null);

        try {
            await sendCaregiverRequest(patientCode.trim());
            setConnectionStatus({
                success: true,
                message: 'Connection request sent! Waiting for patient approval.'
            });

            setTimeout(() => {
                setShowConnectModal(false);
                setPatientCode('');
                setConnectionStatus(null);
            }, 2000);
        } catch (error: any) {
            console.error('Error sending connection request:', error);
            setConnectionStatus({
                success: false,
                message: error.message || 'Failed to send connection request.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNewPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsLoading(true);
        setConnectionStatus(null);

        try {
            const newPatient = await addPatient(newPatientData);

            setConnectionStatus({
                success: true,
                message: `Patient ${newPatient.name} added successfully!`
            });

            // Refresh patient list
            await loadPatients();

            setTimeout(() => {
                setShowConnectModal(false);
                setNewPatientData({ name: '', email: '', condition: '', age: 0 });
                setConnectionStatus(null);
            }, 2000);
        } catch (error: any) {
            console.error('Error adding patient:', error);
            setConnectionStatus({
                success: false,
                message: error.message || 'Failed to add patient.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSetSafeZone = (patient: PatientUser) => {
        setSelectedPatient(patient);
        setShowGeofenceModal(true);
    };

    const handleGeofenceSaved = () => {
        loadPatients(); // Reload to get updated geofence data
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />

            <div className="page-container">
                <div className="patients-header">
                    <div>
                        <h1 className="page-title">My Patients</h1>
                        <p className="page-subtitle">Manage your patient list and monitor their progress</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowConnectModal(true)}>
                        <Link size={20} />
                        Connect New Patient
                    </button>
                </div>

                {/* Search Bar */}
                <div className="search-bar-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search patients by name or condition..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Patients Grid */}
                <div className="patients-grid">
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <div key={patient.id} className="patient-card card">
                                <div className="card-header">
                                    <div className="patient-profile">
                                        <div className="patient-avatar">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3>{patient.name}</h3>
                                            <span className="patient-age">{patient.age} years • {patient.condition}</span>
                                        </div>
                                    </div>
                                    <button className="icon-btn">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                <div className="patient-stats">
                                    <div className="stat-item">
                                        <Activity size={16} />
                                        <span>Score: {patient.cognitiveScore}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Calendar size={16} />
                                        <span>Last Visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="patient-actions">
                                    <button className="action-btn">
                                        <Phone size={18} />
                                    </button>
                                    <button className="action-btn">
                                        <Mail size={18} />
                                    </button>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleSetSafeZone(patient)}
                                        style={{ flex: 1 }}
                                    >
                                        <MapPin size={16} />
                                        {patient.geofence ? 'Edit' : 'Set'} Safe Zone
                                    </button>
                                </div>
                                {patient.geofence && patient.geofence.isActive && (
                                    <div className="geofence-badge">
                                        <Shield size={14} />
                                        Safe zone active
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-container">
                            <p>No patients found. Click "Connect New Patient" to add someone.</p>
                        </div>
                    )}
                </div>

                {/* Connect Patient Modal */}
                {showConnectModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Connect with Patient</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => {
                                        setShowConnectModal(false);
                                        setPatientCode('');
                                        setConnectionStatus(null);
                                    }}
                                    disabled={isLoading}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tab Selection */}
                            <div className="connection-tabs">
                                <button
                                    className={`tab-btn ${connectionMethod === 'code' ? 'active' : ''}`}
                                    onClick={() => setConnectionMethod('code')}
                                >
                                    <Link size={18} />
                                    Connect by Code
                                </button>
                                <button
                                    className={`tab-btn ${connectionMethod === 'add' ? 'active' : ''}`}
                                    onClick={() => setConnectionMethod('add')}
                                >
                                    <Plus size={18} />
                                    Add New Patient
                                </button>
                            </div>

                            {/* Connect by Code Form */}
                            {connectionMethod === 'code' && (
                                <form onSubmit={handleConnectByCode} className="connect-form">
                                    <div className="form-group">
                                        <label htmlFor="patientCode">Patient's Unique Code</label>
                                        <input
                                            type="text"
                                            id="patientCode"
                                            placeholder="Enter patient's unique code (e.g., P-XXXX-YYYY-ZZZ)"
                                            value={patientCode}
                                            onChange={(e) => setPatientCode(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        <p className="form-hint">
                                            Ask the patient to share their unique code from their dashboard.
                                        </p>
                                    </div>

                                    {connectionStatus && (
                                        <div className={`status-message ${connectionStatus.success ? 'success' : 'error'}`}>
                                            {connectionStatus.message}
                                        </div>
                                    )}

                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => {
                                                setShowConnectModal(false);
                                                setPatientCode('');
                                                setConnectionStatus(null);
                                            }}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isLoading || !patientCode.trim()}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2" size={18} />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2" size={18} />
                                                    Send Request
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Add New Patient Form */}
                            {connectionMethod === 'add' && (
                                <form onSubmit={handleAddNewPatient} className="connect-form">
                                    <div className="form-group">
                                        <label htmlFor="patientName">Patient Name</label>
                                        <input
                                            type="text"
                                            id="patientName"
                                            placeholder="Enter patient's full name"
                                            value={newPatientData.name}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="patientEmail">Email Address</label>
                                        <input
                                            type="email"
                                            id="patientEmail"
                                            placeholder="patient@example.com"
                                            value={newPatientData.email}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="patientAge">Age</label>
                                            <input
                                                type="number"
                                                id="patientAge"
                                                placeholder="65"
                                                min="0"
                                                max="120"
                                                value={newPatientData.age || ''}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, age: parseInt(e.target.value) || 0 })}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="patientCondition">Condition</label>
                                            <select
                                                id="patientCondition"
                                                value={newPatientData.condition}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, condition: e.target.value })}
                                                required
                                                disabled={isLoading}
                                            >
                                                <option value="">Select condition</option>
                                                <option value="Alzheimer's Disease">Alzheimer's Disease</option>
                                                <option value="Dementia">Dementia</option>
                                                <option value="Mild Cognitive Impairment">Mild Cognitive Impairment</option>
                                                <option value="Parkinson's Disease">Parkinson's Disease</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-hint-box">
                                        <p><strong>Note:</strong> A temporary password will be generated and the patient will need to change it on first login.</p>
                                    </div>

                                    {connectionStatus && (
                                        <div className={`status-message ${connectionStatus.success ? 'success' : 'error'}`}>
                                            {connectionStatus.message}
                                        </div>
                                    )}

                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => {
                                                setShowConnectModal(false);
                                                setNewPatientData({ name: '', email: '', condition: '', age: 0 });
                                                setConnectionStatus(null);
                                            }}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2" size={18} />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="mr-2" size={18} />
                                                    Add Patient
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Geofence Manager Modal */}
                {showGeofenceModal && selectedPatient && currentUser && isCaregiverUser(currentUser) && (
                    <GeofenceManager
                        patientId={selectedPatient.id}
                        patientName={selectedPatient.name}
                        caregiverId={currentUser.id}
                        existingGeofence={selectedPatient.geofence}
                        onClose={() => {
                            setShowGeofenceModal(false);
                            setSelectedPatient(null);
                        }}
                        onSave={handleGeofenceSaved}
                    />
                )}
            </div>
        </div>
    );
};

export default Patients;
