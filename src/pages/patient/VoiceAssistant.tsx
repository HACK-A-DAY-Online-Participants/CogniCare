import React from 'react';
import Navigation from '../../components/common/Navigation';
import VoiceAgent from '../../components/common/VoiceAgent';
import { Mic } from 'lucide-react';

const VoiceAssistant: React.FC = () => {
    return (
        <div className="page-wrapper">
            <Navigation userRole="patient" />

            <div className="page-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="page-title">Voice Assistant</h1>
                        <p className="page-subtitle">I'm here to help you with anything you need.</p>
                    </div>
                </header>

                <div className="content-section card" style={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <Mic size={64} className="text-indigo-600" />
                    </div>

                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>How can I help you today?</h2>
                        <p className="text-gray-600" style={{ maxWidth: '400px', margin: '0 auto' }}>
                            Tap the microphone button below to start speaking. You can ask me about your tasks, games, or just chat.
                        </p>
                    </div>

                    <div style={{ transform: 'scale(1.5)' }}>
                        <VoiceAgent />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
