import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/common/Navigation';
import { isExpertUser } from '../../types/user';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
    CheckCircle,
    AlertCircle,
    Users,
    MessageSquare,
    Clock,
    ChevronRight
} from 'lucide-react';


const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingConsultations: 0,
        activePatients: 0,
        totalConsultations: 0
    });

    useEffect(() => {
        const loadStats = async () => {
            if (!currentUser) return;

            try {
                // 1. Get Pending Consultations
                const pendingQuery = query(
                    collection(db, 'consultations'),
                    where('expertId', '==', currentUser.id),
                    where('status', '==', 'pending')
                );
                const pendingSnapshot = await getDocs(pendingQuery);

                // 2. Get All Consultations (for total count and active patients)
                const allQuery = query(
                    collection(db, 'consultations'),
                    where('expertId', '==', currentUser.id)
                );
                const allSnapshot = await getDocs(allQuery);

                // Calculate Active Patients (unique caregivers with accepted/active consultations)
                const uniquePatients = new Set();
                allSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'accepted' || data.status === 'completed') {
                        uniquePatients.add(data.caregiverId);
                    }
                });

                setStats({
                    pendingConsultations: pendingSnapshot.size,
                    activePatients: uniquePatients.size,
                    totalConsultations: allSnapshot.size
                });

            } catch (error) {
                console.error("Error loading dashboard stats:", error);
            }
        };

        loadStats();
    }, [currentUser]);

    if (!currentUser || !isExpertUser(currentUser)) return <div>Access Denied</div>;

    return (
        <div className="page-wrapper">
            <Navigation userRole="expert" />
            <div className="page-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, Dr. {currentUser.name}</h1>
                        <p className="subtitle">Manage your consultations and patients</p>
                    </div>
                    <div className="header-actions">
                        {!currentUser.verified && (
                            <button
                                className="btn btn-warning"
                                onClick={() => navigate('/expert/profile')}
                            >
                                <AlertCircle size={18} /> Complete Verification
                            </button>
                        )}
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.pendingConsultations}</span>
                            <span className="stat-label">Pending Requests</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.activePatients}</span>
                            <span className="stat-label">Active Patients</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <MessageSquare size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.totalConsultations}</span>
                            <span className="stat-label">Total Consultations</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <div className="card action-card">
                        <h2>Quick Actions</h2>
                        <div className="action-buttons">
                            <button className="action-btn" onClick={() => navigate('/expert/consultations')}>
                                <MessageSquare size={20} />
                                <span>View Consultations</span>
                                <ChevronRight size={16} className="arrow" />
                            </button>
                            <button className="action-btn" onClick={() => navigate('/expert/patients')}>
                                <Users size={20} />
                                <span>My Patients</span>
                                <ChevronRight size={16} className="arrow" />
                            </button>
                            <button className="action-btn" onClick={() => navigate('/expert/profile')}>
                                <CheckCircle size={20} />
                                <span>Update Profile</span>
                                <ChevronRight size={16} className="arrow" />
                            </button>
                        </div>
                    </div>

                    <div className="card recent-activity">
                        <h2>Recent Activity</h2>
                        <div className="empty-state">
                            <p>No recent activity to show.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .subtitle {
                    color: #6b7280;
                    margin-top: 0.25rem;
                }
                .btn-warning {
                    background-color: #f59e0b;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .stat-icon.orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
                .stat-icon.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
                .stat-icon.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                
                .stat-content {
                    display: flex;
                    flex-direction: column;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #111827;
                }
                .stat-label {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                .dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 1.5rem;
                }
                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    width: 100%;
                }
                .action-btn:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }
                .action-btn span {
                    flex: 1;
                    font-weight: 500;
                    color: #374151;
                }
                .action-btn .arrow {
                    color: #9ca3af;
                }
                .empty-state {
                    padding: 2rem;
                    text-align: center;
                    color: #9ca3af;
                    background: #f9fafb;
                    border-radius: 8px;
                }
                @media (max-width: 768px) {
                    .dashboard-content {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
