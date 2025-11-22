import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/common/Navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Activity, Brain } from 'lucide-react';
import { type Consultation } from '../../types/consultation';

interface PatientSummary {
    id: string;
    name: string;
    condition: string;
    lastConsultation: Date;
    status: string;
}

const ExpertPatients: React.FC = () => {
    const { currentUser } = useAuth();
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPatients = async () => {
            if (!currentUser) return;

            try {
                // Get all consultations for this expert
                const q = query(
                    collection(db, 'consultations'),
                    where('expertId', '==', currentUser.id)
                );
                const snapshot = await getDocs(q);

                // Extract unique patients (via caregivers) from consultations
                // In a real app, we'd probably have a direct link or fetch patient details
                // For now, we'll derive "patients" from the caregivers we consult with
                const uniqueCaregivers = new Map<string, PatientSummary>();

                snapshot.docs.forEach(doc => {
                    const data = doc.data() as Consultation;
                    if (!uniqueCaregivers.has(data.caregiverId)) {
                        uniqueCaregivers.set(data.caregiverId, {
                            id: data.caregiverId,
                            name: data.caregiverName, // Using caregiver name as proxy for now
                            condition: 'Alzheimer\'s', // Placeholder
                            lastConsultation: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as any).toDate(),
                            status: 'Active'
                        });
                    } else {
                        // Update last consultation if newer
                        const existing = uniqueCaregivers.get(data.caregiverId)!;
                        const date = data.createdAt instanceof Date ? data.createdAt : (data.createdAt as any).toDate();
                        if (date > existing.lastConsultation) {
                            existing.lastConsultation = date;
                        }
                    }
                });

                setPatients(Array.from(uniqueCaregivers.values()));
            } catch (error) {
                console.error('Error loading patients:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPatients();
    }, [currentUser]);

    return (
        <div className="page-wrapper">
            <Navigation userRole="expert" />
            <div className="page-container">
                <div className="header-section">
                    <h1>My Patients</h1>
                    <p>Overview of patients under your consultation</p>
                </div>

                {loading ? (
                    <div className="loading-state">Loading patients...</div>
                ) : patients.length === 0 ? (
                    <div className="empty-state">
                        <User size={48} />
                        <p>No patients found yet.</p>
                        <p className="sub-text">Once you accept consultations, patients will appear here.</p>
                    </div>
                ) : (
                    <div className="patients-grid">
                        {patients.map(patient => (
                            <div key={patient.id} className="patient-card">
                                <div className="patient-header">
                                    <div className="patient-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="patient-info">
                                        <h3>{patient.name}</h3>
                                        <span className="patient-id">ID: {patient.id.slice(0, 6)}</span>
                                    </div>
                                    <span className="status-badge active">{patient.status}</span>
                                </div>

                                <div className="patient-stats">
                                    <div className="stat-item">
                                        <Brain size={16} />
                                        <span>Condition: {patient.condition}</span>
                                    </div>
                                    <div className="stat-item">
                                        <Activity size={16} />
                                        <span>Last Consult: {patient.lastConsultation.toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button className="btn btn-outline view-btn">
                                    View History
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .header-section { margin-bottom: 2rem; }
                .loading-state { text-align: center; padding: 2rem; color: #6b7280; }
                .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .sub-text { font-size: 0.875rem; }
                
                .patients-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .patient-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    transition: transform 0.2s;
                }
                .patient-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .patient-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .patient-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .patient-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #111827;
                }
                .patient-id {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .status-badge {
                    margin-left: auto;
                    font-size: 0.75rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-weight: 500;
                }
                .status-badge.active {
                    background: #d1fae5;
                    color: #065f46;
                }
                .patient-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #4b5563;
                    font-size: 0.875rem;
                }
                .view-btn {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    color: #374151;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .view-btn:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }
            `}</style>
        </div>
    );
};

export default ExpertPatients;
