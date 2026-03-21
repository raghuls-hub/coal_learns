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
      navigate('/candidate/login');
      return;
    }

    setEnrolling(true);
    try {
      const res = await apiClient.post('/enrollments', { courseId });
      setEnrollment(res.data.data);
      alert('Successfully enrolled! Redirecting to learning...');
      navigate(`/candidate/learning/${res.data.data._id}`);
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
      <button onClick={() => navigate('/candidate/catalog')} style={styles.backBtn}>Back to Catalog</button>
      
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
              onClick={() => navigate(`/candidate/learning/${enrollment._id}`)}
              style={styles.enrolledBtn}
            >
              Continue Learning
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    padding: '2rem', 
    maxWidth: '1200px', 
    margin: '0 auto', 
    minHeight: '100vh', 
    background: 'var(--bg-base)',
    color: 'var(--text-primary)' 
  },
  loading: { 
    textAlign: 'center', 
    padding: '3rem', 
    fontSize: '18px',
    color: 'var(--text-secondary)'
  },
  backBtn: { 
    marginBottom: '2rem', 
    padding: '0.5rem 1rem', 
    background: 'none', 
    border: 'none', 
    color: 'var(--accent-primary)',
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s'
  },
  header: { 
    display: 'flex', 
    gap: '3rem', 
    marginBottom: '3rem', 
    background: 'var(--bg-sidebar)',
    padding: '2.5rem', 
    borderRadius: '16px', 
    border: '1px solid var(--border-dim)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
  },
  title: { 
    fontSize: '36px', 
    fontWeight: '800', 
    color: 'var(--text-primary)', 
    marginBottom: '1rem',
    letterSpacing: '-0.025em'
  },
  description: { 
    fontSize: '17px', 
    color: 'var(--text-secondary)', 
    lineHeight: '1.7', 
    marginBottom: '1.5rem',
    maxWidth: '800px'
  },
  meta: { 
    display: 'flex', 
    gap: '0.75rem', 
    flexWrap: 'wrap' 
  },
  badge: { 
    padding: '0.5rem 1rem', 
    background: 'rgba(56, 189, 248, 0.15)', 
    color: 'var(--accent-primary)', 
    fontSize: '13px', 
    fontWeight: '600', 
    borderRadius: '8px', 
    textTransform: 'capitalize',
    border: '1px solid var(--border-dim)'
  },
  actionCard: { 
    minWidth: '280px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.5rem',
    padding: '1.5rem',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    justifyContent: 'center'
  },
  price: { 
    fontSize: '38px', 
    fontWeight: '800', 
    color: '#f59e0b', // Gold
    textAlign: 'center' 
  },
  enrollBtn: { 
    padding: '1rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: '700', 
    cursor: 'pointer',
    boxShadow: 'var(--accent-glow)',
    transition: 'transform 0.2s'
  },
  enrolledBtn: { 
    padding: '1rem', 
    background: 'rgba(16, 185, 129, 0.15)', 
    color: '#10b981', 
    border: '1px solid rgba(16, 185, 129, 0.3)', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: '700', 
    cursor: 'pointer' 
  },
  modulesSection: { 
    marginTop: '2rem' 
  },
  sectionTitle: { 
    fontSize: '26px', 
    fontWeight: '700', 
    color: '#ffffff', 
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  modulesList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.25rem' 
  },
  moduleCard: { 
    background: 'var(--bg-sidebar)', 
    padding: '1.75rem', 
    borderRadius: '14px', 
    border: '1px solid var(--border-dim)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s'
  },
  moduleHeader: { 
    marginBottom: '1rem' 
  },
  moduleNumber: { 
    fontSize: '12px', 
    color: '#f59e0b', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: '0.5rem',
    letterSpacing: '0.1em'
  },
  moduleTitle: { 
    fontSize: '20px', 
    fontWeight: '600', 
    color: '#f1f5f9' 
  },
  moduleDesc: { 
    fontSize: '15px', 
    color: '#94a3b8', 
    marginBottom: '1.25rem', 
    lineHeight: '1.6' 
  },
  moduleInfo: { 
    fontSize: '13px', 
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
};
