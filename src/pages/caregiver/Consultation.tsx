import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/common/Navigation';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { type ExpertUser } from '../../types/user';
import { type Consultation, type ConsultationMessage } from '../../types/consultation';
import { User, Award, X, Send, MessageSquare, FileText } from 'lucide-react';

const ConsultationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [experts, setExperts] = useState<ExpertUser[]>([]);
    const [myConsultations, setMyConsultations] = useState<Consultation[]>([]);
    const [selectedExpert, setSelectedExpert] = useState<ExpertUser | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        loadExperts();
        if (currentUser) {
            const unsubscribe = loadMyConsultations();
            return () => unsubscribe();
        }
    }, [currentUser]);

    const loadExperts = async () => {
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'expert'));
            const snapshot = await getDocs(q);
            const expertsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ExpertUser));
            setExperts(expertsData);
        } catch (error) {
            console.error('Error loading experts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMyConsultations = () => {
        if (!currentUser) return () => { };

        const q = query(
            collection(db, 'consultations'),
            where('caregiverId', '==', currentUser.id),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const consultations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                messages: doc.data().messages?.map((m: any) => ({
                    ...m,
                    timestamp: m.timestamp?.toDate()
                })) || []
            } as Consultation));
            setMyConsultations(consultations);

            // Update selected consultation for chat if open
            if (selectedConsultation) {
                const updated = consultations.find(c => c.id === selectedConsultation.id);
                if (updated) setSelectedConsultation(updated);
            }
        });
    };

    const handleRequestConsultation = (expert: ExpertUser) => {
        setSelectedExpert(expert);
        setShowRequestModal(true);
    };

    const handleOpenChat = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setShowChatModal(true);
    };

    const handleViewAdvice = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setShowAdviceModal(true);
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedExpert) return;

        setSubmitting(true);
        try {
            const newConsultation: Omit<Consultation, 'id'> = {
                caregiverId: currentUser.id,
                caregiverName: currentUser.name,
                expertId: selectedExpert.id,
                expertName: selectedExpert.name,
                status: 'pending',
                subject,
                description,
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await addDoc(collection(db, 'consultations'), newConsultation);

            setShowRequestModal(false);
            setSubject('');
            setDescription('');
            alert('Consultation request sent successfully!');
        } catch (error) {
            console.error('Error sending request:', error);
            alert('Failed to send request. Please try again.');
        } finally {
            setSubmitting(false);
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

    return (
        <div className="page-wrapper">
            <Navigation userRole="caregiver" />
            <div className="page-container">
                <div className="header-section">
                    <h1>Expert Consultations</h1>
                    <p>Connect with medical experts for advice and guidance</p>
                </div>

                <div className="content-grid">
                    {/* Left Column: Experts List */}
                    <div className="experts-section">
                        <h2>Available Experts</h2>
                        {loading ? (
                            <p>Loading experts...</p>
                        ) : experts.length === 0 ? (
                            <p>No experts found.</p>
                        ) : (
                            <div className="experts-grid">
                                {experts.map(expert => (
                                    <div key={expert.id} className="expert-card">
                                        <div className="expert-header">
                                            <div className="expert-avatar">
                                                {expert.photoURL ? (
                                                    <img src={expert.photoURL} alt={expert.name} />
                                                ) : (
                                                    <User size={24} />
                                                )}
                                            </div>
                                            <div className="expert-info">
                                                <h3>Dr. {expert.name}</h3>
                                                <div className="expert-badges">
                                                    {expert.verified && (
                                                        <span className="badge verified">
                                                            <Award size={12} /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="expert-details">
                                            <p><strong>Specialization:</strong> {expert.specialization?.join(', ') || 'General'}</p>
                                            <p><strong>Credentials:</strong> {expert.credentials?.join(', ') || 'N/A'}</p>
                                        </div>

                                        <button
                                            className="btn btn-primary request-btn"
                                            onClick={() => handleRequestConsultation(expert)}
                                        >
                                            Request Consultation
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: My Consultations */}
                    <div className="history-section">
                        <h2>My Consultations</h2>
                        <div className="consultations-list">
                            {myConsultations.length === 0 ? (
                                <p className="empty-text">No consultations yet.</p>
                            ) : (
                                myConsultations.map(consult => (
                                    <div key={consult.id} className={`consultation-item ${consult.status}`}>
                                        <div className="consult-header">
                                            <span className="consult-expert">Dr. {consult.expertName}</span>
                                            <span className={`status-badge ${consult.status}`}>{consult.status}</span>
                                        </div>
                                        <h4 className="consult-subject">{consult.subject}</h4>
                                        <div className="consult-footer">
                                            <p className="consult-date">
                                                {consult.createdAt?.toLocaleDateString()}
                                            </p>
                                            <div className="action-buttons">
                                                {(consult.status === 'accepted' || consult.status === 'completed') && (
                                                    <button
                                                        className="btn-chat-small"
                                                        onClick={() => handleOpenChat(consult)}
                                                    >
                                                        <MessageSquare size={14} /> Chat
                                                    </button>
                                                )}
                                                {consult.status === 'completed' && (
                                                    <button
                                                        className="btn-advice-small"
                                                        onClick={() => handleViewAdvice(consult)}
                                                    >
                                                        <FileText size={14} /> View Advice
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && selectedExpert && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Consult with Dr. {selectedExpert.name}</h2>
                            <button className="close-btn" onClick={() => setShowRequestModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitRequest}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief topic of consultation"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your concern or question in detail..."
                                    rows={5}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Sending...' : (
                                        <>
                                            <Send size={16} /> Send Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {showChatModal && selectedConsultation && (
                <div className="modal-overlay">
                    <div className="modal-content chat-modal">
                        <div className="modal-header">
                            <h2>Chat with Dr. {selectedConsultation.expertName}</h2>
                            <button className="close-btn" onClick={() => setShowChatModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="chat-messages">
                            {selectedConsultation.messages?.length === 0 ? (
                                <p className="empty-chat">No messages yet. Start the conversation!</p>
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
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
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
                </div>
            )}

            {/* Advice Modal */}
            {showAdviceModal && selectedConsultation && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Medical Advice & Conclusion</h2>
                            <button className="close-btn" onClick={() => setShowAdviceModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="advice-content">
                            <div className="consult-summary">
                                <p><strong>Subject:</strong> {selectedConsultation.subject}</p>
                                <p><strong>Expert:</strong> Dr. {selectedConsultation.expertName}</p>
                                <p><strong>Date Completed:</strong> {selectedConsultation.completedAt?.toLocaleDateString()}</p>
                            </div>
                            <div className="advice-body">
                                <h3>Expert's Advice:</h3>
                                <div className="advice-text">
                                    {selectedConsultation.medicalAdvice}
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setShowAdviceModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .header-section { margin-bottom: 2rem; }
                .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
                .experts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .expert-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s; }
                .expert-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .expert-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
                .expert-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .expert-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .expert-info h3 { margin: 0; font-size: 1.1rem; color: #111827; }
                .badge { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 10px; background: #d1fae5; color: #065f46; margin-top: 0.25rem; }
                .expert-details { font-size: 0.875rem; color: #4b5563; margin-bottom: 1.5rem; }
                .expert-details p { margin: 0.25rem 0; }
                .request-btn { width: 100%; justify-content: center; }
                
                .history-section { background: white; padding: 1.5rem; border-radius: 12px; height: fit-content; }
                .consultations-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
                .consultation-item { padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
                .consult-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
                .consult-expert { font-weight: 600; font-size: 0.875rem; }
                .status-badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 10px; text-transform: capitalize; }
                .status-badge.pending { background: #fef3c7; color: #92400e; }
                .status-badge.accepted { background: #d1fae5; color: #065f46; }
                .status-badge.rejected { background: #fee2e2; color: #991b1b; }
                .status-badge.completed { background: #dcfce7; color: #166534; }
                .consult-subject { margin: 0; font-size: 0.9rem; color: #1f2937; }
                .consult-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
                .consult-date { font-size: 0.75rem; color: #9ca3af; margin: 0; }
                .action-buttons { display: flex; gap: 0.5rem; }
                .btn-chat-small { background: #3b82f6; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
                .btn-advice-small { background: #10b981; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }

                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
                .chat-modal { height: 600px; display: flex; flex-direction: column; padding: 0; }
                .chat-modal .modal-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; margin: 0; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .close-btn { background: none; border: none; cursor: pointer; color: #6b7280; }
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
                .form-group input, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
                .btn-secondary { background: #f3f4f6; color: #374151; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
                .btn-primary { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

                /* Chat Styles */
                .chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; background: #f9fafb; }
                .message { display: flex; flex-direction: column; max-width: 70%; }
                .message.sent { align-self: flex-end; align-items: flex-end; }
                .message.received { align-self: flex-start; }
                .message-bubble { padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; }
                .message.sent .message-bubble { background: #3b82f6; color: white; border-bottom-right-radius: 2px; }
                .message.received .message-bubble { background: white; color: #1f2937; border: 1px solid #e5e7eb; border-bottom-left-radius: 2px; }
                .message-time { font-size: 0.7rem; color: #9ca3af; margin-top: 0.25rem; }
                .chat-input-form { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; background: white; }
                .chat-input-form input { flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 24px; outline: none; }
                .chat-input-form input:focus { border-color: #3b82f6; }
                .chat-input-form button { background: #3b82f6; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .chat-input-form button:disabled { background: #d1d5db; cursor: not-allowed; }
                .empty-chat { text-align: center; color: #9ca3af; margin-top: 2rem; }

                /* Advice Styles */
                .advice-content { padding: 0.5rem 0; }
                .consult-summary { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; color: #4b5563; }
                .consult-summary p { margin: 0.25rem 0; }
                .advice-body h3 { font-size: 1rem; color: #111827; margin-bottom: 0.5rem; }
                .advice-text { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; color: #166534; white-space: pre-wrap; line-height: 1.6; }

                @media (max-width: 768px) {
                    .content-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default ConsultationPage;
