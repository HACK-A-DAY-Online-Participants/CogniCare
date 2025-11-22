import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Navigation from '../../components/common/Navigation';
import { type ExpertUser, isExpertUser } from '../../types/user';
import { CheckCircle, AlertCircle, Save, Award, BookOpen } from 'lucide-react';

const ExpertProfile: React.FC = () => {
    const { currentUser } = useAuth();
    const [specialization, setSpecialization] = useState('');
    const [credentials, setCredentials] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [profile, setProfile] = useState<ExpertUser | null>(null);

    useEffect(() => {
        if (currentUser && isExpertUser(currentUser)) {
            setProfile(currentUser);
            setSpecialization(currentUser.specialization?.join(', ') || '');
            setCredentials(currentUser.credentials?.join(', ') || '');
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser || !profile) return;

        setLoading(true);
        setMessage(null);

        try {
            const specs = specialization.split(',').map(s => s.trim()).filter(s => s);
            const creds = credentials.split(',').map(c => c.trim()).filter(c => c);

            const userRef = doc(db, 'users', currentUser.id);
            await updateDoc(userRef, {
                specialization: specs,
                credentials: creds,
                verified: true // Auto-verify for hackathon purposes
            });

            // Update local state
            setProfile({
                ...profile,
                specialization: specs,
                credentials: creds,
                verified: true
            });

            setMessage({ type: 'success', text: 'Profile updated and verified successfully!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser || !isExpertUser(currentUser)) return <div>Access Denied</div>;

    return (
        <div className="page-wrapper">
            <Navigation userRole="expert" />
            <div className="page-container">
                <div className="profile-header">
                    <h1>Expert Profile</h1>
                    {profile?.verified ? (
                        <span className="badge badge-success">
                            <CheckCircle size={16} /> Verified Expert
                        </span>
                    ) : (
                        <span className="badge badge-warning">
                            <AlertCircle size={16} /> Verification Pending
                        </span>
                    )}
                </div>

                <div className="card profile-form-card">
                    <div className="form-section">
                        <h2><BookOpen size={20} /> Specialization</h2>
                        <p className="helper-text">Enter your areas of expertise, separated by commas (e.g., Neurology, Geriatrics, Psychology)</p>
                        <input
                            type="text"
                            className="form-input"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            placeholder="e.g. Neurology, Geriatrics"
                        />
                    </div>

                    <div className="form-section">
                        <h2><Award size={20} /> Credentials</h2>
                        <p className="helper-text">Enter your degrees and certifications, separated by commas (e.g., MD, PhD, Board Certified)</p>
                        <input
                            type="text"
                            className="form-input"
                            value={credentials}
                            onChange={(e) => setCredentials(e.target.value)}
                            placeholder="e.g. MD, PhD"
                        />
                    </div>

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        className="btn btn-primary save-btn"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} /> Save & Verify Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .badge-success {
                    background-color: #d1fae5;
                    color: #065f46;
                }
                .badge-warning {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                .profile-form-card {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }
                .form-section {
                    margin-bottom: 2rem;
                }
                .form-section h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.25rem;
                    margin-bottom: 0.5rem;
                    color: #1f2937;
                }
                .helper-text {
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }
                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                .form-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                .save-btn {
                    width: 100%;
                    justify-content: center;
                    margin-top: 1rem;
                }
                .message {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-weight: 500;
                }
                .message.success {
                    background-color: #d1fae5;
                    color: #065f46;
                }
                .message.error {
                    background-color: #fee2e2;
                    color: #991b1b;
                }
            `}</style>
        </div>
    );
};

export default ExpertProfile;
