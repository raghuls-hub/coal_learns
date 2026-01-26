import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function MyCertificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await apiClient.get('/certificates/my');
      setCertificates(res.data.data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading certificates...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Certificates</h1>
        <p style={styles.subtitle}>View and download your earned credentials.</p>
      </header>

      {certificates.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎓</div>
          <h3>No Certificates Yet</h3>
          <p>Complete courses and pass the final exam to earn certificates.</p>
          <button onClick={() => navigate('/catalog')} style={styles.exploreBtn}>
            Explore Courses
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {certificates.map((cert) => (
            <div key={cert._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.badge}>Verified Credential</span>
                <span style={styles.date}>{new Date(cert.issueDate).toLocaleDateString()}</span>
              </div>
              
              <div style={styles.cardBody}>
                <h3 style={styles.courseTitle}>{cert.course.title}</h3>
                <p style={styles.certId}>ID: {cert.certificateId}</p>
              </div>

              <div style={styles.cardFooter}>
                <button 
                  onClick={() => window.open(`http://localhost:5000/api/certificates/download/${cert.certificateId}`, '_blank')}
                  style={styles.downloadBtn}
                >
                  Download PDF
                </button>
                <button 
                   onClick={() => navigate(`/verify/${cert.certificateId}`)}
                   style={styles.verifyBtn}
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", minHeight: '80vh' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#64748b' },
  header: { marginBottom: '3rem', textAlign: 'center' },
  title: { fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' },
  subtitle: { color: '#64748b', fontSize: '18px' },
  emptyState: { textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' },
  emptyIcon: { fontSize: '48px', marginBottom: '1rem', display: 'block' },
  exploreBtn: { marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' },
  card: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  cardHeader: { padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '0.25rem 0.75rem', borderRadius: '99px' },
  date: { fontSize: '13px', color: '#64748b' },
  cardBody: { padding: '1.5rem', flex: 1 },
  courseTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', lineHeight: '1.4' },
  certId: { fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' },
  cardFooter: { padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' },
  downloadBtn: { flex: 1, padding: '0.6rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  verifyBtn: { flex: 1, padding: '0.6rem', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }
};
