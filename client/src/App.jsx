import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import BlogDetailPage from './pages/BlogDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BlogEditorPage from './pages/BlogEditorPage';
import AdminModerationPage from './pages/AdminModerationPage';
import CreateBlogPage from './pages/CreateBlogPage';
import MyStoriesPage from './pages/MyStoriesPage';
import SavedBlogsPage from './pages/SavedBlogsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route wrapper for authenticated readers and admins
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p className="text-muted">Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected route wrapper for Admin-only areas
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p className="text-muted">Verifying administrative access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <Router>
          <div className="page-wrapper">
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Catalog & Reading Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/blog/:id" element={<BlogDetailPage />} />

                {/* Reader Story Creation & Dashboard Routes */}
                <Route
                  path="/create-blog"
                  element={
                    <ProtectedRoute>
                      <CreateBlogPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/new-story" element={<Navigate to="/create-blog" replace />} />
                <Route
                  path="/my-stories"
                  element={
                    <ProtectedRoute>
                      <MyStoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute>
                      <SavedBlogsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Admin Studio Routes */}
                <Route
                  path="/admin/blogs"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/blogs/new"
                  element={
                    <AdminRoute>
                      <BlogEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/blogs/:id/edit"
                  element={
                    <AdminRoute>
                      <BlogEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/comments"
                  element={
                    <AdminRoute>
                      <AdminModerationPage />
                    </AdminRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
