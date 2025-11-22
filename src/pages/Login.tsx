import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import type { UserRole } from '../types';
import './Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const { login, signInWithGoogle } = useAuth();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            // Navigation will be handled by the ProtectedRoute
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email. Please sign up.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Network error. Please check your connection or disable ad blockers.');
            } else {
                setError(err.message || 'Failed to login. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async (role: UserRole) => {
        setError('');
        setLoading(true);
        setShowRoleModal(false);

        try {
            await signInWithGoogle(role);
            // Navigation will be handled by the ProtectedRoute
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="login-content">
                <div className="login-card glass-card">
                    <div className="login-header">
                        <div className="logo-container">
                            <Brain className="logo-icon" size={48} />
                            <Sparkles className="sparkle-icon" size={24} />
                        </div>
                        <h1 className="login-title gradient-text">CogniCare</h1>
                        <p className="login-subtitle">Empowering minds, connecting hearts</p>
                    </div>

                    {error && (
                        <div className="error-message animate-fade-in">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <Mail size={18} />
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <Lock size={18} />
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner"></span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-google"
                        onClick={() => setShowRoleModal(true)}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="login-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/signup" className="link-primary">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Role Selection Modal */}
                {showRoleModal && (
                    <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                        <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
                            <h2>Select Your Role</h2>
                            <p className="modal-subtitle">Choose how you'll be using CogniCare</p>
                            <div className="role-buttons">
                                <button
                                    className="role-button"
                                    onClick={() => handleGoogleSignIn('patient')}
                                    disabled={loading}
                                >
                                    <Brain size={32} />
                                    <h3>Patient</h3>
                                    <p>Track tasks and play games</p>
                                </button>
                                <button
                                    className="role-button"
                                    onClick={() => handleGoogleSignIn('caregiver')}
                                    disabled={loading}
                                >
                                    <Brain size={32} />
                                    <h3>Caregiver</h3>
                                    <p>Monitor and provide care</p>
                                </button>
                                <button
                                    className="role-button"
                                    onClick={() => handleGoogleSignIn('expert')}
                                    disabled={loading}
                                >
                                    <Brain size={32} />
                                    <h3>Expert</h3>
                                    <p>Offer professional guidance</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card glass-card animate-fade-in">
                        <div className="feature-icon patient-gradient">
                            <Brain size={32} />
                        </div>
                        <h3>For Patients</h3>
                        <p>Track tasks, play games, and connect with others</p>
                    </div>

                    <div className="feature-card glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="feature-icon caregiver-gradient">
                            <Brain size={32} />
                        </div>
                        <h3>For Caregivers</h3>
                        <p>Monitor progress and provide personalized care</p>
                    </div>

                    <div className="feature-card glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="feature-icon expert-gradient">
                            <Brain size={32} />
                        </div>
                        <h3>For Experts</h3>
                        <p>Review analytics and offer professional guidance</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
