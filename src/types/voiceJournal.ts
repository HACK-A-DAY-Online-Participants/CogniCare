// Voice journal types for sentiment analysis feature

export interface VoiceJournal {
    id: string;
    patientId: string;
    audioUrl: string;
    duration: number; // Seconds
    timestamp: Date;
    transcription: string;
    analysis: {
        sentiment: {
            overall: 'positive' | 'neutral' | 'negative';
            emotions: {
                happiness: number; // 0-100
                sadness: number;
                anxiety: number;
                anger: number;
                confusion: number;
            };
        };
        speech: {
            clarity: number; // 0-100
            pace: number; // Words per minute
            pauses: number;
            repetitions: number;
            wordFindingDifficulties: number;
        };
        cognitive: {
            vocabularyDiversity: number;
            sentenceComplexity: number;
            coherence: number; // 0-100
            memoryReferences: string[];
        };
    };
    flags: {
        concerningPatterns: string[];
        positiveIndicators: string[];
    };
    sharedWithCaregiver: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface VoiceAnalysisReport {
    patientId: string;
    period: 'week' | 'month';
    startDate: Date;
    endDate: Date;
    trends: {
        emotionalState: 'improving' | 'stable' | 'declining';
        speechClarity: 'improving' | 'stable' | 'declining';
        cognitiveFunction: 'improving' | 'stable' | 'declining';
    };
    averages: {
        sentiment: number;
        clarity: number;
        pace: number;
        coherence: number;
    };
    alerts: string[];
    recommendations: string[];
    entriesCount: number;
}
