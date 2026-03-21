import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/candidate/login');
  };

  const navLinks = [
    { label: 'Explore', path: '/candidate/catalog' },
    ...(isAuthenticated ? [
      { label: 'My Learning', path: '/candidate/my-learning' },
      { label: 'Certificates', path: '/candidate/my-certificates' },
    ] : []),
  ];

  return (
    <nav style={S.nav}>
      <div style={S.container}>
        {/* Brand */}
        <div style={S.brand} onClick={() => navigate('/candidate/catalog')}>
          <div style={S.logoBox}>CL</div>
          <span style={S.brandText}>Coal Learns</span>
        </div>

        {/* Nav Links */}
        <div style={S.links}>
          {navLinks.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={isActive(path) ? S.linkActive : S.link}
            >
              {label}
              {isActive(path) && <span style={S.activeDot} />}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div style={S.actions}>
          {isAuthenticated ? (
            <>
              <div style={S.userChip}>
                <div style={S.avatar}>{(user?.email?.[0] || 'U').toUpperCase()}</div>
                <span style={S.userName}>{user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <button onClick={handleLogout} style={S.logoutBtn}>Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/candidate/login')} style={S.loginBtn}>Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: { background: '#1e293b', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 },
  container: { maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 },
  logoBox: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '13px', letterSpacing: '0.02em' },
  brandText: { fontSize: '17px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.01em' },
  links: { display: 'flex', gap: '0.25rem', alignItems: 'center' },
  link: { position: 'relative', padding: '0.375rem 0.875rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: '500', cursor: 'pointer', borderRadius: '6px', transition: 'color 0.15s, background 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  linkActive: { position: 'relative', padding: '0.375rem 0.875rem', background: 'rgba(99,102,241,0.12)', border: 'none', color: '#a5b4fc', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  activeDot: { width: '4px', height: '4px', borderRadius: '50%', background: '#6366f1', display: 'block' },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  userChip: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '99px', padding: '4px 12px 4px 4px' },
  avatar: { width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#cbd5e1' },
  loginBtn: { padding: '0.45rem 1.25rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  logoutBtn: { padding: '0.4rem 1rem', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
};
