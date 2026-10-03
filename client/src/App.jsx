import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Guards
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

// Layout
import { AppLayout } from './layouts/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { LabListPage } from './pages/student/LabListPage';
import { LabDetailPage } from './pages/student/LabDetailPage';
import { MyBookingsPage } from './pages/student/MyBookingsPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { ProjectsPage } from './pages/student/ProjectsPage';
import { CreateProjectPage } from './pages/student/CreateProjectPage';
import { ProjectDetailPage } from './pages/student/ProjectDetailPage';
import { FindPeersPage } from './pages/student/FindPeersPage';
import { CollaborationsPage } from './pages/student/CollaborationsPage';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultySchedulesPage } from './pages/faculty/FacultySchedulesPage';
import { FacultyStudentsPage } from './pages/faculty/FacultyStudentsPage';
import { FacultyRequestsPage } from './pages/faculty/FacultyRequestsPage';
import { FacultyReportsPage } from './pages/faculty/FacultyReportsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminLabsPage } from './pages/admin/AdminLabsPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Helper Root Redirector
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.userType === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.userType === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['student', 'admin', 'faculty']}>
                    <AppLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="labs" element={<LabListPage />} />
              <Route path="labs/:labId" element={<LabDetailPage />} />
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<CreateProjectPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="peers" element={<FindPeersPage />} />
              <Route path="collaborations" element={<CollaborationsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Faculty Protected Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['faculty', 'admin']}>
                    <AppLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="labs" element={<LabListPage />} />
              <Route path="schedules" element={<FacultySchedulesPage />} />
              <Route path="students" element={<FacultyStudentsPage />} />
              <Route path="requests" element={<FacultyRequestsPage />} />
              <Route path="reports" element={<FacultyReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <AppLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="labs" element={<AdminLabsPage />} />
              <Route path="departments" element={<AdminDepartmentsPage />} />
              <Route path="labs/new" element={<AdminLabsPage />} />
              <Route path="labs/:id" element={<AdminLabsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
