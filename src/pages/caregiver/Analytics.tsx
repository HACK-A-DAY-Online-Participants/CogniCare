import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    CheckCircle,
    Brain,
    Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isCaregiverUser } from '../../types/user';
import type { PatientUser } from '../../types/user';
import type { Task } from '../../types/task';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { aiService } from '../../services/aiService';
import './Analytics.css';

interface AnalyticsData {
    totalPatients: number;
    activePatients: number;
    totalTasks: number;
    completedTasks: number;
    avgCompletionRate: number;
    avgCognitiveScore: number;
    totalActivities: number;
    weeklyGrowth: number;
}

interface PatientAnalytics {
    patient: PatientUser;
    tasksCompleted: number;
    totalTasks: number;
    completionRate: number;
    lastActive: Date | null;
    activityCount: number;
    trend: 'up' | 'down' | 'stable';
}

const Analytics: React.FC = () => {
    const { currentUser } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalPatients: 0,
        activePatients: 0,
        totalTasks: 0,
        completedTasks: 0,
        avgCompletionRate: 0,
        avgCognitiveScore: 0,
        totalActivities: 0,
        weeklyGrowth: 0
    });
    const [patientAnalytics, setPatientAnalytics] = useState<PatientAnalytics[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
    const [isLoading, setIsLoading] = useState(true);
    const [tasksByCategory, setTasksByCategory] = useState<Record<string, number>>({});
    const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, [currentUser, timeRange]);

    const loadAnalytics = async () => {
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        setIsLoading(true);
        try {
            const patientIds = currentUser.patients || [];

            if (patientIds.length === 0) {
                setIsLoading(false);
                return;
            }

            // Load patient details
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

            // Load all tasks
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

            // Calculate analytics
            const completedTasks = tasksData.filter(t => t.completed);
            const avgCompletionRate = tasksData.length > 0
                ? (completedTasks.length / tasksData.length) * 100
                : 0;

            const avgCognitiveScore = patientsData.length > 0
                ? patientsData.reduce((sum, p) => sum + (p.cognitiveScore || 0), 0) / patientsData.length
                : 0;

            // Get activity logs for all patients
            let totalActivities = 0;
            const patientAnalyticsData: PatientAnalytics[] = [];
            const categoryCount: Record<string, number> = {};
            const dailyActivityMap: Record<string, number> = {};

            for (const patient of patientsData) {
                const activities = await aiService.getActivityLogs(patient.id, 30);
                totalActivities += activities.length;

                const patientTasks = tasksData.filter(t => t.patientId === patient.id);
                const patientCompletedTasks = patientTasks.filter(t => t.completed);

                // Count tasks by category
                patientTasks.forEach(task => {
                    categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
                });

                // Daily activity
                activities.forEach(activity => {
                    const dateKey = activity.timestamp.toISOString().split('T')[0];
                    dailyActivityMap[dateKey] = (dailyActivityMap[dateKey] || 0) + 1;
                });

                // Determine trend
                const recentActivities = activities.filter(a =>
                    a.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                );
                const olderActivities = activities.filter(a =>
                    a.timestamp <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
                    a.timestamp > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                );

                let trend: 'up' | 'down' | 'stable' = 'stable';
                if (recentActivities.length > olderActivities.length * 1.2) trend = 'up';
                else if (recentActivities.length < olderActivities.length * 0.8) trend = 'down';

                patientAnalyticsData.push({
                    patient,
                    tasksCompleted: patientCompletedTasks.length,
                    totalTasks: patientTasks.length,
                    completionRate: patientTasks.length > 0
                        ? (patientCompletedTasks.length / patientTasks.length) * 100
                        : 0,
                    lastActive: activities.length > 0 ? activities[0].timestamp : null,
                    activityCount: activities.length,
                    trend
                });
            }

            // Convert daily activity to array
            const dailyActivityArray = Object.entries(dailyActivityMap)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(-30); // Last 30 days

            setAnalytics({
                totalPatients: patientsData.length,
                activePatients: patientsData.filter(p => p.lastVisit &&
                    p.lastVisit > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length,
                totalTasks: tasksData.length,
                completedTasks: completedTasks.length,
                avgCompletionRate,
                avgCognitiveScore,
                totalActivities,
                weeklyGrowth: 12 // Placeholder - calculate actual growth
            });

            setPatientAnalytics(patientAnalyticsData);
            setTasksByCategory(categoryCount);
            setDailyActivity(dailyActivityArray);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = () => {
        // Generate comprehensive HTML report
        const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analytics Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            display: block;
            margin-bottom: 8px;
        }
        .metric-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-sub {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 5px;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin: 0 0 20px 0;
            color: #111827;
            font-size: 24px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        .trend-up {
            color: #10b981;
            font-weight: 600;
        }
        .trend-down {
            color: #ef4444;
            font-weight: 600;
        }
        .trend-stable {
            color: #6b7280;
            font-weight: 600;
        }
        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .category-bar {
            height: 20px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            margin: 5px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 30px;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; page-break-inside: avoid; }
            .metrics-grid { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Analytics Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Time Range:</strong> ${timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'All Time'}</p>
        <p><strong>Caregiver:</strong> ${currentUser?.name || 'Unknown'}</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <span class="metric-value">${analytics.totalPatients}</span>
            <div class="metric-label">Total Patients</div>
            <div class="metric-sub">${analytics.activePatients} active this week</div>
        </div>
        <div class="metric-card">
            <span class="metric-value">${Math.round(analytics.avgCompletionRate)}%</span>
            <div class="metric-label">Completion Rate</div>
            <div class="metric-sub">${analytics.completedTasks}/${analytics.totalTasks} tasks</div>
        </div>
        <div class="metric-card">
            <span class="metric-value">${Math.round(analytics.avgCognitiveScore)}</span>
            <div class="metric-label">Avg Cognitive Score</div>
            <div class="metric-sub">Across all patients</div>
        </div>
        <div class="metric-card">
            <span class="metric-value">${analytics.totalActivities}</span>
            <div class="metric-label">Total Activities</div>
            <div class="metric-sub">+${analytics.weeklyGrowth}% this week</div>
        </div>
    </div>

    <div class="section">
        <h2>👥 Patient Performance Overview</h2>
        <table>
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Condition</th>
                    <th>Tasks Completed</th>
                    <th>Completion Rate</th>
                    <th>Activities</th>
                    <th>Last Active</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${patientAnalytics.map(pa => `
                    <tr>
                        <td><strong>${pa.patient.name}</strong></td>
                        <td>${pa.patient.condition}</td>
                        <td>${pa.tasksCompleted}/${pa.totalTasks}</td>
                        <td>${Math.round(pa.completionRate)}%</td>
                        <td>${pa.activityCount}</td>
                        <td>${pa.lastActive ? new Date(pa.lastActive).toLocaleDateString() : 'Never'}</td>
                        <td class="trend-${pa.trend}">
                            ${pa.trend === 'up' ? '↑ Improving' : pa.trend === 'down' ? '↓ Declining' : '→ Stable'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🎯 Tasks by Category</h2>
        ${Object.entries(tasksByCategory).map(([category, count]) => {
            const total = Object.values(tasksByCategory).reduce((a, b) => a + b, 0);
            const percentage = (count / total) * 100;
            return `
                <div class="category-item">
                    <div>
                        <strong>${category.charAt(0).toUpperCase() + category.slice(1)}</strong>
                        <div class="category-bar" style="width: ${percentage * 3}px"></div>
                    </div>
                    <div>
                        <strong>${count}</strong> tasks (${Math.round(percentage)}%)
                    </div>
                </div>
            `;
        }).join('')}
    </div>

    <div class="section">
        <h2>📈 Activity Summary</h2>
        <p><strong>Total Activities (Last 30 Days):</strong> ${analytics.totalActivities}</p>
        <p><strong>Average Daily Activities:</strong> ${Math.round(analytics.totalActivities / 30)}</p>
        <p><strong>Peak Activity Day:</strong> ${dailyActivity.length > 0 ?
                dailyActivity.reduce((max, day) => day.count > max.count ? day : max).date : 'N/A'
            }</p>
        <p><strong>Most Active Patient:</strong> ${patientAnalytics.length > 0 ?
                patientAnalytics.reduce((max, pa) => pa.activityCount > max.activityCount ? pa : max).patient.name : 'N/A'
            }</p>
    </div>

    <div class="footer">
        <p>This report was generated by CogniCare Analytics System</p>
        <p>For questions or concerns, please contact your system administrator</p>
        <p>© ${new Date().getFullYear()} CogniCare - All Rights Reserved</p>
    </div>
</body>
</html>
        `;

        // Create blob and trigger download
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CogniCare-Analytics-Report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show instructions
        alert('Report downloaded! Open the HTML file and use your browser\'s Print function (Ctrl+P) to save as PDF.');
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            medication: '#8b5cf6',
            exercise: '#10b981',
            mental: '#f59e0b',
            social: '#3b82f6',
            diet: '#ef4444'
        };
        return colors[category] || '#6b7280';
    };

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />

            <div className="page-container">
                <div className="analytics-header">
                    <div>
                        <h1 className="page-title">📊 Analytics Dashboard</h1>
                        <p className="page-subtitle">Comprehensive insights across all your patients</p>
                    </div>
                    <div className="header-actions">
                        <div className="time-range-selector">
                            <button
                                className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
                                onClick={() => setTimeRange('week')}
                            >
                                Week
                            </button>
                            <button
                                className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
                                onClick={() => setTimeRange('month')}
                            >
                                Month
                            </button>
                            <button
                                className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
                                onClick={() => setTimeRange('all')}
                            >
                                All Time
                            </button>
                        </div>
                        <button className="btn btn-primary" onClick={handleDownloadReport} disabled={isLoading}>
                            <Download size={18} /> Export Data
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                        <div className="loading-spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #667eea',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <>
                        <div className="metrics-grid">
                            <div className="metric-card card">
                                <div className="metric-icon purple">
                                    <Users size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Total Patients</span>
                                    <span className="metric-value">{analytics.totalPatients}</span>
                                    <span className="metric-sub">
                                        {analytics.activePatients} active this week
                                    </span>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon green">
                                    <CheckCircle size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Completion Rate</span>
                                    <span className="metric-value">{Math.round(analytics.avgCompletionRate)}%</span>
                                    <span className="metric-sub">
                                        {analytics.completedTasks}/{analytics.totalTasks} tasks
                                    </span>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon blue">
                                    <Brain size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Avg Cognitive Score</span>
                                    <span className="metric-value">{Math.round(analytics.avgCognitiveScore)}</span>
                                    <span className="metric-sub">
                                        Across all patients
                                    </span>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon orange">
                                    <Activity size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Total Activities</span>
                                    <span className="metric-value">{analytics.totalActivities}</span>
                                    <span className="metric-sub trend-up">
                                        <TrendingUp size={14} /> +{analytics.weeklyGrowth}% this week
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="analytics-content">
                            {/* Activity Chart */}
                            <div className="card chart-card">
                                <h2>📈 Activity Trend (Last 30 Days)</h2>
                                <div className="chart-container">
                                    <div className="bar-chart">
                                        {dailyActivity.map((day, index) => {
                                            const maxCount = Math.max(...dailyActivity.map(d => d.count), 1);
                                            const height = (day.count / maxCount) * 100;
                                            return (
                                                <div key={index} className="bar-wrapper">
                                                    <div
                                                        className="bar"
                                                        style={{ height: `${height}%` }}
                                                        title={`${day.date}: ${day.count} activities`}
                                                    >
                                                        <span className="bar-value">{day.count}</span>
                                                    </div>
                                                    <span className="bar-label">
                                                        {new Date(day.date).getDate()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks by Category */}
                            <div className="card chart-card">
                                <h2>🎯 Tasks by Category</h2>
                                <div className="category-chart">
                                    {Object.entries(tasksByCategory).map(([category, count]) => {
                                        const total = Object.values(tasksByCategory).reduce((a, b) => a + b, 0);
                                        const percentage = (count / total) * 100;
                                        return (
                                            <div key={category} className="category-item">
                                                <div className="category-header">
                                                    <span className="category-name">
                                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                                    </span>
                                                    <span className="category-count">{count}</span>
                                                </div>
                                                <div className="category-bar-bg">
                                                    <div
                                                        className="category-bar"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: getCategoryColor(category)
                                                        }}
                                                    />
                                                </div>
                                                <span className="category-percentage">{Math.round(percentage)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Patient Performance Table */}
                        <div className="card">
                            <h2>👥 Patient Performance Overview</h2>
                            <div className="table-container">
                                <table className="analytics-table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Tasks Completed</th>
                                            <th>Completion Rate</th>
                                            <th>Activities</th>
                                            <th>Last Active</th>
                                            <th>Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patientAnalytics.map((pa) => (
                                            <tr key={pa.patient.id}>
                                                <td>
                                                    <div className="patient-cell">
                                                        <div className="patient-avatar-small">
                                                            {pa.patient.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="patient-name">{pa.patient.name}</div>
                                                            <div className="patient-condition">{pa.patient.condition}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{pa.tasksCompleted}/{pa.totalTasks}</td>
                                                <td>
                                                    <div className="completion-cell">
                                                        <div className="completion-bar-small">
                                                            <div
                                                                className="completion-fill"
                                                                style={{ width: `${pa.completionRate}%` }}
                                                            />
                                                        </div>
                                                        <span>{Math.round(pa.completionRate)}%</span>
                                                    </div>
                                                </td>
                                                <td>{pa.activityCount}</td>
                                                <td>
                                                    {pa.lastActive
                                                        ? new Date(pa.lastActive).toLocaleDateString()
                                                        : 'Never'
                                                    }
                                                </td>
                                                <td>
                                                    <div className={`trend-badge ${pa.trend}`}>
                                                        {pa.trend === 'up' && <TrendingUp size={16} />}
                                                        {pa.trend === 'down' && <TrendingDown size={16} />}
                                                        {pa.trend === 'stable' && <span>→</span>}
                                                        {pa.trend}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Analytics;
