import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api';

export default function CertificateVerify() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verify();
  }, [certificateId]);

  const verify = async () => {
    try {
      // Endpoint is GET /api/certificates/:id
      // apiClient likely has baseURL set to /api
      const res = await apiClient.get(`/certificates/${certificateId}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError('Invalid Certificate');
      }
    } catch (err) {
      setError('Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Verifying...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {error ? (
           <div style={styles.errorState}>
             <h1 style={{color: '#ef4444'}}>❌ Invalid Certificate</h1>
             <p>{error}</p>
           </div>
        ) : (
           <div style={styles.successState}>
             <div style={styles.icon}>✅</div>
             <h1 style={styles.title}>Verified Certificate</h1>
             <p style={styles.subtitle}>This certificate is valid and was issued by our platform.</p>
             
             <div style={styles.details}>
               <div style={styles.row}>
                 <span style={styles.label}>Recipient:</span>
                 <strong style={styles.value}>{data.user.profile.firstName} {data.user.profile.lastName}</strong>
               </div>
               <div style={styles.row}>
                 <span style={styles.label}>Course:</span>
                 <strong style={styles.value}>{data.course?.title || 'Course Title Unavailable'}</strong>
               </div>
               <div style={styles.row}>
                 <span style={styles.label}>Issue Date:</span>
                 <span style={styles.value}>{new Date(data.issueDate).toLocaleDateString()}</span>
               </div>
               <div style={styles.row}>
                 <span style={styles.label}>Instructor:</span>
                 <span style={styles.value}>{data.instructorName || 'Platform Instructor'}</span>
               </div>
               <div style={styles.row}>
                 <span style={styles.label}>Certificate ID:</span>
                 <span style={styles.valueMono}>{data.certificateId}</span>
               </div>
             </div>
             
             <div style={styles.footer}>
               <p>Antigravity LMS Verification System</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Inter', sans-serif" },
  card: { background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '500px', width: '90%' },
  errorState: { textAlign: 'center' },
  successState: { textAlign: 'center' },
  icon: { fontSize: '48px', marginBottom: '1rem' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', fontSize: '15px', marginBottom: '2rem' },
  details: { textAlign: 'left', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' },
  label: { color: '#64748b', fontSize: '14px', fontWeight: '500' },
  value: { color: '#0f172a', fontWeight: '600', fontSize: '15px' },
  valueMono: { fontFamily: 'monospace', color: '#64748b', fontSize: '13px' },
  footer: { marginTop: '2rem', fontSize: '12px', color: '#94a3b8' }
};
