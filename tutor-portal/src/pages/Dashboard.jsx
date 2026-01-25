import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/courses');
      const courses = response.data.data.courses;
      
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(c => c.settings.isPublished).length;
      const totalEnrollments = courses.reduce((sum, c) => sum + c.stats.enrollmentCount, 0);
      const totalRevenue = courses.reduce((sum, c) => sum + (c.pricing.amount * c.stats.enrollmentCount), 0);

      setStats({ totalCourses, publishedCourses, totalEnrollments, totalRevenue });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 Tutor Dashboard</h1>
        <div style={styles.userInfo}>
          <span>{user?.profile?.firstName} {user?.profile?.lastName}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.navBtn}>📊 Dashboard</button>
        <button onClick={() => navigate('/my-courses')} style={styles.navBtn}>📚 My Courses</button>
        <button onClick={() => navigate('/create-course')} style={styles.navBtnPrimary}>+ Create Course</button>
      </nav>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📚</div>
          <h3 style={styles.cardTitle}>Total Courses</h3>
          <p style={styles.stat}>{stats.totalCourses}</p>
          <p style={styles.label}>{stats.publishedCourses} published</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>👥</div>
          <h3 style={styles.cardTitle}>Total Enrollments</h3>
          <p style={styles.stat}>{stats.totalEnrollments}</p>
          <p style={styles.label}>Across all courses</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <h3 style={styles.cardTitle}>Total Revenue</h3>
          <p style={styles.stat}>${stats.totalRevenue.toFixed(2)}</p>
          <p style={styles.label}>Before commission</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>⭐</div>
          <h3 style={styles.cardTitle}>Avg Rating</h3>
          <p style={styles.stat}>4.8</p>
          <p style={styles.label}>Based on reviews</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚀 Quick Actions</h2>
        <div style={styles.actions}>
          <button onClick={() => navigate('/create-course')} style={styles.actionBtn}>
            ➕ Create New Course
          </button>
          <button onClick={() => navigate('/my-courses')} style={styles.actionBtn}>
            📝 Edit Courses
          </button>
          <button style={styles.actionBtn}>📊 View Analytics</button>
          <button style={styles.actionBtn}>💬 Student Messages</button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💡 Tips for Success</h2>
        <ul style={styles.tipsList}>
          <li>Create engaging course content with clear learning outcomes</li>
          <li>Use a mix of videos, PDFs, and interactive assessments</li>
          <li>Respond to student questions promptly</li>
          <li>Keep your courses updated with latest information</li>
          <li>Promote your courses through social media</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f7fafc', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1.5rem 2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a202c' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '14px' },
  logoutBtn: { padding: '0.5rem 1rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  nav: { display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  navBtn: { padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  navBtnPrimary: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginLeft: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardIcon: { fontSize: '32px', marginBottom: '0.5rem' },
  cardTitle: { fontSize: '14px', color: '#718096', marginBottom: '0.5rem', fontWeight: '500' },
  stat: { fontSize: '32px', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.25rem' },
  label: { fontSize: '12px', color: '#48bb78' },
  section: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem', color: '#1a202c' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  actionBtn: { padding: '1rem', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  tipsList: { paddingLeft: '1.5rem', lineHeight: '2', color: '#4a5568' },
};
