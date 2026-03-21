import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Module Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CreateCourse from './pages/CreateCourse';
import CourseDetails from './pages/CourseDetails';
import ModuleEditor from './pages/ModuleEditor';
import Register from './pages/Register';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading...</div>;
  if (!user) return <Navigate to="/tutor/login" replace />;
  if (user.role !== 'mentor') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Unauthorized</h2>
        <p>This portal is for mentors only.</p>
      </div>
    );
  }
  return children;
}

export default function TutorModule() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="course/:courseId" element={<CourseDetails />} />
          <Route path="course/:courseId/module/:moduleId" element={<ModuleEditor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
