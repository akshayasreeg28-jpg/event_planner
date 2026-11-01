import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PublicRSVPPage } from './pages/PublicRSVPPage';
import { ShareableSummaryPage } from './pages/ShareableSummaryPage';

// Private Workspace Pages
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEventWizardPage } from './pages/CreateEventWizardPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { EventWorkspacePage } from './pages/EventWorkspacePage';
import { IdeasStudioPage } from './pages/IdeasStudioPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/rsvp/:token" element={<PublicRSVPPage />} />
            <Route path="/share/:eventId" element={<ShareableSummaryPage />} />

            {/* Private Workspace Layout (Protected) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/wizard" element={<CreateEventWizardPage />} />
              <Route path="/events" element={<MyEventsPage />} />
              <Route path="/events/:eventId" element={<EventWorkspacePage />} />
              <Route path="/ideas" element={<IdeasStudioPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
