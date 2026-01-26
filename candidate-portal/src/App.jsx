import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoursePlayer from './pages/CoursePlayer';
import CourseSalesPage from './pages/CourseSalesPage';
import ExamInterface from './pages/ExamInterface';
import Certificates from './pages/Certificates';
import Layout from './components/Layout';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'candidate') {
    return <div>Unauthorized. Please log in as a candidate.</div>;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:courseId" element={<CoursePlayer />} />
            <Route path="/course/:courseId/details" element={<CourseSalesPage />} />
            <Route path="/exam/:courseId/:moduleId" element={<ExamInterface />} />
            <Route path="/certificates" element={<Certificates />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
