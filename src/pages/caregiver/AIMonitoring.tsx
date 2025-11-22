import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { Brain, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isCaregiverUser } from '../../types/user';
import type { PatientUser } from '../../types/user';
import type { AnomalyAlert, AIInsight, PatientActivityLog } from '../../types/aiAnalysis';
import { aiService } from '../../services/aiService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './AIMonitoring.css';

const AIMonitoring: React.FC = () => {
    const { currentUser } = useAuth();
    const [patients, setPatients] = useState<PatientUser[]>([]);
    const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);
    const [insights, setInsights] = useState<Record<string, AIInsight[]>>({});
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activityLogs, setActivityLogs] = useState<PatientActivityLog[]>([]);

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser || !isCaregiverUser(currentUser)) return;

        setIsLoading(true);
        try {
            // Load connected patients
            const patientIds = currentUser.patients || [];

            if (patientIds.length === 0) {
                setIsLoading(false);
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

            // Generate anomaly alerts for each patient
            const allAlerts: AnomalyAlert[] = [];
            const allInsights: Record<string, AIInsight[]> = {};

            for (const patient of patientsData) {
                const alerts = await aiService.detectAnomalies(patient.id, patient.name);
                allAlerts.push(...alerts);

                // Save alerts to Firebase
                for (const alert of alerts) {
                    if (alert.status === 'active') {
                        await aiService.saveAnomalyAlert(alert);
                    }
                }

                // Generate insights
                const patientInsights = await aiService.generateInsights(patient.id);
                allInsights[patient.id] = patientInsights;
            }

            setAnomalyAlerts(allAlerts);
            setInsights(allInsights);

            // Select first patient by default
            if (patientsData.length > 0 && !selectedPatient) {
                setSelectedPatient(patientsData[0].id);
                const logs = await aiService.getActivityLogs(patientsData[0].id, 7);
                setActivityLogs(logs);
            }

        } catch (error) {
            console.error('Error loading AI monitoring data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePatientSelect = async (patientId: string) => {
        setSelectedPatient(patientId);
        const logs = await aiService.getActivityLogs(patientId, 7);
        setActivityLogs(logs);
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            await updateDoc(doc(db, 'anomalyAlerts', alertId), {
                status: 'acknowledged',
                acknowledgedBy: currentUser?.id,
                acknowledgedAt: new Date()
            });

            setAnomalyAlerts(anomalyAlerts.map(alert =>
                alert.id === alertId
                    ? { ...alert, status: 'acknowledged', acknowledgedBy: currentUser?.id, acknowledgedAt: new Date() }
                    : alert
            ));
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await updateDoc(doc(db, 'anomalyAlerts', alertId), {
                status: 'resolved',
                resolvedAt: new Date()
            });

            setAnomalyAlerts(anomalyAlerts.filter(alert => alert.id !== alertId));
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return <AlertTriangle size={24} className="text-red-600" />;
            case 'concern': return <AlertTriangle size={24} className="text-orange-600" />;
            case 'warning': return <AlertTriangle size={24} className="text-yellow-600" />;
            default: return <AlertTriangle size={24} />;
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'critical': return '#ef4444';
            case 'concern': return '#f97316';
            case 'warning': return '#eab308';
            default: return '#6b7280';
        }
    };



    const selectedPatientData = patients.find(p => p.id === selectedPatient);
    const selectedPatientInsights = selectedPatient ? insights[selectedPatient] || [] : [];
    const selectedPatientAlerts = anomalyAlerts.filter(a => a.patientId === selectedPatient);

    // Calculate activity stats
    const loginCount = activityLogs.filter(l => l.activityType === 'login').length;
    const taskCount = activityLogs.filter(l => l.activityType === 'task_completed').length;
    const gameCount = activityLogs.filter(l => l.activityType === 'game_played').length;

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />

            <div className="page-container">
                <div className="ai-monitoring-header">
                    <div>
                        <h1 className="page-title">🤖 AI-Powered Monitoring</h1>
                        <p className="page-subtitle">Intelligent behavior analysis and predictive insights</p>
                    </div>
                    <button className="btn btn-primary" onClick={loadData} disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                </div>

                {/* Alert Summary */}
                <div className="alert-summary-grid">
                    <div className="alert-summary-card critical">
                        <div className="alert-count">{anomalyAlerts.filter(a => a.type === 'critical').length}</div>
                        <div className="alert-label">Critical Alerts</div>
                    </div>
                    <div className="alert-summary-card concern">
                        <div className="alert-count">{anomalyAlerts.filter(a => a.type === 'concern').length}</div>
                        <div className="alert-label">Concerns</div>
                    </div>
                    <div className="alert-summary-card warning">
                        <div className="alert-count">{anomalyAlerts.filter(a => a.type === 'warning').length}</div>
                        <div className="alert-label">Warnings</div>
                    </div>
                    <div className="alert-summary-card insights">
                        <div className="alert-count">{Object.values(insights).flat().length}</div>
                        <div className="alert-label">AI Insights</div>
                    </div>
                </div>

                <div className="ai-monitoring-content">
                    {/* Patient Selector */}
                    <div className="patient-selector card">
                        <h3>Select Patient</h3>
                        <div className="patient-list">
                            {patients.map(patient => (
                                <div
                                    key={patient.id}
                                    className={`patient-item ${selectedPatient === patient.id ? 'active' : ''}`}
                                    onClick={() => handlePatientSelect(patient.id)}
                                >
                                    <div className="patient-avatar">{patient.name.charAt(0)}</div>
                                    <div className="patient-info">
                                        <h4>{patient.name}</h4>
                                        <span>{patient.condition}</span>
                                    </div>
                                    {anomalyAlerts.filter(a => a.patientId === patient.id && a.status === 'active').length > 0 && (
                                        <div className="alert-badge">
                                            {anomalyAlerts.filter(a => a.patientId === patient.id && a.status === 'active').length}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="ai-main-content">
                        {selectedPatientData ? (
                            <>
                                {/* Patient Overview */}
                                <div className="card patient-overview">
                                    <h2>{selectedPatientData.name}'s AI Analysis</h2>
                                    <div className="activity-stats">
                                        <div className="stat">
                                            <span className="stat-value">{loginCount}</span>
                                            <span className="stat-label">Logins (7 days)</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{taskCount}</span>
                                            <span className="stat-label">Tasks Completed</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{gameCount}</span>
                                            <span className="stat-label">Games Played</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{activityLogs.length}</span>
                                            <span className="stat-label">Total Activities</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Anomaly Alerts */}
                                {selectedPatientAlerts.length > 0 && (
                                    <div className="card anomaly-alerts">
                                        <h3>⚠️ Anomaly Alerts</h3>
                                        {selectedPatientAlerts.map(alert => (
                                            <div
                                                key={alert.id}
                                                className="anomaly-alert"
                                                style={{ borderLeftColor: getAlertColor(alert.type) }}
                                            >
                                                <div className="alert-header">
                                                    {getAlertIcon(alert.type)}
                                                    <div className="alert-title-section">
                                                        <h4>{alert.title}</h4>
                                                        <span className="alert-confidence">
                                                            {alert.confidence}% confidence
                                                        </span>
                                                    </div>
                                                    <div className="alert-actions">
                                                        {alert.status === 'active' && (
                                                            <>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                                                    title="Acknowledge"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => handleResolveAlert(alert.id)}
                                                                    title="Resolve"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="alert-description">{alert.description}</p>
                                                <div className="alert-metrics">
                                                    <strong>Affected Metrics:</strong> {alert.affectedMetrics.join(', ')}
                                                </div>
                                                <div className="suggested-actions">
                                                    <strong>Suggested Actions:</strong>
                                                    <ul>
                                                        {alert.suggestedActions.map((action, idx) => (
                                                            <li key={idx}>{action}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* AI Insights */}
                                {selectedPatientInsights.length > 0 && (
                                    <div className="card ai-insights">
                                        <h3>💡 AI Insights</h3>
                                        {selectedPatientInsights.map(insight => (
                                            <div key={insight.id} className="insight-card">
                                                <div className="insight-header">
                                                    <Brain size={20} className="text-purple-600" />
                                                    <h4>{insight.title}</h4>
                                                    <span className={`priority-badge ${insight.priority}`}>
                                                        {insight.priority}
                                                    </span>
                                                </div>
                                                <p>{insight.description}</p>
                                                {insight.actionable && insight.actions && (
                                                    <div className="insight-actions">
                                                        <strong>Recommendations:</strong>
                                                        <ul>
                                                            {insight.actions.map((action, idx) => (
                                                                <li key={idx}>{action}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                <div className="insight-footer">
                                                    <span className="confidence">{insight.confidence}% confidence</span>
                                                    <span className="timestamp">
                                                        {insight.generatedAt.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Recent Activity Timeline */}
                                <div className="card activity-timeline">
                                    <h3>📊 Recent Activity (Last 7 Days)</h3>
                                    <div className="timeline">
                                        {activityLogs.slice(0, 10).map(log => (
                                            <div key={log.id} className="timeline-item">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-content">
                                                    <span className="activity-type">{log.activityType.replace('_', ' ')}</span>
                                                    <span className="activity-time">
                                                        {log.timestamp.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <Brain size={64} />
                                <h3>Select a patient to view AI analysis</h3>
                                <p>Choose a patient from the list to see intelligent insights and anomaly detection.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIMonitoring;
