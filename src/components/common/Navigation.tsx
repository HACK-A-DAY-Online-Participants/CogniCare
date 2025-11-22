import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Brain,
    Home,
    CheckSquare,
    Gamepad2,
    Users,
    Image,
    Award,
    Calendar,
    BarChart3,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Sparkles,
    Mic
} from 'lucide-react';
import './Navigation.css';

interface NavigationProps {
    userRole: 'patient' | 'caregiver' | 'expert';
}

const Navigation: React.FC<NavigationProps> = ({ userRole }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    const patientLinks = [
        { path: '/patient', label: 'Dashboard', icon: Home },
        { path: '/patient/tasks', label: 'Tasks', icon: CheckSquare },
        { path: '/patient/ai-insights', label: 'AI Insights', icon: Sparkles },
        { path: '/patient/voice-assistant', label: 'Voice Assistant', icon: Mic },
        { path: '/patient/games', label: 'Games', icon: Gamepad2 },
        { path: '/patient/daily-challenge', label: 'Daily Challenge', icon: Calendar },
        { path: '/patient/memory-board', label: 'Memory Board', icon: Image },
        { path: '/patient/rewards', label: 'Rewards', icon: Award },
        { path: '/patient/social', label: 'Social', icon: Users }
    ];

    const caregiverLinks = [
        { path: '/caregiver', label: 'Dashboard', icon: Home },
        { path: '/caregiver/patients', label: 'My Patients', icon: Users },
        { path: '/caregiver/tasks', label: 'Tasks', icon: CheckSquare },
        { path: '/caregiver/ai-monitoring', label: 'AI Monitoring', icon: Sparkles },
        { path: '/caregiver/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/caregiver/consultation', label: 'Consultations', icon: MessageSquare },
        { path: '/caregiver/social', label: 'Community', icon: Users }
    ];

    const expertLinks = [
        { path: '/expert', label: 'Dashboard', icon: Home },
        { path: '/expert/patients', label: 'Patients', icon: Users },
        { path: '/expert/consultations', label: 'Consultations', icon: MessageSquare },
        { path: '/expert/analytics', label: 'Analytics', icon: BarChart3 }
    ];

    const links =
        userRole === 'patient'
            ? patientLinks
            : userRole === 'caregiver'
                ? caregiverLinks
                : expertLinks;

    return (
        <>
            <nav className="navigation">
                <div className="nav-container">
                    <Link to={`/${userRole}`} className="nav-brand">
                        <Brain size={32} />
                        <span>CogniCare</span>
                    </Link>

                    <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
                        <div className="nav-links">
                            {links.map((link) => {
                                const Icon = link.icon;
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`nav-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Icon size={20} />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="nav-user">
                            <div className="user-info">
                                <div className="user-avatar">
                                    {currentUser?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <p className="user-name">{currentUser?.name}</p>
                                    <p className="user-role">{userRole}</p>
                                </div>
                            </div>
                            <button className="btn-logout" onClick={handleLogout}>
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navigation;
