import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isPatientUser } from '../../types/user';
import type { AIInsight, PatientActivityLog, BehaviorPattern } from '../../types/aiAnalysis';
import { aiService } from '../../services/aiService';
import './AIInsights.css';

const AIInsights: React.FC = () => {
    const { currentUser } = useAuth();
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [activityLogs, setActivityLogs] = useState<PatientActivityLog[]>([]);
    const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, [currentUser]);

    const loadInsights = async () => {
        if (!currentUser || !isPatientUser(currentUser)) return;

        setIsLoading(true);
        try {
            // Generate AI insights
            const aiInsights = await aiService.generateInsights(currentUser.id);
            setInsights(aiInsights);

            // Get activity logs
            const logs = await aiService.getActivityLogs(currentUser.id, 30);
            setActivityLogs(logs);

            // Calculate behavior patterns
            const behaviorPatterns = await aiService.calculateBaseline(currentUser.id);
            setPatterns(behaviorPatterns);

        } catch (error) {
            console.error('Error loading AI insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp size={24} className="text-green-600" />;
            case 'declining': return <TrendingDown size={24} className="text-red-600" />;
            default: return <Minus size={24} className="text-gray-600" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'improving': return '#10b981';
            case 'declining': return '#ef4444';
            default: return '#6b7280';
        }
    };

    // Calculate stats
    const totalActivities = activityLogs.length;
    const last7Days = activityLogs.filter(l =>
        l.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const tasksCompleted = activityLogs.filter(l => l.activityType === 'task_completed').length;
    const gamesPlayed = activityLogs.filter(l => l.activityType === 'game_played').length;

    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <div className="ai-insights-header">
                    <div>
                        <h1 className="page-title">🤖 Your AI Insights</h1>
                        <p className="page-subtitle">Personalized recommendations based on your activity</p>
                    </div>
                    <button className="btn btn-primary" onClick={loadInsights} disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : 'Refresh Insights'}
                    </button>
                </div>

                {/* Activity Overview */}
                <div className="card activity-overview">
                    <h2>📊 Your Activity Summary</h2>
                    <div className="activity-grid">
                        <div className="activity-stat">
                            <Activity size={32} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{totalActivities}</span>
                                <span className="stat-label">Total Activities (30 days)</span>
                            </div>
                        </div>
                        <div className="activity-stat">
                            <TrendingUp size={32} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{last7Days}</span>
                                <span className="stat-label">Activities This Week</span>
                            </div>
                        </div>
                        <div className="activity-stat">
                            <Brain size={32} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{gamesPlayed}</span>
                                <span className="stat-label">Brain Games Played</span>
                            </div>
                        </div>
                        <div className="activity-stat">
                            <Lightbulb size={32} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{tasksCompleted}</span>
                                <span className="stat-label">Tasks Completed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Behavior Patterns */}
                {patterns.length > 0 && (
                    <div className="card behavior-patterns">
                        <h2>📈 Your Behavior Patterns</h2>
                        <div className="patterns-grid">
                            {patterns.map((pattern, idx) => (
                                <div key={idx} className="pattern-card">
                                    <div className="pattern-header">
                                        {getTrendIcon(pattern.trend)}
                                        <h3>{pattern.metric.charAt(0).toUpperCase() + pattern.metric.slice(1)}</h3>
                                    </div>
                                    <div className="pattern-content">
                                        <div className="pattern-stat">
                                            <span className="label">Current</span>
                                            <span className="value">{Math.round(pattern.currentValue)}</span>
                                        </div>
                                        <div className="pattern-stat">
                                            <span className="label">Average</span>
                                            <span className="value">{Math.round(pattern.baseline.average)}</span>
                                        </div>
                                        <div className="pattern-stat">
                                            <span className="label">Trend</span>
                                            <span
                                                className="value trend"
                                                style={{ color: getTrendColor(pattern.trend) }}
                                            >
                                                {pattern.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pattern-footer">
                                        <span className="confidence">{pattern.confidence}% confidence</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Insights */}
                {insights.length > 0 ? (
                    <div className="card ai-insights-section">
                        <h2>💡 Personalized Insights</h2>
                        <div className="insights-list">
                            {insights.map(insight => (
                                <div key={insight.id} className={`insight-card priority-${insight.priority}`}>
                                    <div className="insight-header">
                                        <Brain size={24} />
                                        <h3>{insight.title}</h3>
                                        <span className={`priority-badge ${insight.priority}`}>
                                            {insight.priority} priority
                                        </span>
                                    </div>
                                    <p className="insight-description">{insight.description}</p>
                                    {insight.actionable && insight.actions && (
                                        <div className="insight-actions">
                                            <strong>💪 What you can do:</strong>
                                            <ul>
                                                {insight.actions.map((action, idx) => (
                                                    <li key={idx}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="insight-footer">
                                        <span className="insight-type">{insight.type}</span>
                                        <span className="insight-confidence">{insight.confidence}% accurate</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card empty-insights">
                        <Brain size={64} />
                        <h3>Keep using the app to get personalized insights!</h3>
                        <p>Complete more tasks and play brain games to help our AI understand your patterns and provide tailored recommendations.</p>
                    </div>
                )}

                {/* Privacy Notice */}
                <div className="card privacy-notice">
                    <h3>🔒 Your Privacy Matters</h3>
                    <p>
                        All AI analysis is done securely and privately. Your data is never shared without your consent.
                        You can disable AI insights anytime from your privacy settings.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
