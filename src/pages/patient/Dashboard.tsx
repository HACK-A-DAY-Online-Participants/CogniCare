import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { Brain, Trophy, Play, CheckCircle, UserPlus, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isPatientUser } from '../../types/user';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { CaregiverRequest } from '../../types/notifications';
import type { Task } from '../../types/task';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, respondToCaregiverRequest } = useAuth();
    const [stats, setStats] = useState({
        points: 0,
        totalPoints: 0,
        level: 1,
        streak: 0,
        completionRate: 0,
        tasksCompleted: 0,
        totalTasks: 0
    });

    const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
    const [pendingRequests, setPendingRequests] = useState<CaregiverRequest[]>([]);
    const [caregiverName, setCaregiverName] = useState<string>('');

    useEffect(() => {
        loadDashboardData();
        logLoginActivity();
    }, [currentUser]);

    const logLoginActivity = async () => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        try {
            const { aiService } = await import('../../services/aiService');
            await aiService.logActivity(currentUser.id, 'login', {
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging login activity:', error);
        }
    };

    const loadDashboardData = async () => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        try {
            // Load tasks from Firebase
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('patientId', '==', currentUser.id)
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

            // Calculate stats from tasks
            const completedTasks = tasksData.filter(t => t.completed);
            const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);
            const level = Math.floor(totalPoints / 500) + 1;
            const completionRate = tasksData.length > 0
                ? Math.round((completedTasks.length / tasksData.length) * 100)
                : 0;

            setStats({
                points: totalPoints,
                totalPoints: totalPoints,
                level: level,
                streak: 3, // TODO: Calculate actual streak from completion dates
                completionRate: completionRate,
                tasksCompleted: completedTasks.length,
                totalTasks: tasksData.length
            });

            // Get upcoming tasks (not completed, sorted by due date)
            const upcoming = tasksData
                .filter(t => !t.completed)
                .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                .slice(0, 3);

            setUpcomingTasks(upcoming);

            // Load caregiver name if connected
            if (currentUser.caregiverId) {
                const caregiverDoc = await getDoc(doc(db, 'users', currentUser.caregiverId));
                if (caregiverDoc.exists()) {
                    setCaregiverName(caregiverDoc.data().name);
                }
            }

            // Load pending caregiver requests
            const requestsQuery = query(
                collection(db, 'caregiverRequests'),
                where('patientId', '==', currentUser.id),
                where('status', '==', 'pending')
            );

            const requestsSnapshot = await getDocs(requestsQuery);
            const requests: CaregiverRequest[] = [];

            requestsSnapshot.forEach((doc) => {
                requests.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                } as CaregiverRequest);
            });

            setPendingRequests(requests);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const handleRequest = async (requestId: string, accept: boolean) => {
        try {
            await respondToCaregiverRequest(requestId, accept);
            // Refresh dashboard to remove the request and update caregiver info
            await loadDashboardData();
        } catch (error) {
            console.error('Error responding to request:', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'medication': return '💊';
            case 'exercise': return '🏃';
            case 'mental': return '🧠';
            case 'social': return '👥';
            case 'diet': return '🥗';
            default: return '📋';
        }
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="page-title">Hello, {currentUser?.name || 'Patient'}!</h1>
                        <p className="page-subtitle">Ready to exercise your brain today?</p>
                    </div>
                    <div className="daily-streak">
                        <span className="streak-count">{stats.streak}</span>
                        <span className="streak-label">Day Streak! 🔥</span>
                    </div>
                </header>

                {/* Connection Request Alert */}
                {pendingRequests.length > 0 && (
                    <div className="connection-alert card">
                        <div className="alert-header">
                            <UserPlus size={24} className="text-primary" />
                            <h3>New Connection Request</h3>
                        </div>
                        {pendingRequests.map(req => (
                            <div key={req.id} className="request-item">
                                <p><strong>{req.caregiverName}</strong> wants to connect with you.</p>
                                <div className="request-actions">
                                    <button className="btn-reject" onClick={() => handleRequest(req.id, false)}>
                                        <X size={18} /> Reject
                                    </button>
                                    <button className="btn-accept" onClick={() => handleRequest(req.id, true)}>
                                        <Check size={18} /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Overview */}
                <div className="stats-grid">
                    <div className="stat-card card highlight">
                        <div className="stat-icon-bg purple">
                            <Brain size={32} className="text-white" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Cognitive Score</span>
                            <span className="stat-value large">{currentUser && isPatientUser(currentUser) ? currentUser.cognitiveScore : 85}</span>
                            <span className="stat-sub">Excellent! Top 10%</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon-bg yellow">
                            <Trophy size={24} className="text-yellow-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Points</span>
                            <span className="stat-value">{stats.totalPoints}</span>
                            <span className="stat-sub">Level {stats.level}</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon-bg green">
                            <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Tasks Done</span>
                            <span className="stat-value">{stats.tasksCompleted}/{stats.totalTasks}</span>
                            <span className="stat-sub">{stats.completionRate}% Complete</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content-grid">
                    {/* Today's Plan */}
                    <div className="content-section card">
                        <div className="section-header">
                            <h2>Today's Plan</h2>
                            {caregiverName && (
                                <span className="text-sm text-gray-600">Assigned by {caregiverName}</span>
                            )}
                        </div>
                        <div className="tasks-list">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map((task) => (
                                    <div key={task.id} className="task-item">
                                        <div className={`task-icon ${task.category}`}>
                                            <span style={{ fontSize: '20px' }}>{getCategoryIcon(task.category)}</span>
                                        </div>
                                        <div className="task-info">
                                            <h4>{task.title}</h4>
                                            <span className="task-time">
                                                {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {task.points} pts
                                            </span>
                                        </div>
                                        <button className="btn-action">Start</button>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state-small">
                                    <CheckCircle size={32} className="text-green-500" />
                                    <p>All caught up for today!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Connection Code & Games */}
                    <div className="right-column">
                        {/* Connection Code Card */}
                        <div className="content-section card connection-card">
                            <div className="section-header">
                                <h2>Your Connection Code</h2>
                            </div>
                            <div className="code-display">
                                {!currentUser ? (
                                    <p className="text-sm text-gray-600">Loading user data...</p>
                                ) : isPatientUser(currentUser) ? (
                                    <>
                                        <span className="code-text">{currentUser.uniqueCode}</span>
                                        <p className="code-instruction">Share this code with your caregiver to connect.</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-yellow-600">
                                        Connection codes are only available for patient accounts.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recommended Games */}
                        <div className="content-section card">
                            <div className="section-header">
                                <h2>Recommended Games</h2>
                                <button className="btn-link">All Games</button>
                            </div>
                            <div className="games-list">
                                <div className="game-item">
                                    <div className="game-thumbnail memory">
                                        <Brain size={24} />
                                    </div>
                                    <div className="game-info">
                                        <h4>Memory Match</h4>
                                        <span className="game-category">Memory • 5 min</span>
                                    </div>
                                    <button className="play-btn-small">
                                        <Play size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
