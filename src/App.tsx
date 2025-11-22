import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientTasks from './pages/patient/Tasks';
import PatientGames from './pages/patient/Games';
import PatientSocial from './pages/patient/Social';
import PatientMemoryBoard from './pages/patient/MemoryBoard';
import PatientRewards from './pages/patient/Rewards';
import DailyChallenge from './pages/patient/DailyChallenge';
import PatientAIInsights from './pages/patient/AIInsights';


// Caregiver Pages
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CaregiverPatients from './pages/caregiver/Patients';
import CaregiverTasks from './pages/caregiver/Tasks';
import CaregiverAnalytics from './pages/caregiver/Analytics';
import CaregiverSocial from './pages/caregiver/Social';
import CaregiverConsultation from './pages/caregiver/Consultation';
import CaregiverAIMonitoring from './pages/caregiver/AIMonitoring';

// Expert Pages
import ExpertDashboard from './pages/expert/Dashboard';
import ExpertPatients from './pages/expert/Patients';
import ExpertConsultations from './pages/expert/Consultations';
import ExpertAnalytics from './pages/expert/Analytics';
import ExpertProfile from './pages/expert/Profile';

import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={`/${currentUser.role}`} />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to={`/${currentUser.role}`} />} />
      <Route path="/role-selection" element={!currentUser ? <RoleSelection /> : <Navigate to={`/${currentUser.role}`} />} />

      {/* Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/tasks"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/games"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientGames />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/social"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientSocial />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/memory-board"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMemoryBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/rewards"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientRewards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/daily-challenge"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DailyChallenge />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/ai-insights"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAIInsights />
          </ProtectedRoute>
        }
      />

      {/* Caregiver Routes */}
      <Route
        path="/caregiver"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/patients"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverPatients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/tasks"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/analytics"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/social"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverSocial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/consultation"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverConsultation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver/ai-monitoring"
        element={
          <ProtectedRoute allowedRoles={['caregiver']}>
            <CaregiverAIMonitoring />
          </ProtectedRoute>
        }
      />

      {/* Expert Routes */}
      <Route
        path="/expert"
        element={
          <ProtectedRoute allowedRoles={['expert']}>
            <ExpertDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert/patients"
        element={
          <ProtectedRoute allowedRoles={['expert']}>
            <ExpertPatients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert/consultations"
        element={
          <ProtectedRoute allowedRoles={['expert']}>
            <ExpertConsultations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert/analytics"
        element={
          <ProtectedRoute allowedRoles={['expert']}>
            <ExpertAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert/profile"
        element={
          <ProtectedRoute allowedRoles={['expert']}>
            <ExpertProfile />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
