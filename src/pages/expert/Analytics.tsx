import React from 'react';
import Navigation from '../../components/common/Navigation';
import { BarChart, TrendingUp, Users, Activity } from 'lucide-react';

const ExpertAnalytics: React.FC = () => {
    return (
        <div className="page-wrapper">
            <Navigation userRole="expert" />
            <div className="page-container">
                <div className="header-section">
                    <h1>Analytics & Insights</h1>
                    <p>Track your consultation impact and patient progress</p>
                </div>

                <div className="analytics-grid">
                    {/* Summary Cards */}
                    <div className="stat-card">
                        <div className="icon-box purple">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">94%</span>
                            <span className="label">Response Rate</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box blue">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">12</span>
                            <span className="label">Total Patients</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-box green">
                            <Activity size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">4.8</span>
                            <span className="label">Avg Rating</span>
                        </div>
                    </div>

                    {/* Charts Placeholder */}
                    <div className="chart-card wide">
                        <h2>Consultation Activity</h2>
                        <div className="chart-placeholder">
                            <BarChart size={48} className="placeholder-icon" />
                            <p>Activity chart visualization would go here</p>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h2>Patient Conditions</h2>
                        <div className="chart-placeholder">
                            <div className="pie-chart-mock"></div>
                            <div className="legend">
                                <div className="legend-item"><span className="dot purple"></span> Alzheimer's (60%)</div>
                                <div className="legend-item"><span className="dot blue"></span> Dementia (30%)</div>
                                <div className="legend-item"><span className="dot green"></span> Other (10%)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .header-section { margin-bottom: 2rem; }
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
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
                .icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .icon-box.purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                .icon-box.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
                .icon-box.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                
                .stat-info { display: flex; flex-direction: column; }
                .value { font-size: 1.5rem; font-weight: 700; color: #111827; }
                .label { font-size: 0.875rem; color: #6b7280; }

                .chart-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .chart-card.wide { grid-column: span 2; }
                .chart-card h2 { margin: 0 0 1.5rem 0; font-size: 1.1rem; color: #374151; }
                
                .chart-placeholder {
                    height: 200px;
                    background: #f9fafb;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                }
                .placeholder-icon { opacity: 0.5; margin-bottom: 0.5rem; }
                
                .pie-chart-mock {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: conic-gradient(#8b5cf6 0% 60%, #3b82f6 60% 90%, #10b981 90% 100%);
                    margin-bottom: 1rem;
                }
                .legend { display: flex; flex-direction: column; gap: 0.5rem; }
                .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #4b5563; }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot.purple { background: #8b5cf6; }
                .dot.blue { background: #3b82f6; }
                .dot.green { background: #10b981; }

                @media (max-width: 1024px) {
                    .analytics-grid { grid-template-columns: 1fr; }
                    .chart-card.wide { grid-column: span 1; }
                }
            `}</style>
        </div>
    );
};

export default ExpertAnalytics;
