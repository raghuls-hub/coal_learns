import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { path: '/tutor/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/tutor/my-courses', label: 'My Courses', icon: '◫' },
  { path: '/tutor/create-course', label: 'Create Course', icon: '+' },
  { path: '/tutor/settings', label: 'Settings', icon: '⚙' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (p) => location.pathname === p;
  const pageLabel = NAV.find(n => n.path === location.pathname)?.label || 'Portal';

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <aside style={{ ...S.sidebar, width: collapsed ? 72 : 240 }}>
        <div style={S.sidebarTop}>
          <div style={S.brand}>
            <div style={S.brandMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && <span style={S.brandName}>MentorPortal</span>}
          </div>
        </div>

        <nav style={S.nav}>
          {NAV.map(({ path, label, icon }) => (
            <div key={path} onClick={() => navigate(path)}
              style={{ ...S.navItem, ...(isActive(path) ? S.navItemActive : {}) }}
              title={collapsed ? label : undefined}
            >
              <span style={{ ...S.navIcon, ...(isActive(path) ? S.navIconActive : {}) }}>{icon}</span>
              {!collapsed && <span style={S.navLabel}>{label}</span>}
            </div>
          ))}
        </nav>

        <div style={S.sidebarFoot}>
          <div onClick={() => { logout(); navigate('/tutor/login'); }} style={S.logoutItem} title={collapsed ? 'Logout' : undefined}>
            <span style={{ ...S.navIcon, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>⏻</span>
            {!collapsed && <span style={{ color: '#f87171', fontSize: 14, fontWeight: 600 }}>Logout</span>}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={S.main}>
        <header style={S.header}>
          <div style={S.headerLeft}>
            <button onClick={() => setCollapsed(c => !c)} style={S.toggleBtn} title="Toggle sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 style={S.pageTitle}>{pageLabel}</h2>
          </div>
          <div style={S.userChip}>
            <span style={S.welcome}>Welcome, <strong>{user?.profile?.firstName || 'Mentor'}</strong></span>
            <div style={S.avatar}>{(user?.profile?.firstName?.[0] || 'M').toUpperCase()}</div>
          </div>
        </header>
        <div style={S.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const S = {
  root: { display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" },
  sidebar: { background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, zIndex: 10 },
  sidebarTop: { padding: '1.25rem', borderBottom: '1px solid var(--border)', height: 72, display: 'flex', alignItems: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' },
  brandMark: { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.02em' },
  nav: { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemActive: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' },
  navIcon: { width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: 'var(--text-muted)' },
  navIconActive: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarFoot: { padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' },
  logoutItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.03)', overflow: 'hidden', whiteSpace: 'nowrap' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  header: { height: 72, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  toggleBtn: { width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 },
  pageTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  userChip: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.5rem 1rem' },
  welcome: { fontSize: 13, color: 'var(--text-secondary)' },
  avatar: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 },
  content: { flex: 1, overflowY: 'auto', background: 'var(--bg-base)' },
};
