import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 LMS Admin Dashboard</h1>
        <div style={styles.userInfo}>
          <span>{user?.profile?.firstName} {user?.profile?.lastName} ({user?.role})</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.navBtn}>📊 Dashboard</button>
        <button onClick={() => navigate('/courses')} style={styles.navBtn}>📚 Courses</button>
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/users')} style={styles.navBtn}>👥 Users</button>
        )}
      </nav>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>👥</div>
          <h3 style={styles.cardTitle}>Total Users</h3>
          <p style={styles.stat}>1,234</p>
          <p style={styles.label}>+12% from last month</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📚</div>
          <h3 style={styles.cardTitle}>Active Courses</h3>
          <p style={styles.stat}>45</p>
          <p style={styles.label}>8 published this month</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🎯</div>
          <h3 style={styles.cardTitle}>Enrollments</h3>
          <p style={styles.stat}>3,567</p>
          <p style={styles.label}>+23% growth</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💰</div>
          <h3 style={styles.cardTitle}>Revenue</h3>
          <p style={styles.stat}>$45,890</p>
          <p style={styles.label}>This month</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚀 Quick Actions</h2>
        <div style={styles.actions}>
          <button onClick={() => navigate('/courses')} style={styles.actionBtn}>
            📚 Manage Courses
          </button>
          <button style={styles.actionBtn}>👥 Add User</button>
          <button style={styles.actionBtn}>📊 View Reports</button>
          <button style={styles.actionBtn}>🎓 Manage Certificates</button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 System Status</h2>
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}>✅</span>
            <span>Backend API: Running</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}>✅</span>
            <span>Database: Connected</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}>✅</span>
            <span>Authentication: Active</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}>⚠️</span>
            <span>AI Service: API Key Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', padding: '2rem' }, // Background handled by body
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255, 255, 255, 0.5)' },
  title: { fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-main) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  logoutBtn: { padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--primary-main)', border: '1px solid var(--primary-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  nav: { display: 'flex', gap: '1rem', marginBottom: '2.5rem', background: 'white', padding: '0.75rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', width: 'fit-content' },
  navBtn: { padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
  navBtnActive: { background: 'var(--primary-main)', color: 'white', boxShadow: 'var(--shadow-blue)' }, // Example usage
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'pointer', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' },
  cardIcon: { fontSize: '32px', marginBottom: '1rem', background: 'var(--bg-dark)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', color: 'var(--primary-main)' },
  cardTitle: { fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' },
  stat: { fontSize: '36px', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  label: { fontSize: '13px', color: 'var(--accent)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' },
  section: { background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', marginBottom: '2.5rem', border: '1px solid var(--border-color)' },
  sectionTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '2rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  actionBtn: { padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-hover) 0%, white 100%)', color: 'var(--primary-main)', border: '1px solid var(--border-color)', borderRadius: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)' },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' },
  statusItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '16px', fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', border: '1px solid rgba(14, 165, 233, 0.1)' },
  statusDot: { fontSize: '8px', padding: '4px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)' },
};
