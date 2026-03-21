import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import CandidateModule from './modules/candidate/CandidateModule';
import TutorModule from './modules/tutor/TutorModule';
import CertificateVerify from './modules/candidate/pages/CertificateVerify';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Candidate Routes */}
        <Route path="/candidate/*" element={<CandidateModule />} />
        
        {/* Public Routes */}
        <Route path="/verify/:certificateId" element={<CertificateVerify />} />
        
        {/* Tutor Routes */}
        <Route path="/tutor/*" element={<TutorModule />} />
        
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}
