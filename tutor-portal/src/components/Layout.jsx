import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  MenuIcon,
  DashboardIcon,
  CoursesIcon,
  CreateIcon,
  LogoutIcon,
  SettingsIcon,
} from './Icons';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/my-courses', label: 'My Courses', icon: CoursesIcon },
    { path: '/create-course', label: 'Create Course', icon: CreateIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
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
            {isSidebarOpen ? 'MentorPortal' : 'MP'}
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComp = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  boxShadow: isActive ? 'var(--accent-glow)' : 'none',
                }}
              >
                <span style={{
                  ...styles.icon,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-dim)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                }}>
                  <IconComp size={16} color={isActive ? '#6366f1' : '#64748b'} />
                </span>
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
            <span style={{ ...styles.icon, color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <LogoutIcon size={16} color='#ef4444' />
            </span>
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
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <MenuIcon size={18} color='var(--text-secondary)' />
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
    backgroundColor: 'var(--bg-base)',
  },
  sidebar: {
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-dim)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width-0.3s-ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 10,
    overflowX: 'hidden',
    boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
  },
  logoArea: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '900',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    padding: '1.5rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.85rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '15px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    borderRadius: '12px',
    margin: '0 0.5rem',
  },
  icon: {
    fontSize: '11px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    fontWeight: '800',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-dim)',
    transition: 'all 0.2s',
  },
  label: {
    opacity: 1,
    transition: 'opacity 0.2s',
  },
  footer: {
    padding: '1.25rem',
    borderTop: '1px solid var(--border-dim)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.85rem',
    color: 'var(--error)',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(239, 68, 68, 0.1)',
    background: 'rgba(239, 68, 68, 0.02)',
    fontSize: '14px',
    fontWeight: '700',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: '80px',
    backgroundColor: 'var(--bg-header)',
    borderBottom: '1px solid var(--border-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 5,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  toggleBtn: {
    background: 'var(--bg-base)',
    border: '1px solid var(--border-dim)',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '0.5rem 1rem',
    borderRadius: '14px',
    border: '1px solid var(--border-dim)',
  },
  welcome: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--accent-gradient)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '15px',
    boxShadow: 'var(--accent-glow)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'var(--bg-base)',
  },
};
