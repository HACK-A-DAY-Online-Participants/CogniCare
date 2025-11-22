import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import Chatbot from '../../components/common/Chatbot';
import VoiceAgent from '../../components/common/VoiceAgent';
import { Brain, Trophy, Calendar, Activity, Play, CheckCircle, UserPlus, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isPatientUser } from '../../types/user';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { CaregiverRequest } from '../../types/notifications';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, respondToCaregiverRequest } = useAuth();
    const [stats, setStats] = useState({
        points: 0,
        totalPoints: 0,
        level: 1,
        streak: 0,
        completionRate: 0
    });

    const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<CaregiverRequest[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, [currentUser]);

    const loadDashboardData = async () => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        // Load patient stats (you can implement this later with real data)
        setStats({
            points: currentUser.points || 0,
            totalPoints: currentUser.points || 0,
            level: currentUser.level || 1,
            streak: 3, // Mock value
            completionRate: 0 // Calculate from tasks later
        });

        // Load pending caregiver requests from Firestore
        try {
            const requestsQuery = query(
                collection(db, 'caregiverRequests'),
                where('patientId', '==', currentUser.id),
                where('status', '==', 'pending')
            );

            const querySnapshot = await getDocs(requestsQuery);
            const requests: CaregiverRequest[] = [];

            querySnapshot.forEach((doc) => {
                requests.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                } as CaregiverRequest);
            });

            setPendingRequests(requests);
        } catch (error) {
            console.error('Error loading caregiver requests:', error);
        }

        // TODO: Load tasks from Firestore
        setUpcomingTasks([]);
    };

    const handleRequest = async (requestId: string, accept: boolean) => {
        try {
            await respondToCaregiverRequest(requestId, accept);
            // Refresh dashboard to remove the request
            await loadDashboardData();
        } catch (error) {
            console.error('Error responding to request:', error);
        }
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="page-title">Hello, John!</h1>
                        <p className="page-subtitle">Ready to exercise your brain today?</p>
                    </div>
                    <div className="daily-streak">
                        <span className="streak-count">{stats.streak}</span>
                        <span className="streak-label">Day Streak! 🔥</span>
                    </div>
                    <VoiceAgent showStatus={false} />
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
                            <span className="stat-value large">85</span>
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
                            <span className="stat-value">{stats.completionRate}%</span>
                            <span className="stat-sub">Keep it up!</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content-grid">
                    {/* Today's Plan */}
                    <div className="content-section card">
                        <div className="section-header">
                            <h2>Today's Plan</h2>
                            <button className="btn-link">View Calendar</button>
                        </div>
                        <div className="tasks-list">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map((task) => (
                                    <div key={task.id} className="task-item">
                                        <div className={`task-icon ${task.category}`}>
                                            {task.category === 'medication' ? <Activity size={20} /> : <Calendar size={20} />}
                                        </div>
                                        <div className="task-info">
                                            <h4>{task.title}</h4>
                                            <span className="task-time">
                                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <Chatbot />
        </div>
    );
};

export default Dashboard;
