import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.brand} onClick={() => navigate('/catalog')}>
          <span style={styles.logo}>🎓</span>
          <span style={styles.brandText}>LMS Learning</span>
        </div>

        <div style={styles.links}>
          <button
            onClick={() => navigate('/catalog')}
            style={isActive('/catalog') ? styles.linkActive : styles.link}
          >
            Explore
          </button>

          {isAuthenticated && (
            <button
              onClick={() => navigate('/my-learning')}
              style={isActive('/my-learning') ? styles.linkActive : styles.link}
            >
              My Learning
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={() => navigate('/my-certificates')}
              style={isActive('/my-certificates') ? styles.linkActive : styles.link}
            >
              Start Certificates
            </button>
          )}
        </div>

        <div style={styles.actions}>
          {isAuthenticated ? (
            <>
              <span style={styles.userInfo}>{user?.username || user?.email}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={styles.loginBtn}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  logo: {
    fontSize: '28px',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  links: {
    display: 'flex',
    gap: '1rem',
  },
  link: {
    padding: '0.5rem 1rem',
    background: 'none',
    border: 'none',
    color: '#4a5568',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  linkActive: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '500',
  },
  loginBtn: {
    padding: '0.5rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '0.5rem 1.5rem',
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
