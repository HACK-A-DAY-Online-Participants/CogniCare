// AI behavior analysis types

export interface BehaviorPattern {
    patientId: string;
    metric: 'activity' | 'mood' | 'cognitive' | 'social' | 'sleep' | 'medication';
    baseline: {
        average: number;
        standardDeviation: number;
        timeOfDay: string;
        dayOfWeek: number;
    };
    currentValue: number;
    deviation: number; // How far from baseline
    trend: 'improving' | 'stable' | 'declining';
    confidence: number; // 0-100%
    lastUpdated: Date;
}

export interface AnomalyAlert {
    id: string;
    patientId: string;
    patientName: string;
    type: 'warning' | 'concern' | 'critical';
    title: string;
    description: string;
    detectedAt: Date;
    affectedMetrics: string[];
    suggestedActions: string[];
    confidence: number;
    status: 'active' | 'acknowledged' | 'resolved';
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    notes?: string;
}

export interface PatientActivityLog {
    id: string;
    patientId: string;
    activityType: 'login' | 'task_completed' | 'game_played' | 'medication_taken' | 'voice_journal' | 'mood_entry';
    timestamp: Date;
    metadata: {
        duration?: number;
        score?: number;
        taskId?: string;
        gameId?: string;
        medicationId?: string;
    };
    deviceInfo?: {
        type: string;
        browser: string;
    };
}

export interface AIInsight {
    id: string;
    patientId: string;
    type: 'pattern' | 'prediction' | 'recommendation';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
    generatedAt: Date;
    expiresAt?: Date;
    actionable: boolean;
    actions?: string[];
}
