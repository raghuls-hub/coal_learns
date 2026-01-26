import { BrowserRouter as Router, Routes, Route,Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import CourseCatalog from './pages/CourseCatalog';
import CoursePreview from './pages/CoursePreview';
import MyLearning from './pages/MyLearning';
import LearningInterface from './pages/LearningInterface';
import TakeAssessment from './pages/TakeAssessment';
import AssessmentResults from './pages/AssessmentResults';
import CertificateVerify from './pages/CertificateVerify';
import MyCertificates from './pages/MyCertificates';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Layout Component
function Layout({ children }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:certificateId" element={<CertificateVerify />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/catalog" />} />
          
          <Route path="/catalog" element={
            <Layout>
              <CourseCatalog />
            </Layout>
          } />
          
          <Route path="/course/:courseId" element={
            <Layout>
              <CoursePreview />
            </Layout>
          } />
          
          < Route path="/my-learning" element={
            <ProtectedRoute>
              <Layout>
                <MyLearning />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-certificates" element={
            <ProtectedRoute>
              <Layout>
                <MyCertificates />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/learning/:enrollmentId" element={
            <ProtectedRoute>
              <LearningInterface />
            </ProtectedRoute>
          } />
          
          <Route path="/assessment/:assessmentId/take" element={
            <ProtectedRoute>
              <TakeAssessment />
            </ProtectedRoute>
          } />
          
          <Route path="/assessment/:assessmentId/results" element={
            <ProtectedRoute>
              <AssessmentResults />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
