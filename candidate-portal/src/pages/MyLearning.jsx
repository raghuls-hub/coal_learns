import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollRes, certRes] = await Promise.all([
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/certificates/my')
      ]);
      setEnrollments(enrollRes.data.data || []);
      setCertificates(certRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCertificate = async (courseId) => {
    setClaiming(courseId);
    try {
      const res = await apiClient.post('/certificates/claim', { courseId });
      if (res.data.success) {
        alert('Certificate Claimed Successfully!');
        fetchData(); // Refresh both lists
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to claim certificate');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <div style={styles.loading}>Loading your courses...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Learning</h1>
          <p style={styles.subtitle}>Continue where you left off</p>
        </div>
        <button onClick={() => navigate('/catalog')} style={styles.browseBtn}>
          Browse More Courses
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div style={styles.empty}>
          <h3>No courses yet</h3>
          <p>Start learning by enrolling in a course</p>
          <button onClick={() => navigate('/catalog')} style={styles.emptyBtn}>
            Explore Courses
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {enrollments.map(enrollment => {
             // Check if certificate exists for this course
             const cert = certificates.find(c => 
               c.course && enrollment.course && 
               (c.course._id === enrollment.course._id || c.course === enrollment.course._id)
             );
             const isClaimed = !!cert;

             const isCompleted = enrollment.progress === 100 || enrollment.status === 'completed';
             
             return (
            <div key={enrollment._id} style={styles.card} className="card-hover">
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{enrollment.course.title}</h3>
                <span style={{...styles.status, background: isCompleted ? '#C6F6D5' : '#EBF8FF', color: isCompleted ? '#22543D' : '#2C5282'}}>
                    {enrollment.status}
                </span>
              </div>
              
              <p style={styles.courseDesc}>{enrollment.course.description}</p>
              
              <div style={styles.progressSection}>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${enrollment.progress || 0}%`}}></div>
                </div>
                <span style={styles.progressText}>{enrollment.progress || 0}% Complete</span>
              </div>
              
              <div style={styles.actions}>
                  <button
                    onClick={() => {
                        // Pass enrollmentId via query param for new tab persistence (if needed by assessment)
                        window.open(`/learning/${enrollment._id}?enrollmentId=${enrollment._id}`, '_blank');
                    }}
                    style={styles.continueBtn}
                  >
                    {isCompleted ? 'Review Course' : 'Continue Learning ↗'}
                  </button>

                  {isCompleted && (
                      !isClaimed ? (
                        <button 
                            onClick={() => handleClaimCertificate(enrollment.course._id)}
                            disabled={claiming === enrollment.course._id}
                            style={styles.claimBtn}
                        >
                            {claiming === enrollment.course._id ? 'Claiming...' : '🎓 Claim Certificate'}
                        </button>
                      ) : (
                        <button 
                            onClick={() => navigate(`/my-certificates`)} 
                            style={styles.viewCertBtn}
                        >
                            📜 View Certificate
                        </button>
                      )
                  )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f7fafc' },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { fontSize: '32px', fontWeight: '700', color: '#1a202c' },
  subtitle: { fontSize: '16px', color: '#718096', marginTop: '0.5rem' },
  browseBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  emptyBtn: { marginTop: '1.5rem', padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
  courseTitle: { fontSize: '20px', fontWeight: '700', color: '#2d3748', flex: 1 },
  status: { padding: '0.375rem 0.75rem', fontSize: '12px', fontWeight: '600', borderRadius: '6px', textTransform: 'capitalize' },
  courseDesc: { fontSize: '14px', color: '#718096', marginBottom: '1.5rem', lineHeight: '1.6' },
  progressSection: { marginBottom: '1.5rem' },
  progressBar: { width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', transition: 'width 0.3s' },
  progressText: { fontSize: '13px', color: '#4a5568', fontWeight: '600' },
  actions: { display: 'flex', gap: '1rem', marginTop: 'auto' },
  continueBtn: { flex: 1, padding: '0.75rem', background: '#EDF2F7', color: '#2D3748', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  claimBtn: { flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  viewCertBtn: { flex: 1, padding: '0.75rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
