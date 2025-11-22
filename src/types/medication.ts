// Medication types for the medication tracking feature

export interface Medication {
    id: string;
    patientId: string;
    name: string;
    dosage: string;
    pillAppearance: {
        shape: string;
        color: string;
        imprint: string;
        size: string;
    };
    schedule: {
        times: string[]; // ["08:00", "20:00"]
        frequency: 'daily' | 'twice-daily' | 'weekly' | 'as-needed';
        withFood: boolean;
    };
    prescription: {
        prescribedBy: string;
        startDate: Date;
        endDate?: Date;
        refillDate: Date;
        pillCount: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MedicationLog {
    id: string;
    medicationId: string;
    medicationName: string;
    patientId: string;
    scheduledTime: Date;
    takenTime?: Date;
    status: 'taken' | 'missed' | 'pending' | 'late';
    verification?: {
        photoUrl: string;
        aiVerified: boolean;
        confidence: number;
        pillsDetected: number;
        correctPills: boolean;
        flags: string[];
    };
    remindersSent: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AdherenceStats {
    patientId: string;
    period: 'week' | 'month';
    adherenceRate: number;
    onTimeDoses: number;
    lateDoses: number;
    missedDoses: number;
    currentStreak: number;
    longestStreak: number;
    totalDoses: number;
}
