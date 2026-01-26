import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Filter by current user if they are a mentor
      const params = user?.role === 'mentor' 
        ? { courseHandler: user.userId } 
        : {};
        
      const response = await apiClient.get('/api/courses', { params });
      const coursesData = response.data.data?.courses || response.data.courses || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId, currentStatus) => {
    try {
      await apiClient.put(`/api/courses/${courseId}/publish`);
      fetchCourses();
    } catch (error) {
      alert('Failed to toggle publish status');
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      await apiClient.delete(`/api/courses/${courseId}`);
      fetchCourses();
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  if (loading) return <div style={styles.loading}>Loading courses...</div>;

  return (
    <div style={styles.container}>

      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Courses</h1>
          <p style={styles.subtitle}>Manage your course catalog</p>
        </div>
        <button onClick={() => navigate('/create-course')} style={styles.createBtn}>
          + Create New Course
        </button>
      </div>

      <div style={styles.grid}>
        {courses.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📚</div>
            <h3>No courses yet</h3>
            <p>Create your first course to get started!</p>
            <button onClick={() => navigate('/create-course')} style={styles.createBtn}>
              Create Course
            </button>
          </div>
        ) : (
          courses.map((course) => (
            <div 
              key={course._id} 
              style={styles.card}
              onClick={() => navigate(`/course/${course._id}`)}
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{course.title}</h3>
                <span style={course.settings.isPublished ? styles.badgePublished : styles.badgeDraft}>
                  {course.settings.isPublished ? '✓ Published' : '📝 Draft'}
                </span>
              </div>
              <p style={styles.description}>{course.description}</p>
              <div style={styles.meta}>
                <span>📚 {course.category}</span>
                <span>📊 {course.level}</span>
                <span>💰 ${course.pricing.amount}</span>
              </div>
              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <strong>{course.stats.enrollmentCount}</strong>
                  <span>Students</span>
                </div>
                <div style={styles.statItem}>
                  <strong>{course.modules?.length || 0}</strong>
                  <span>Modules</span>
                </div>
                <div style={styles.statItem}>
                  <strong>${(course.pricing.amount * course.stats.enrollmentCount).toFixed(0)}</strong>
                  <span>Revenue</span>
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePublish(course._id, course.settings.isPublished);
                  }}
                  style={styles.publishBtn}
                >
                  {course.settings.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCourse(course._id);
                  }} 
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100%', background: '#f7fafc' },
  backBtn: { marginBottom: '1rem', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.25rem' },
  subtitle: { color: '#718096', fontSize: '14px' },
  createBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  emptyIcon: { fontSize: '64px', marginBottom: '1rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
  courseTitle: { fontSize: '18px', fontWeight: '600', color: '#1a202c', flex: 1, marginRight: '1rem' },
  badgePublished: { padding: '0.25rem 0.75rem', background: '#48bb78', color: 'white', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap' },
  badgeDraft: { padding: '0.25rem 0.75rem', background: '#cbd5e0', color: '#2d3748', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap' },
  description: { color: '#4a5568', fontSize: '14px', marginBottom: '1rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  meta: { display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '13px', color: '#718096', flexWrap: 'wrap' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  statItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' },
  editBtn: { padding: '0.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  publishBtn: { padding: '0.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  deleteBtn: { padding: '0.5rem', background: '#f56565', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
};
