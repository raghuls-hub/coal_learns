import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/candidate/catalog');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Left decorative panel */}
      <div style={S.left}>
        <div style={S.leftContent}>
          <div style={S.badge}>Professional Learning</div>
          <h1 style={S.headline}>Advance Your<br />Skills Today</h1>
          <p style={S.tagline}>Access world-class courses, earn verified certificates, and build the career you deserve.</p>
          <div style={S.features}>
            {['Structured Courses', 'Verified Certificates', 'Learn at Your Pace'].map(f => (
              <div key={f} style={S.featureItem}>{f}</div>
            ))}
          </div>
        </div>
        {/* Decorative circles */}
        <div style={S.decCircle1} />
        <div style={S.decCircle2} />
      </div>

      {/* Right login panel */}
      <div style={S.right}>
        <div style={S.card}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '13px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              marginBottom: '1.5rem',
              padding: 0
            }}
          >
            ← Back to Home
          </button>
          <div style={S.logoBox}>CL</div>
          <h2 style={S.title}>Welcome back</h2>
          <p style={S.subtitle}>Sign in to your Coal Learns account</p>

          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.group}>
              <label style={S.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={S.input}
                placeholder="you@example.com"
              />
            </div>

            <div style={S.group}>
              <label style={S.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={S.input}
                placeholder="••••••••"
              />
            </div>

            {error && <div style={S.error}>{error}</div>}

            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={S.footer}>
            Don't have an account? <Link to="/candidate/register" style={S.link}>Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: 'var(--bg-base)' },

  // Left panel
  left: { flex: 1, background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border-dim)' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '420px' },
  badge: { display: 'inline-block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '99px', padding: '4px 14px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  headline: { fontSize: '48px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.15', marginBottom: '1.5rem', letterSpacing: '-0.02em' },
  tagline: { fontSize: '17px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2.5rem' },
  features: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  featureItem: { fontSize: '15px', color: 'var(--accent-primary)', fontWeight: '500' },
  decCircle1: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '60px solid rgba(56, 189, 248, 0.03)', bottom: '-150px', right: '-150px' },
  decCircle2: { position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', border: '40px solid rgba(56, 189, 248, 0.05)', top: '-80px', left: '-80px' },

  // Right panel
  right: { width: '480px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
  card: { width: '100%', maxWidth: '360px' },
  logoBox: { width: '44px', height: '44px', background: 'var(--accent-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', marginBottom: '1.5rem' },
  title: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '2rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.01em' },
  input: { padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-dim)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', width: '100%' },
  error: { padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '8px', fontSize: '14px' },
  btn: { padding: '0.875rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.01em', marginTop: '0.5rem', boxShadow: 'var(--accent-glow)' },

  footer: { marginTop: '1.5rem', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }
};
