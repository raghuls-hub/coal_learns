import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (p) => location.pathname.startsWith(p);

  const links = [
    { label: 'Explore', path: '/candidate/catalog' },
    ...(isAuthenticated ? [
      { label: 'My Learning', path: '/candidate/my-learning' },
      { label: 'Certificates', path: '/candidate/my-certificates' },
    ] : []),
  ];

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <div style={S.brand} onClick={() => navigate('/candidate/catalog')}>
          <div style={S.mark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={S.brandName}>Coal Learns</span>
        </div>

        <div style={S.links}>
          {links.map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)} style={isActive(path) ? S.linkActive : S.link}>
              {label}
            </button>
          ))}
        </div>

        <div style={S.right}>
          {isAuthenticated ? (
            <>
              <div style={S.chip}>
                <div style={S.avatar}>{(user?.email?.[0] || 'U').toUpperCase()}</div>
                <span style={S.chipName}>{user?.email?.split('@')[0]}</span>
              </div>
              <button onClick={() => { logout(); navigate('/candidate/login'); }} style={S.logoutBtn}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/candidate/login')} style={S.ghostBtn}>Sign In</button>
              <button onClick={() => navigate('/candidate/register')} style={S.primaryBtn}>Get Started</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,9,18,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  inner: { maxWidth: 1280, margin: '0 auto', padding: '0 2rem', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
  mark: { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.02em' },
  links: { display: 'flex', gap: 4 },
  link: { padding: '0.4rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderRadius: 8, transition: 'color 0.2s, background 0.2s' },
  linkActive: { padding: '0.4rem 1rem', background: 'rgba(99,102,241,0.12)', border: 'none', color: '#a5b4fc', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 8 },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  chip: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 12px 4px 4px' },
  avatar: { width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11 },
  chipName: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
  ghostBtn: { padding: '0.45rem 1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  primaryBtn: { padding: '0.45rem 1.1rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', border: 'none', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  logoutBtn: { padding: '0.4rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
