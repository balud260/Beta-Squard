import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GovernmentDashboard from './pages/GovernmentDashboard';
import ProblemOwnerDashboard from './pages/ProblemOwnerDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import StudentDashboard from './pages/StudentDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import FloatingAIAssistant from './components/FloatingAIAssistant';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>Loading SolveLink AI...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard/government"
            element={
              <ProtectedRoute allowedRoles={['GOVERNMENT']}>
                <GovernmentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/owner"
            element={
              <ProtectedRoute allowedRoles={['PROBLEM_OWNER', 'GOVERNMENT']}>
                <ProblemOwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/university"
            element={
              <ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN', 'FACULTY']}>
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'VOLUNTEER_COORDINATOR']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/hospital"
            element={
              <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'GOVERNMENT']}>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Persistent Floating Role-Aware AI Assistant */}
        <FloatingAIAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
}
