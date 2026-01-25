import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    pricing: { amount: 0 }
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/api/courses');
      console.log('Admin Portal - Full Response:', response);
      console.log('Admin Portal - Courses:', response.data.data?.courses);
      
      const coursesData = response.data.data?.courses || response.data.courses || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/courses', formData);
      setShowCreateForm(false);
      setFormData({ title: '', description: '', category: '', level: 'beginner', pricing: { amount: 0 } });
      fetchCourses();
    } catch (error) {
      alert('Failed to create course: ' + (error.response?.data?.error || error.message));
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
    if (!confirm('Are you sure you want to delete this course?')) return;

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
        <h1 style={styles.title}>Course Management</h1>
        {user?.role === 'course_handler' && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
            {showCreateForm ? 'Cancel' : '+ Create Course'}
          </button>
        )}
        {user?.role === 'admin' && (
          <div style={styles.infoText}>
            ℹ️ Admins can edit and delete courses, but only Course Handlers can create new courses
          </div>
        )}
      </div>

      {showCreateForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Create New Course</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Course Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={styles.input}
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              style={styles.textarea}
              rows="4"
            />
            <input
              type="text"
              placeholder="Category (e.g., Technology, Business)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              style={styles.input}
            />
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              style={styles.select}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input
              type="number"
              placeholder="Price ($)"
              value={formData.pricing.amount}
              onChange={(e) => setFormData({ ...formData, pricing: { amount: parseFloat(e.target.value) } })}
              required
              style={styles.input}
              min="0"
              step="0.01"
            />
            <button type="submit" style={styles.submitBtn}>Create Course</button>
          </form>
        </div>
      )}

      <div style={styles.grid}>
        {courses.length === 0 ? (
          <p style={styles.emptyState}>No courses yet. Create your first course!</p>
        ) : (
          courses.map((course) => (
            <div key={course._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{course.title}</h3>
                <span style={course.settings.isPublished ? styles.badgePublished : styles.badgeDraft}>
                  {course.settings.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p style={styles.description}>{course.description}</p>
              <div style={styles.meta}>
                <span>📚 {course.category}</span>
                <span>📊 {course.level}</span>
                <span>💰 ${course.pricing.amount}</span>
              </div>
              <div style={styles.stats}>
                <span>👥 {course.stats.enrollmentCount} enrolled</span>
                <span>✅ {course.stats.completionCount} completed</span>
              </div>
              <div style={styles.actions}>
{/* <button
                  onClick={() => togglePublish(course._id, course.settings.isPublished)}
                  style={styles.actionBtn}
                >
                  {course.settings.isPublished ? 'Unpublish' : 'Publish'}
                </button> */}
                <button onClick={() => deleteCourse(course._id)} style={styles.deleteBtn}>
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
  container: { minHeight: '100vh', padding: '2rem' }, // Background handled by body
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255, 255, 255, 0.5)' },
  title: { fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-main) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  infoText: { color: 'var(--primary-light)', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-dark)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' },
  createBtn: { padding: '0.75rem 1.5rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-blue)', transition: 'all 0.2s' },
  
  formCard: { background: 'white', padding: '2.5rem', borderRadius: '20px', marginBottom: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' },
  formTitle: { fontSize: '20px', marginBottom: '1.5rem', color: 'var(--primary-dark)', fontWeight: '700' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  input: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-card)', transition: 'all 0.2s' },
  textarea: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', background: 'var(--bg-card)', minHeight: '100px', resize: 'vertical' },
  select: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-card)', cursor: 'pointer' },
  submitBtn: { padding: '1rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' },
  emptyState: { textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', gridColumn: '1 / -1', background: 'white', borderRadius: '16px', border: '1px dotted var(--border-color)' },
  
  card: { background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' },
  courseTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', flex: 1, lineHeight: '1.4' },
  badgePublished: { padding: '0.4rem 0.8rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.2)' },
  badgeDraft: { padding: '0.4rem 0.8rem', background: 'var(--bg-dark)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--border-color)' },
  
  description: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.5rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  
  meta: { display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' },
  stats: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '13px', color: 'var(--primary-light)', padding: '1rem 0', borderTop: '1px solid var(--bg-hover)', borderBottom: '1px solid var(--bg-hover)' },
  
  actions: { display: 'flex', gap: '0.8rem', marginTop: 'auto' },
  actionBtn: { flex: 1, padding: '0.6rem', background: 'var(--bg-hover)', color: 'var(--primary-main)', border: '1px solid var(--primary-main)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtn: { flex: 1, padding: '0.6rem', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
};
