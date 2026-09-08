import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotificationDrawer from './components/NotificationDrawer';

// 12 Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkerProfilesPage from './pages/WorkerProfilesPage';
import SkillMatrixPage from './pages/SkillMatrixPage';
import AssignmentComparisonPage from './pages/AssignmentComparisonPage';
import SkillIntelligencePage from './pages/SkillIntelligencePage';
import FairnessReviewPage from './pages/FairnessReviewPage';
import LearningMobilityPage from './pages/LearningMobilityPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserRoleManagementPage from './pages/UserRoleManagementPage';
import AuditSettingsPage from './pages/AuditSettingsPage';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Authenticating with EduStaff IQ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <NotificationDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Navigate to="/dashboard" replace />
                </ProtectedLayout>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/workers"
              element={
                <ProtectedLayout>
                  <WorkerProfilesPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/skill-matrix"
              element={
                <ProtectedLayout>
                  <SkillMatrixPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/assignment-comparison"
              element={
                <ProtectedLayout>
                  <AssignmentComparisonPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/skill-intelligence"
              element={
                <ProtectedLayout>
                  <SkillIntelligencePage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/fairness-review"
              element={
                <ProtectedLayout>
                  <FairnessReviewPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/learning-mobility"
              element={
                <ProtectedLayout>
                  <LearningMobilityPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <ReportsPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedLayout>
                  <NotificationsPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/users-roles"
              element={
                <ProtectedLayout>
                  <UserRoleManagementPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/audit-settings"
              element={
                <ProtectedLayout>
                  <AuditSettingsPage />
                </ProtectedLayout>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
