import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PatientActivityLog, BehaviorPattern, AnomalyAlert, AIInsight } from '../types/aiAnalysis';

class AIAnalysisService {
    // Log patient activity
    async logActivity(
        patientId: string,
        activityType: 'login' | 'task_completed' | 'game_played' | 'medication_taken' | 'voice_journal' | 'mood_entry',
        metadata: any = {}
    ): Promise<void> {
        try {
            await addDoc(collection(db, 'activityLogs'), {
                patientId,
                activityType,
                timestamp: serverTimestamp(),
                metadata,
                deviceInfo: {
                    type: 'web',
                    browser: navigator.userAgent
                }
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Get activity logs for a patient
    async getActivityLogs(patientId: string, days: number = 30): Promise<PatientActivityLog[]> {
        try {
            // Simplified query - just get all logs for patient
            const q = query(
                collection(db, 'activityLogs'),
                where('patientId', '==', patientId)
            );

            const snapshot = await getDocs(q);
            const logs: PatientActivityLog[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                logs.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date()
                } as PatientActivityLog);
            });

            // Filter by date in memory and sort
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            return logs
                .filter(log => log.timestamp >= cutoffDate)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        } catch (error) {
            console.error('Error fetching activity logs:', error);
            return [];
        }
    }

    // Calculate baseline behavior patterns
    async calculateBaseline(patientId: string): Promise<BehaviorPattern[]> {
        const logs = await this.getActivityLogs(patientId, 30);
        const patterns: BehaviorPattern[] = [];

        // Activity pattern
        const activityPattern = this.analyzeActivityPattern(logs);
        patterns.push(activityPattern);

        // Task completion pattern
        const taskPattern = this.analyzeTaskPattern(logs);
        patterns.push(taskPattern);

        // Cognitive performance pattern
        const cognitivePattern = this.analyzeCognitivePattern(logs);
        patterns.push(cognitivePattern);

        return patterns;
    }

    private analyzeActivityPattern(logs: PatientActivityLog[]): BehaviorPattern {
        const loginLogs = logs.filter(l => l.activityType === 'login');
        const dailyLogins = this.groupByDay(loginLogs);

        const values = Object.values(dailyLogins).map(day => day.length);
        const average = values.reduce((a, b) => a + b, 0) / values.length || 0;
        const stdDev = this.calculateStdDev(values, average);

        // Get most common login hour
        const hours = loginLogs.map(l => l.timestamp.getHours());
        const mostCommonHour = this.getMostCommon(hours);

        return {
            patientId: logs[0]?.patientId || '',
            metric: 'activity',
            baseline: {
                average,
                standardDeviation: stdDev,
                timeOfDay: `${mostCommonHour}:00`,
                dayOfWeek: 0
            },
            currentValue: loginLogs.length,
            deviation: 0,
            trend: 'stable',
            confidence: 85,
            lastUpdated: new Date()
        };
    }

    private analyzeTaskPattern(logs: PatientActivityLog[]): BehaviorPattern {
        const taskLogs = logs.filter(l => l.activityType === 'task_completed');
        const dailyTasks = this.groupByDay(taskLogs);

        const values = Object.values(dailyTasks).map(day => day.length);
        const average = values.reduce((a, b) => a + b, 0) / values.length || 0;
        const stdDev = this.calculateStdDev(values, average);

        return {
            patientId: logs[0]?.patientId || '',
            metric: 'activity',
            baseline: {
                average,
                standardDeviation: stdDev,
                timeOfDay: '09:00',
                dayOfWeek: 0
            },
            currentValue: taskLogs.length,
            deviation: 0,
            trend: 'stable',
            confidence: 80,
            lastUpdated: new Date()
        };
    }

    private analyzeCognitivePattern(logs: PatientActivityLog[]): BehaviorPattern {
        const gameLogs = logs.filter(l => l.activityType === 'game_played' && l.metadata?.score);
        const scores = gameLogs.map(l => l.metadata?.score).filter((score): score is number => typeof score === 'number');

        const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const stdDev = this.calculateStdDev(scores, average);

        // Calculate trend
        const recentScores = scores.slice(0, 5);
        const olderScores = scores.slice(5, 10);
        const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
        const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : 0;

        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (recentAvg > olderAvg * 1.1) trend = 'improving';
        if (recentAvg < olderAvg * 0.9) trend = 'declining';

        return {
            patientId: logs[0]?.patientId || '',
            metric: 'cognitive',
            baseline: {
                average,
                standardDeviation: stdDev,
                timeOfDay: '10:00',
                dayOfWeek: 0
            },
            currentValue: recentAvg,
            deviation: stdDev > 0 ? Math.abs(recentAvg - average) / stdDev : 0,
            trend,
            confidence: 75,
            lastUpdated: new Date()
        };
    }

    // Detect anomalies
    async detectAnomalies(patientId: string, patientName: string): Promise<AnomalyAlert[]> {
        const logs = await this.getActivityLogs(patientId, 7);
        const allLogs = await this.getActivityLogs(patientId, 30); // Get 30 days for baseline
        const patterns = await this.calculateBaseline(patientId);
        const alerts: AnomalyAlert[] = [];

        console.log(`[AI] Analyzing ${patientName}:`, {
            last7Days: logs.length,
            last30Days: allLogs.length,
            patterns: patterns.map(p => ({ metric: p.metric, trend: p.trend }))
        });

        // Only generate alerts if patient has some baseline activity
        const hasBaseline = allLogs.length >= 5; // Need at least 5 activities to establish baseline

        // Check for inactivity (only if they had activity before)
        const recentLogins = logs.filter(l =>
            l.activityType === 'login' &&
            l.timestamp > new Date(Date.now() - 48 * 60 * 60 * 1000)
        );

        if (hasBaseline && recentLogins.length === 0 && allLogs.filter(l => l.activityType === 'login').length > 3) {
            alerts.push({
                id: `anomaly_${Date.now()}_1`,
                patientId,
                patientName,
                type: 'critical',
                title: 'No Activity Detected',
                description: `${patientName} has not logged in for 48+ hours. This is unusual based on their typical pattern.`,
                detectedAt: new Date(),
                affectedMetrics: ['activity'],
                suggestedActions: [
                    'Send a check-in message',
                    'Make a phone call',
                    'Review recent mood entries'
                ],
                confidence: 95,
                status: 'active'
            });
        }

        // Check for declining cognitive performance
        const cognitivePattern = patterns.find(p => p.metric === 'cognitive');
        if (cognitivePattern && cognitivePattern.trend === 'declining' && cognitivePattern.deviation > 2) {
            alerts.push({
                id: `anomaly_${Date.now()}_2`,
                patientId,
                patientName,
                type: 'concern',
                title: 'Cognitive Performance Declining',
                description: `Game scores have dropped ${Math.round(cognitivePattern.deviation * 10)}% below baseline over the past week.`,
                detectedAt: new Date(),
                affectedMetrics: ['cognitive'],
                suggestedActions: [
                    'Schedule cognitive assessment',
                    'Increase mental exercise tasks',
                    'Consult with healthcare provider'
                ],
                confidence: cognitivePattern.confidence,
                status: 'active'
            });
        }

        // Check for reduced task completion (only if they had tasks before)
        const taskLogs = logs.filter(l => l.activityType === 'task_completed');
        const allTaskLogs = allLogs.filter(l => l.activityType === 'task_completed');
        const expectedTasks = 3; // Average tasks per day
        const actualTasks = taskLogs.length / 7;

        if (hasBaseline && allTaskLogs.length >= 5 && actualTasks < expectedTasks * 0.5) {
            alerts.push({
                id: `anomaly_${Date.now()}_3`,
                patientId,
                patientName,
                type: 'warning',
                title: 'Low Task Completion Rate',
                description: `Only ${taskLogs.length} tasks completed this week (expected ~${expectedTasks * 7}). This may indicate decreased engagement.`,
                detectedAt: new Date(),
                affectedMetrics: ['activity'],
                suggestedActions: [
                    'Simplify task assignments',
                    'Check if tasks are too difficult',
                    'Increase motivation with rewards'
                ],
                confidence: 80,
                status: 'active'
            });
        }

        console.log(`[AI] Generated ${alerts.length} alerts for ${patientName}`);
        return alerts;
    }

    // Generate AI insights
    async generateInsights(patientId: string): Promise<AIInsight[]> {
        const logs = await this.getActivityLogs(patientId, 30);
        const recentLogs = await this.getActivityLogs(patientId, 7);
        const patterns = await this.calculateBaseline(patientId);
        const insights: AIInsight[] = [];

        console.log(`[AI] Generating insights for patient ${patientId}:`, {
            totalActivities: logs.length,
            recentActivities: recentLogs.length
        });

        // Calculate various metrics
        const loginLogs = logs.filter(l => l.activityType === 'login');
        const taskLogs = logs.filter(l => l.activityType === 'task_completed');
        const recentTaskLogs = recentLogs.filter(l => l.activityType === 'task_completed');

        // 1. Activity Trend Insight
        const activityPattern = patterns.find(p => p.metric === 'activity');
        if (activityPattern) {
            if (activityPattern.trend === 'improving') {
                insights.push({
                    id: `insight_${Date.now()}_1`,
                    patientId,
                    type: 'pattern',
                    title: 'Increased Engagement 📈',
                    description: `Great progress! Your activity has increased by ${Math.round(activityPattern.deviation * 10)}% compared to your baseline. You're logging in more frequently and staying engaged.`,
                    priority: 'high',
                    confidence: activityPattern.confidence,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Keep up the excellent work!', 'Consider trying new brain games', 'Share your progress with your caregiver']
                });
            } else if (activityPattern.trend === 'declining') {
                insights.push({
                    id: `insight_${Date.now()}_1`,
                    patientId,
                    type: 'pattern',
                    title: 'Activity Declining 📉',
                    description: `We've noticed your engagement has decreased recently. This is normal - everyone has ups and downs. Let's work together to get back on track.`,
                    priority: 'high',
                    confidence: activityPattern.confidence,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Start with small, easy tasks', 'Set daily reminders', 'Talk to your caregiver about challenges']
                });
            }
        }

        // 2. Best Time for Activities (personalized)
        if (loginLogs.length >= 3) {
            const loginHours = loginLogs.map(l => l.timestamp.getHours());
            const bestHour = this.getMostCommon(loginHours);
            const loginCount = loginHours.filter(h => h === bestHour).length;

            insights.push({
                id: `insight_${Date.now()}_2`,
                patientId,
                type: 'recommendation',
                title: 'Your Peak Performance Time ⏰',
                description: `You're most active around ${bestHour}:00 (${loginCount} logins at this time). Your brain works best during this window - schedule important tasks then for maximum success!`,
                priority: 'medium',
                confidence: Math.min(95, 60 + (loginCount * 5)),
                generatedAt: new Date(),
                actionable: true,
                actions: [`Schedule challenging tasks for ${bestHour}:00`, 'Set daily reminder for peak time', 'Avoid difficult tasks during low-energy hours']
            });
        }

        // 3. Task Completion Insight (personalized)
        if (taskLogs.length >= 3) {
            const completionRate = (taskLogs.length / 30) * 100; // Rough estimate
            const recentRate = (recentTaskLogs.length / 7) * 100;

            if (recentRate > completionRate * 1.2) {
                insights.push({
                    id: `insight_${Date.now()}_3`,
                    patientId,
                    type: 'pattern',
                    title: 'Task Completion Improving! 🎯',
                    description: `Excellent! You've completed ${recentTaskLogs.length} tasks this week, up from your usual ${Math.round(taskLogs.length / 4)} per week. This shows great dedication!`,
                    priority: 'high',
                    confidence: 88,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Celebrate this achievement!', 'Try slightly harder tasks', 'Maintain this momentum']
                });
            } else if (recentRate < completionRate * 0.5 && taskLogs.length >= 5) {
                insights.push({
                    id: `insight_${Date.now()}_3`,
                    patientId,
                    type: 'recommendation',
                    title: 'Let\'s Boost Task Completion 💪',
                    description: `You've completed ${recentTaskLogs.length} tasks this week, which is lower than usual. No worries - let's make tasks easier and more enjoyable!`,
                    priority: 'medium',
                    confidence: 82,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Break tasks into smaller steps', 'Ask caregiver to simplify tasks', 'Start with your favorite activities']
                });
            }
        }

        // 4. Consistency Insight
        const uniqueDays = new Set(logs.map(l => l.timestamp.toDateString())).size;
        if (uniqueDays >= 20) {
            insights.push({
                id: `insight_${Date.now()}_4`,
                patientId,
                type: 'pattern',
                title: 'Amazing Consistency! 🌟',
                description: `You've been active on ${uniqueDays} different days this month! Consistency is key to cognitive health, and you're nailing it.`,
                priority: 'low',
                confidence: 95,
                generatedAt: new Date(),
                actionable: false
            });
        } else if (uniqueDays < 10 && logs.length >= 5) {
            insights.push({
                id: `insight_${Date.now()}_4`,
                patientId,
                type: 'recommendation',
                title: 'Build a Daily Routine 📅',
                description: `You've been active on ${uniqueDays} days this month. Building a daily routine can help! Even 5 minutes a day makes a difference.`,
                priority: 'medium',
                confidence: 85,
                generatedAt: new Date(),
                actionable: true,
                actions: ['Set a daily reminder', 'Start with just 5 minutes per day', 'Pick a consistent time']
            });
        }

        // 5. Cognitive Performance (if game data exists)
        const cognitivePattern = patterns.find(p => p.metric === 'cognitive');
        if (cognitivePattern && cognitivePattern.currentValue > 0) {
            if (cognitivePattern.trend === 'improving') {
                insights.push({
                    id: `insight_${Date.now()}_5`,
                    patientId,
                    type: 'prediction',
                    title: 'Cognitive Function Improving! 🧠',
                    description: `Your brain game scores are trending upward! This suggests your cognitive exercises are working. Keep challenging yourself!`,
                    priority: 'high',
                    confidence: cognitivePattern.confidence,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Try harder difficulty levels', 'Explore new game types', 'Share success with caregiver']
                });
            } else if (cognitivePattern.trend === 'declining') {
                insights.push({
                    id: `insight_${Date.now()}_5`,
                    patientId,
                    type: 'recommendation',
                    title: 'Let\'s Adjust Your Exercises 🎮',
                    description: `Your game scores have dipped slightly. This might mean you need different exercises or a break. Let's find what works best for you.`,
                    priority: 'medium',
                    confidence: cognitivePattern.confidence,
                    generatedAt: new Date(),
                    actionable: true,
                    actions: ['Try different game types', 'Take a short break if needed', 'Discuss with caregiver']
                });
            }
        }

        // 6. Encouragement for new users
        if (logs.length < 5) {
            insights.push({
                id: `insight_${Date.now()}_6`,
                patientId,
                type: 'recommendation',
                title: 'Welcome! Let\'s Get Started 👋',
                description: `You're just beginning your journey! Complete a few more activities so our AI can learn your patterns and provide personalized insights.`,
                priority: 'low',
                confidence: 100,
                generatedAt: new Date(),
                actionable: true,
                actions: ['Complete your first tasks', 'Try a brain game', 'Log in daily for a week']
            });
        }

        // 7. Streak Recognition
        const recentDays = Array.from(new Set(recentLogs.map(l => l.timestamp.toDateString())));
        if (recentDays.length >= 5) {
            insights.push({
                id: `insight_${Date.now()}_7`,
                patientId,
                type: 'pattern',
                title: `${recentDays.length}-Day Streak! 🔥`,
                description: `You've been active ${recentDays.length} days this week! Streaks like this build strong habits and improve cognitive health.`,
                priority: 'low',
                confidence: 100,
                generatedAt: new Date(),
                actionable: false
            });
        }

        console.log(`[AI] Generated ${insights.length} personalized insights`);
        return insights;
    }

    // Helper functions
    private groupByDay(logs: PatientActivityLog[]): Record<string, PatientActivityLog[]> {
        return logs.reduce((acc, log) => {
            const day = log.timestamp.toISOString().split('T')[0];
            if (!acc[day]) acc[day] = [];
            acc[day].push(log);
            return acc;
        }, {} as Record<string, PatientActivityLog[]>);
    }

    private calculateStdDev(values: number[], mean: number): number {
        if (values.length === 0) return 0;
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    private getMostCommon(arr: number[]): number {
        if (arr.length === 0) return 9; // Default to 9 AM
        const counts: Record<number, number> = {};
        arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
        return parseInt(Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b));
    }

    // Save anomaly alert to Firebase
    async saveAnomalyAlert(alert: Omit<AnomalyAlert, 'id'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'anomalyAlerts'), {
                ...alert,
                detectedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving anomaly alert:', error);
            throw error;
        }
    }

    // Get anomaly alerts for caregiver
    async getAnomalyAlerts(patientIds: string[]): Promise<AnomalyAlert[]> {
        try {
            if (patientIds.length === 0) return [];

            const q = query(
                collection(db, 'anomalyAlerts'),
                where('patientId', 'in', patientIds.slice(0, 10)), // Firestore limit
                where('status', '==', 'active'),
                orderBy('detectedAt', 'desc'),
                limit(20)
            );

            const snapshot = await getDocs(q);
            const alerts: AnomalyAlert[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                alerts.push({
                    id: doc.id,
                    ...data,
                    detectedAt: data.detectedAt?.toDate() || new Date(),
                    acknowledgedAt: data.acknowledgedAt?.toDate(),
                    resolvedAt: data.resolvedAt?.toDate()
                } as AnomalyAlert);
            });

            return alerts;
        } catch (error) {
            console.error('Error fetching anomaly alerts:', error);
            return [];
        }
    }

    // Generate downloadable PDF report
    async generatePDFReport(patientId: string, patientName: string): Promise<string> {
        const logs = await this.getActivityLogs(patientId, 30);
        const patterns = await this.calculateBaseline(patientId);
        const insights = await this.generateInsights(patientId);
        const alerts = await this.detectAnomalies(patientId, patientName);

        // Calculate comprehensive stats
        const loginLogs = logs.filter(l => l.activityType === 'login');
        const taskLogs = logs.filter(l => l.activityType === 'task_completed');
        const uniqueDays = new Set(logs.map(l => l.timestamp.toDateString())).size;

        // Generate HTML report
        const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Behavior Analysis Report - ${patientName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            text-align: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            display: block;
        }
        .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .pattern {
            padding: 15px;
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        .pattern.declining {
            background: #fef2f2;
            border-left-color: #ef4444;
        }
        .pattern h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
        }
        .pattern p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        .insight {
            padding: 15px;
            background: #faf5ff;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        .insight h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #7c3aed;
        }
        .insight p {
            margin: 0 0 10px 0;
            color: #4b5563;
            line-height: 1.6;
        }
        .insight ul {
            margin: 0;
            padding-left: 20px;
            color: #6b7280;
        }
        .alert {
            padding: 15px;
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        .alert h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #dc2626;
        }
        .alert p {
            margin: 0;
            color: #6b7280;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Behavior Analysis Report</h1>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Analysis Period:</strong> Last 30 days</p>
    </div>

    <div class="section">
        <h2>📊 Activity Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-value">${logs.length}</span>
                <span class="stat-label">Total Activities</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${loginLogs.length}</span>
                <span class="stat-label">Logins</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${taskLogs.length}</span>
                <span class="stat-label">Tasks Completed</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${uniqueDays}</span>
                <span class="stat-label">Active Days</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${Math.round((taskLogs.length / 30) * 100)}%</span>
                <span class="stat-label">Completion Rate</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${Math.round(logs.length / 30)}</span>
                <span class="stat-label">Avg Daily Activities</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Behavior Patterns</h2>
        ${patterns.map(pattern => `
            <div class="pattern ${pattern.trend === 'declining' ? 'declining' : ''}">
                <h3>${pattern.metric.charAt(0).toUpperCase() + pattern.metric.slice(1)} - ${pattern.trend.charAt(0).toUpperCase() + pattern.trend.slice(1)}</h3>
                <p>Current: ${Math.round(pattern.currentValue)} | Baseline: ${Math.round(pattern.baseline.average)} | Confidence: ${pattern.confidence}%</p>
            </div>
        `).join('')}
    </div>

    ${alerts.length > 0 ? `
    <div class="section">
        <h2>⚠️ Anomaly Alerts</h2>
        ${alerts.map(alert => `
            <div class="alert">
                <h3>${alert.title}</h3>
                <p>${alert.description}</p>
                <p><strong>Confidence:</strong> ${alert.confidence}%</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>💡 AI-Generated Insights</h2>
        ${insights.map(insight => `
            <div class="insight">
                <h3>${insight.title}</h3>
                <p>${insight.description}</p>
                ${insight.actions ? `
                    <strong>Recommendations:</strong>
                    <ul>
                        ${insight.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                ` : ''}
                <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                    Confidence: ${insight.confidence}% | Priority: ${insight.priority}
                </p>
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>This report was generated by CogniCare's AI-Powered Behavior Analysis System</p>
        <p>For questions or concerns, please consult with a healthcare professional</p>
    </div>
</body>
</html>
        `;

        return reportHTML;
    }
}

export const aiService = new AIAnalysisService();
