import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function CoursePreview() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/courses/${courseId}/modules`)
      ]);
      
      setCourse(courseRes.data.data);
      setModules(modulesRes.data.data || []);
      
      // Check if already enrolled
      if (user) {
        try {
          const enrollmentsRes = await apiClient.get('/enrollments/my-courses');
          const existingEnrollment = enrollmentsRes.data.data?.find(
            e => e.course._id === courseId
          );
          setEnrollment(existingEnrollment);
        } catch (error) {
          console.error('Failed to check enrollment:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const res = await apiClient.post('/enrollments', { courseId });
      setEnrollment(res.data.data);
      alert('Successfully enrolled! Redirecting to learning...');
      navigate(`/learning/${res.data.data._id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!course) return <div style={styles.loading}>Course not found</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/catalog')} style={styles.backBtn}>← Back to Catalog</button>
      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{course.title}</h1>
          <p style={styles.description}>{course.description}</p>
          <div style={styles.meta}>
            <span style={styles.badge}>{course.category}</span>
            <span style={styles.badge}>{course.level}</span>
            <span style={styles.badge}>{modules.length} Modules</span>
          </div>
        </div>
        
        <div style={styles.actionCard}>
          <div style={styles.price}>
            {course.pricing?.amount > 0 ? `$${course.pricing.amount}` : 'Free'}
          </div>
          {enrollment ? (
            <button 
              onClick={() => navigate(`/learning/${enrollment._id}`)}
              style={styles.enrolledBtn}
            >
              Continue Learning →
            </button>
          ) : (
            <button 
              onClick={handleEnroll}
              disabled={enrolling}
              style={styles.enrollBtn}
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>

      <div style={styles.modulesSection}>
        <h2 style={styles.sectionTitle}>Course Curriculum</h2>
        <div style={styles.modulesList}>
          {modules.map((module, index) => (
            <div key={module._id} style={styles.moduleCard}>
              <div style={styles.moduleHeader}>
                <span style={styles.moduleNumber}>Module {index + 1}</span>
                <h3 style={styles.moduleTitle}>{module.title}</h3>
              </div>
              {module.description && (
                <p style={styles.moduleDesc}>{module.description}</p>
              )}
              <div style={styles.moduleInfo}>
                <span>{module.content?.length || 0} chapters</span>
                {module.assessment && <span>• 1 assessment</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', background: '#f7fafc' },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px' },
  backBtn: { marginBottom: '2rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  header: { display: 'flex', gap: '3rem', marginBottom: '3rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '1rem' },
  description: { fontSize: '16px', color: '#4a5568', lineHeight: '1.6', marginBottom: '1.5rem' },
  meta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  badge: { padding: '0.5rem 1rem', background: '#edf2f7', color: '#4a5568', fontSize: '13px', fontWeight: '600', borderRadius: '6px', textTransform: 'capitalize' },
  actionCard: { minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  price: { fontSize: '36px', fontWeight: '700', color: '#667eea', textAlign: 'center' },
  enrollBtn: { padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  enrolledBtn: { padding: '1rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  modulesSection: { marginTop: '2rem' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '1.5rem' },
  modulesList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  moduleCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  moduleHeader: { marginBottom: '0.75rem' },
  moduleNumber: { fontSize: '12px', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' },
  moduleTitle: { fontSize: '18px', fontWeight: '600', color: '#2d3748' },
  moduleDesc: { fontSize: '14px', color: '#718096', marginBottom: '1rem', lineHeight: '1.6' },
  moduleInfo: { fontSize: '13px', color: '#a0aec0' },
};
