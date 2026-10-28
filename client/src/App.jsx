import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { api } from './services/api.js';

import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { TaskFormModal } from './components/TaskFormModal.jsx';
import { HabitFormModal } from './components/HabitFormModal.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { TermsPage } from './pages/TermsPage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

import { DashboardPage } from './pages/DashboardPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { HabitsPage } from './pages/HabitsPage.jsx';
import { PlannerPage } from './pages/PlannerPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import { CategoriesPage } from './pages/CategoriesPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: 'var(--text-muted)',
        }}
      >
        Loading your Looply session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
}

function AuthenticatedAppLayout() {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const handleCreateTask = async (data) => {
    try {
      await api.createTask(data);
      success('Task created successfully');
      // Trigger a page refresh/update via window custom event if on tasks page
      window.dispatchEvent(new CustomEvent('looply:refresh'));
    } catch (err) {
      toastError(err.message || 'Failed to create task');
      throw err;
    }
  };

  const handleCreateHabit = async (data) => {
    try {
      await api.createHabit(data);
      success('Habit created successfully');
      window.dispatchEvent(new CustomEvent('looply:refresh'));
    } catch (err) {
      toastError(err.message || 'Failed to create habit');
      throw err;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        onNewTask={() => setTaskModalOpen(true)}
        onNewHabit={() => setHabitModalOpen(true)}
      />
      <main className="app-main">
        <Outlet />
      </main>

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleCreateTask}
      />

      <HabitFormModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSave={handleCreateHabit}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicOnlyRoute>
                      <SignupPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Authenticated Application */}
                <Route path="/app" element={<ProtectedRoute />}>
                  <Route element={<AuthenticatedAppLayout />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="habits" element={<HabitsPage />} />
                    <Route path="planner" element={<PlannerPage />} />
                    <Route path="insights" element={<InsightsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Route>
                </Route>

                {/* Custom 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
