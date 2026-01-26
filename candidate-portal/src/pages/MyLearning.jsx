import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await apiClient.get('/enrollments/my-courses');
      setEnrollments(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
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
          {enrollments.map(enrollment => (
            <div key={enrollment._id} style={styles.card} className="card-hover">
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{enrollment.course.title}</h3>
                <span style={styles.status}>{enrollment.status}</span>
              </div>
              
              <p style={styles.courseDesc}>{enrollment.course.description}</p>
              
              <div style={styles.progressSection}>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${enrollment.progress || 0}%`}}></div>
                </div>
                <span style={styles.progressText}>{enrollment.progress || 0}% Complete</span>
              </div>
              
              <button
                onClick={() => navigate(`/learning/${enrollment._id}`)}
                style={styles.continueBtn}
              >
                Continue Learning →
              </button>
            </div>
          ))}
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
  status: { padding: '0.375rem 0.75rem', background: '#C6F6D5', color: '#22543D', fontSize: '12px', fontWeight: '600', borderRadius: '6px', textTransform: 'capitalize' },
  courseDesc: { fontSize: '14px', color: '#718096', marginBottom: '1.5rem', lineHeight: '1.6' },
  progressSection: { marginBottom: '1.5rem' },
  progressBar: { width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', transition: 'width 0.3s' },
  progressText: { fontSize: '13px', color: '#4a5568', fontWeight: '600' },
  continueBtn: { padding: '0.75rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
