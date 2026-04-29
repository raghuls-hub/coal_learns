import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CreateCourse from './pages/CreateCourse';
import CourseDetails from './pages/CourseDetails';
import ModuleEditor from './pages/ModuleEditor';
import Settings from './pages/Settings';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)', fontSize: 16 }}>Loading…</div>;
  if (!user) return <Navigate to="/tutor/login" replace />;
  if (user.role !== 'mentor') return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Unauthorized — Mentor access only.</div>;
  return children;
}

export default function TutorModule() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<Protected><Layout /></Protected>}>
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
