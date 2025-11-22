import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { Users, Activity, Bell, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isCaregiverUser } from '../../types/user';
import type { PatientUser } from '../../types/user';
import type { Task } from '../../types/task';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalPatients: 0,
        activeTasks: 0,
        completionRate: 0,
        avgCognitiveScore: 0
    });

    const [patients, setPatients] = useState<PatientUser[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, [currentUser]);

    const loadDashboardData = async () => {
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        try {
            // Load connected patients
            const patientIds = currentUser.patients || [];

            if (patientIds.length === 0) {
                setPatients([]);
                setStats({
                    totalPatients: 0,
                    activeTasks: 0,
                    completionRate: 0,
                    avgCognitiveScore: 0
                });
                return;
            }

            // Fetch patient details
            const patientsData: PatientUser[] = [];
            for (const patientId of patientIds) {
                const patientDoc = await getDoc(doc(db, 'users', patientId));
                if (patientDoc.exists() && patientDoc.data().role === 'patient') {
                    patientsData.push({
                        id: patientDoc.id,
                        ...patientDoc.data(),
                        createdAt: patientDoc.data().createdAt?.toDate() || new Date(),
                        updatedAt: patientDoc.data().updatedAt?.toDate() || new Date(),
                        lastVisit: patientDoc.data().lastVisit?.toDate()
                    } as PatientUser);
                }
            }
            setPatients(patientsData);

            // Load all tasks for this caregiver
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('caregiverId', '==', currentUser.id)
            );

            const tasksSnapshot = await getDocs(tasksQuery);
            const tasksData: Task[] = [];

            tasksSnapshot.forEach((doc) => {
                const data = doc.data();
                tasksData.push({
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate?.toDate() || new Date(),
                    completedAt: data.completedAt?.toDate(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                } as Task);
            });

            // Calculate stats
            const completedTasks = tasksData.filter(t => t.completed);
            const activeTasks = tasksData.filter(t => !t.completed);
            const completionRate = tasksData.length > 0
                ? Math.round((completedTasks.length / tasksData.length) * 100)
                : 0;

            const avgCognitiveScore = patientsData.length > 0
                ? Math.round(patientsData.reduce((sum, p) => sum + (p.cognitiveScore || 0), 0) / patientsData.length)
                : 0;

            setStats({
                totalPatients: patientsData.length,
                activeTasks: activeTasks.length,
                completionRate,
                avgCognitiveScore
            });

            // Generate recent activities from completed tasks
            const activities: any[] = [];
            const recentCompletedTasks = completedTasks
                .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
                .slice(0, 5);

            recentCompletedTasks.forEach(task => {
                activities.push({
                    id: task.id,
                    type: 'task',
                    title: `${task.patientName} completed "${task.title}"`,
                    score: task.points,
                    timestamp: task.completedAt || new Date()
                });
            });

            setRecentActivities(activities);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'needs-attention': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />

            <div className="page-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="page-title">Welcome back, {currentUser?.name || 'Caregiver'}</h1>
                        <p className="page-subtitle">Here's what's happening with your patients today.</p>
                    </div>
                    <div className="header-actions">
                        <button className="notification-btn">
                            <Bell size={20} />
                            <span className="notification-badge">0</span>
                        </button>
                        <div className="date-display">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card card">
                        <div className="stat-icon-bg blue">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Patients</span>
                            <span className="stat-value">{stats.totalPatients}</span>
                            <span className="stat-trend positive">
                                <TrendingUp size={14} /> Active
                            </span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon-bg orange">
                            <Clock size={24} className="text-orange-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Active Tasks</span>
                            <span className="stat-value">{stats.activeTasks}</span>
                            <span className="stat-sub">Pending completion</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon-bg green">
                            <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Completion Rate</span>
                            <span className="stat-value">{stats.completionRate}%</span>
                            <span className="stat-sub">Overall progress</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon-bg purple">
                            <Activity size={24} className="text-purple-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Avg Cognitive Score</span>
                            <span className="stat-value">{stats.avgCognitiveScore}</span>
                            <span className="stat-sub">Across all patients</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content-grid">
                    {/* Patients Overview */}
                    <div className="content-section card">
                        <div className="section-header">
                            <h2>My Patients</h2>
                            <button className="btn-link">View All</button>
                        </div>
                        <div className="patients-list">
                            {patients.length > 0 ? (
                                patients.slice(0, 4).map((patient) => (
                                    <div key={patient.id} className="patient-item">
                                        <div className="patient-avatar">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div className="patient-info">
                                            <h4>{patient.name}</h4>
                                            <span className="patient-condition">{patient.condition}</span>
                                        </div>
                                        <div className="patient-score">
                                            <span className="score-label">Score</span>
                                            <span className="score-value">{patient.cognitiveScore || 0}</span>
                                        </div>
                                        <div
                                            className="status-indicator"
                                            style={{ backgroundColor: getStatusColor(patient.status) }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state-small">
                                    <Users size={32} />
                                    <p>No patients connected yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="content-section card">
                        <div className="section-header">
                            <h2>Recent Activity</h2>
                            <button className="btn-link">View All</button>
                        </div>
                        <div className="activity-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            <CheckCircle size={20} className="text-green-500" />
                                        </div>
                                        <div className="activity-content">
                                            <p className="activity-title">{activity.title}</p>
                                            <span className="activity-time">
                                                {activity.timestamp instanceof Date
                                                    ? activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                        <span className="activity-points">+{activity.score} pts</span>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state-small">
                                    <Activity size={32} />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
