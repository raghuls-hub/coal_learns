import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/my-courses', label: 'My Courses', icon: '📚' },
    { path: '/create-course', label: 'Create Course', icon: '✏️' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: isSidebarOpen ? '260px' : '80px' }}>
        <div style={styles.logoArea}>
          <div style={styles.logoText}>
            {isSidebarOpen ? '👨‍🏫 MentorPortal' : '🎓'}
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4f46e5' : '#64748b',
                  borderRight: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                }}
              >
                <span style={styles.icon}>{item.icon}</span>
                {isSidebarOpen && <span style={styles.label}>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        <div style={styles.footer}>
          <div 
            onClick={handleLogout}
            style={styles.logoutBtn}
          >
            <span style={styles.icon}>🚪</span>
            {isSidebarOpen && <span>Logout</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={styles.toggleBtn}
            >
              ☰
            </button>
            <h2 style={styles.pageTitle}>
              {menuItems.find(m => m.path === location.pathname)?.label || 'Portal'}
            </h2>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.welcome}>Welcome, <b>{user?.profile?.firstName || 'Mentor'}</b></span>
            <div style={styles.avatar}>
              {user?.profile?.firstName?.[0] || 'M'}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#f8fafc',
  },
  sidebar: {
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 10,
    overflowX: 'hidden',
  },
  logoArea: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4f46e5',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '15px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  icon: {
    fontSize: '20px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
  },
  label: {
    opacity: 1,
    transition: 'opacity 0.2s',
  },
  footer: {
    padding: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    color: '#ef4444',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#fef2f2',
    }
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 5,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  welcome: {
    color: '#64748b',
    fontSize: '14px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
  },
};
