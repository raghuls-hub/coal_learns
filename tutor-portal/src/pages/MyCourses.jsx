import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { EditIcon, DeleteIcon, PublishIcon, UnpublishIcon } from '../components/Icons';

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
      const params = user?.role === 'mentor' 
        ? { courseHandler: user.userId } 
        : {};
        
      const response = await apiClient.get('/api/courses', { params });
      const coursesData = response.data.data?.courses || response.data.courses || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
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
    if (!confirm(
      'Are you sure you want to delete this course?\n\n' +
      'This will permanently remove the course.\n' +
      'Enrolled students will retain their progress and certificates.'
    )) return;

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
          Create New Course
        </button>
      </div>

      <div style={styles.grid}>
        {courses.length === 0 ? (
          <div style={styles.emptyState}>
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
                <span style={
                  course.settings.isPublished
                    ? styles.badgePublished
                    : course.settings.isArchived
                    ? styles.badgeArchived
                    : styles.badgeDraft
                }>
                  {course.settings.isPublished ? 'Published' : course.settings.isArchived ? 'Archived' : 'Draft'}
                </span>
              </div>
              <p style={styles.description}>{course.description}</p>
              <div style={styles.meta}>
                <span style={styles.badgeDraft}>{course.category}</span>
                <span style={styles.badgeDraft}>{course.level}</span>
                <span style={{ ...styles.badgeDraft, color: 'var(--accent-primary)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>₹{course.pricing.amount}</span>
              </div>
              <div style={styles.stats}>
                <div style={styles.statItem}>
                  <strong style={styles.statVal}>{course.stats.enrollmentCount}</strong>
                  <span style={styles.statLabel}>Students</span>
                </div>
                <div style={styles.statItem}>
                  <strong style={styles.statVal}>{course.modules?.length || 0}</strong>
                  <span style={styles.statLabel}>Modules</span>
                </div>
                <div style={styles.statItem}>
                  <strong style={styles.statVal}>₹{(course.pricing.amount * course.stats.enrollmentCount).toFixed(0)}</strong>
                  <span style={styles.statLabel}>Revenue</span>
                </div>
              </div>
              <div style={styles.actions}>
                  {course.settings.isPublished ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublish(course._id, course.settings.isPublished); }}
                      style={styles.publishBtn}
                    >
                      <UnpublishIcon size={13} color='#6366f1' />
                      <span style={{ marginLeft: '5px' }}>Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublish(course._id, course.settings.isPublished); }}
                      style={styles.publishBtn}
                    >
                      <PublishIcon size={13} color='#6366f1' />
                      <span style={{ marginLeft: '5px' }}>Publish</span>
                    </button>
                  )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCourse(course._id);
                  }} 
                  style={styles.deleteBtn}
                >
                  <DeleteIcon size={13} color='#ef4444' />
                  <span style={{ marginLeft: '5px' }}>Delete</span>
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
  container: { padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100%' },
  loading: { textAlign: 'center', padding: '5rem', fontSize: '18px', color: 'var(--text-secondary)' },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '3rem', 
    background: 'rgba(30, 41, 59, 0.4)', 
    padding: '2.5rem', 
    borderRadius: '24px', 
    border: '1px solid var(--border-dim)', 
    backdropFilter: 'blur(10px)',
  },
  title: { fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.025em' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500' },
  createBtn: { 
    padding: '1rem 2rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '15px', 
    fontWeight: '800', 
    cursor: 'pointer', 
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border-dim)' },
  card: { 
    background: 'var(--bg-surface)', 
    padding: '2rem', 
    borderRadius: '20px', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', gap: '1rem' },
  courseTitle: { fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', flex: 1, lineHeight: '1.4', letterSpacing: '-0.01em' },
  badgePublished: { padding: '0.4rem 0.9rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(16, 185, 129, 0.2)' },
  badgeArchived: { padding: '0.4rem 0.9rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(245, 158, 11, 0.2)' },
  badgeDraft: { padding: '0.4rem 0.9rem', background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-secondary)', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid var(--border-dim)' },
  description: { color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '2rem', lineHeight: '1.6', height: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  meta: { display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-dim)' },
  statItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  statVal: { color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' },
  statLabel: { color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: 'auto' },
  publishBtn: { 
    padding: '0.875rem', 
    background: 'rgba(99, 102, 241, 0.05)', 
    color: 'var(--accent-primary)', 
    border: '1px solid rgba(99, 102, 241, 0.2)', 
    borderRadius: '12px', 
    fontSize: '13px', 
    cursor: 'pointer', 
    fontWeight: '800',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { 
    padding: '0.875rem', 
    background: 'transparent', 
    color: 'var(--error)', 
    border: '1px solid rgba(239, 68, 68, 0.1)', 
    borderRadius: '12px', 
    fontSize: '13px', 
    cursor: 'pointer', 
    fontWeight: '800',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
