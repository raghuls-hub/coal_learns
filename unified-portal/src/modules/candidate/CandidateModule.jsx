import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseCatalog from './pages/CourseCatalog';
import CoursePreview from './pages/CoursePreview';
import MyLearning from './pages/MyLearning';
import LearningInterface from './pages/LearningInterface';
import MyCertificates from './pages/MyCertificates';
import CertificateVerify from './pages/CertificateVerify';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>Loading…</div>;
  return isAuthenticated ? children : <Navigate to="/candidate/login" replace />;
}

function WithNav({ children }) {
  return <><Navigation />{children}</>;
}

export default function CandidateModule() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="/" element={<Navigate to="catalog" replace />} />
        <Route path="catalog" element={<WithNav><CourseCatalog /></WithNav>} />
        <Route path="course/:courseId" element={<WithNav><CoursePreview /></WithNav>} />
        <Route path="my-learning" element={<Protected><WithNav><MyLearning /></WithNav></Protected>} />
        <Route path="my-certificates" element={<Protected><WithNav><MyCertificates /></WithNav></Protected>} />
        <Route path="learning/:enrollmentId" element={<Protected><LearningInterface /></Protected>} />
        <Route path="verify/:certificateId" element={<CertificateVerify />} />
      </Routes>
    </AuthProvider>
  );
}
