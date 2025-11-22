import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/common/Navigation';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { type Consultation, type ConsultationMessage } from '../../types/consultation';
import { MessageSquare, Check, X, User, Send, CheckCircle } from 'lucide-react';

const ExpertConsultations: React.FC = () => {
    const { currentUser } = useAuth();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [medicalAdvice, setMedicalAdvice] = useState('');

    const handleCompleteConsultation = async () => {
        if (!selectedConsultation || !medicalAdvice.trim()) return;

        try {
            await updateDoc(doc(db, 'consultations', selectedConsultation.id), {
                status: 'completed',
                medicalAdvice: medicalAdvice.trim(),
                completedAt: new Date(),
                updatedAt: new Date()
            });
            setShowCompleteModal(false);
            setMedicalAdvice('');
            // Optional: Refresh or let onSnapshot handle it
        } catch (error) {
            console.error('Error completing consultation:', error);
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'consultations'),
            where('expertId', '==', currentUser.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                messages: doc.data().messages?.map((m: any) => ({
                    ...m,
                    timestamp: m.timestamp?.toDate()
                })) || []
            } as Consultation));

            // Sort by date desc
            data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setConsultations(data);

            // Update selected consultation if it exists
            if (selectedConsultation) {
                const updated = data.find(c => c.id === selectedConsultation.id);
                if (updated) setSelectedConsultation(updated);
            }
        });

        return () => unsubscribe();
    }, [currentUser, selectedConsultation?.id]);

    const handleStatusUpdate = async (consultationId: string, newStatus: 'accepted' | 'rejected') => {
        try {
            await updateDoc(doc(db, 'consultations', consultationId), {
                status: newStatus,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConsultation || !currentUser || !newMessage.trim()) return;

        const message: ConsultationMessage = {
            senderId: currentUser.id,
            text: newMessage.trim(),
            timestamp: new Date()
        };

        try {
            await updateDoc(doc(db, 'consultations', selectedConsultation.id), {
                messages: arrayUnion(message),
                updatedAt: new Date()
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredConsultations = consultations.filter(c => {
        if (activeTab === 'pending') return c.status === 'pending';
        return c.status === 'accepted';
    });

    return (
        <div className="page-wrapper">
            <Navigation userRole="expert" />
            <div className="page-container">
                <div className="consultations-layout">
                    {/* Sidebar List */}
                    <div className="consultations-sidebar">
                        <div className="sidebar-header">
                            <h1>Consultations</h1>
                            <div className="tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('pending'); setSelectedConsultation(null); }}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('active'); setSelectedConsultation(null); }}
                                >
                                    Active
                                </button>
                            </div>
                        </div>

                        <div className="consultations-list">
                            {filteredConsultations.length === 0 ? (
                                <p className="empty-text">No {activeTab} consultations.</p>
                            ) : (
                                filteredConsultations.map(consult => (
                                    <div
                                        key={consult.id}
                                        className={`consult-item ${selectedConsultation?.id === consult.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedConsultation(consult)}
                                    >
                                        <div className="consult-item-header">
                                            <span className="caregiver-name">{consult.caregiverName}</span>
                                            <span className="consult-date">
                                                {consult.createdAt.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="consult-subject">{consult.subject}</p>
                                        {activeTab === 'pending' && (
                                            <div className="action-buttons-small">
                                                <button
                                                    className="btn-icon accept"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusUpdate(consult.id, 'accepted');
                                                    }}
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon reject"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusUpdate(consult.id, 'rejected');
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="consultation-detail">
                        {selectedConsultation ? (
                            <>
                                <div className="detail-header">
                                    <div className="header-info">
                                        <h2>{selectedConsultation.subject}</h2>
                                        <div className="caregiver-info">
                                            <User size={16} />
                                            <span>{selectedConsultation.caregiverName}</span>
                                        </div>
                                    </div>
                                    <div className="header-actions">
                                        {selectedConsultation.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => handleStatusUpdate(selectedConsultation.id, 'accepted')}
                                                >
                                                    <Check size={18} /> Accept Request
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleStatusUpdate(selectedConsultation.id, 'rejected')}
                                                >
                                                    <X size={18} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {selectedConsultation.status === 'accepted' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => setShowCompleteModal(true)}
                                            >
                                                <CheckCircle size={18} /> Complete Consultation
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-content">
                                    <div className="description-box">
                                        <h3>Description</h3>
                                        <p>{selectedConsultation.description}</p>
                                    </div>

                                    {(selectedConsultation.status === 'accepted' || selectedConsultation.status === 'completed') && (
                                        <div className="chat-section">
                                            <div className="messages-list">
                                                {selectedConsultation.messages?.length === 0 ? (
                                                    <p className="empty-chat">Start the conversation...</p>
                                                ) : (
                                                    selectedConsultation.messages?.map((msg, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`message ${msg.senderId === currentUser?.id ? 'sent' : 'received'}`}
                                                        >
                                                            <div className="message-bubble">
                                                                {msg.text}
                                                            </div>
                                                            <span className="message-time">
                                                                {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            {selectedConsultation.status !== 'completed' && (
                                                <form className="chat-input" onSubmit={handleSendMessage}>
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Type a message..."
                                                    />
                                                    <button type="submit" disabled={!newMessage.trim()}>
                                                        <Send size={20} />
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    {selectedConsultation.status === 'completed' && (
                                        <div className="completion-summary">
                                            <h3>Medical Advice & Conclusion</h3>
                                            <div className="advice-box">
                                                {selectedConsultation.medicalAdvice}
                                            </div>
                                            <p className="completion-date">
                                                Completed on {selectedConsultation.completedAt?.toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="empty-selection">
                                <MessageSquare size={48} />
                                <p>Select a consultation to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Complete Consultation Modal */}
            {showCompleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Complete Consultation</h2>
                        <p>Please provide your final medical advice or conclusion for this consultation.</p>
                        <textarea
                            className="advice-input"
                            rows={6}
                            value={medicalAdvice}
                            onChange={(e) => setMedicalAdvice(e.target.value)}
                            placeholder="Enter medical advice, recommendations, or next steps..."
                        />
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCompleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCompleteConsultation}
                                disabled={!medicalAdvice.trim()}
                            >
                                Submit & Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .consultations-layout {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 1.5rem;
                    height: calc(100vh - 140px);
                }
                .consultations-sidebar {
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                }
                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .sidebar-header h1 {
                    font-size: 1.5rem;
                    margin: 0 0 1rem 0;
                }
                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    background: #f3f4f6;
                    padding: 0.25rem;
                    border-radius: 8px;
                }
                .tab-btn {
                    flex: 1;
                    padding: 0.5rem;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #6b7280;
                }
                .tab-btn.active {
                    background: white;
                    color: #111827;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .consultations-list {
                    flex: 1;
                    overflow-y: auto;
                }
                .consult-item {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .consult-item:hover {
                    background: #f9fafb;
                }
                .consult-item.selected {
                    background: #eff6ff;
                    border-left: 3px solid #3b82f6;
                }
                .consult-item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.25rem;
                }
                .caregiver-name {
                    font-weight: 600;
                    color: #374151;
                }
                .consult-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .consult-subject {
                    margin: 0;
                    font-size: 0.875rem;
                    color: #6b7280;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .action-buttons-small {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .btn-icon {
                    padding: 0.25rem;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-icon.accept { background: #d1fae5; color: #065f46; }
                .btn-icon.reject { background: #fee2e2; color: #991b1b; }

                .consultation-detail {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .detail-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .header-info h2 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.25rem;
                }
                .caregiver-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }
                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .btn-success {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .btn-danger {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .detail-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .description-box {
                    padding: 1.5rem;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .description-box h3 {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin: 0 0 0.5rem 0;
                }
                .description-box p {
                    margin: 0;
                    color: #374151;
                    line-height: 1.5;
                }

                .chat-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .messages-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .message {
                    display: flex;
                    flex-direction: column;
                    max-width: 70%;
                }
                .message.sent {
                    align-self: flex-end;
                    align-items: flex-end;
                }
                .message.received {
                    align-self: flex-start;
                }
                .message-bubble {
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                .message.sent .message-bubble {
                    background: #3b82f6;
                    color: white;
                    border-bottom-right-radius: 2px;
                }
                .message.received .message-bubble {
                    background: #f3f4f6;
                    color: #1f2937;
                    border-bottom-left-radius: 2px;
                }
                .message-time {
                    font-size: 0.7rem;
                    color: #9ca3af;
                    margin-top: 0.25rem;
                }
                .chat-input {
                    padding: 1rem;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 0.5rem;
                }
                .chat-input input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 24px;
                    outline: none;
                }
                .chat-input input:focus {
                    border-color: #3b82f6;
                }
                .chat-input button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .chat-input button:disabled {
                    background: #d1d5db;
                    cursor: not-allowed;
                }

                .empty-selection {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                }
                .empty-selection p {
                    margin-top: 1rem;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                }
                .advice-input {
                    width: 100%;
                    padding: 1rem;
                    margin: 1rem 0;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    resize: vertical;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .completion-summary {
                    padding: 1.5rem;
                    background: #f0fdf4;
                    border-top: 1px solid #e5e7eb;
                }
                .advice-box {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                    margin-top: 0.5rem;
                    white-space: pre-wrap;
                }
                .completion-date {
                    font-size: 0.75rem;
                    color: #166534;
                    margin-top: 0.5rem;
                    text-align: right;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                }

                @media (max-width: 768px) {
                    .consultations-layout {
                        grid-template-columns: 1fr;
                    }
                    .consultations-sidebar {
                        display: ${selectedConsultation ? 'none' : 'flex'};
                    }
                    .consultation-detail {
                        display: ${selectedConsultation ? 'flex' : 'none'};
                    }
                }
            `}</style>
        </div>
    );
};

export default ExpertConsultations;
