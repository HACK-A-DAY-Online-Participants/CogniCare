export interface ConsultationMessage {
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Consultation {
    id: string;
    caregiverId: string;
    caregiverName: string;
    expertId: string;
    expertName: string;
    patientId?: string; // Optional: if discussing a specific patient
    patientName?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    subject: string;
    description: string;
    messages: ConsultationMessage[];
    createdAt: Date;
    updatedAt: Date;
    medicalAdvice?: string;
    completedAt?: Date;
}
