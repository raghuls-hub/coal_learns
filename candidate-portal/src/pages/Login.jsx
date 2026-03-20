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
      navigate('/catalog');
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
            Don't have an account? <Link to="/register" style={S.link}>Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#0f172a' },

  // Left panel
  left: { flex: 1, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', position: 'relative', overflow: 'hidden' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '420px' },
  badge: { display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#a5b4fc', background: 'rgba(165,180,252,0.12)', border: '1px solid rgba(165,180,252,0.25)', borderRadius: '99px', padding: '4px 14px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  headline: { fontSize: '48px', fontWeight: '800', color: '#ffffff', lineHeight: '1.15', marginBottom: '1.5rem', letterSpacing: '-0.02em' },
  tagline: { fontSize: '17px', color: '#a5b4fc', lineHeight: '1.7', marginBottom: '2.5rem' },
  features: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  featureItem: { fontSize: '15px', color: '#c7d2fe', fontWeight: '500' },
  decCircle1: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '60px solid rgba(165,180,252,0.06)', bottom: '-150px', right: '-150px' },
  decCircle2: { position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', border: '40px solid rgba(165,180,252,0.08)', top: '-80px', left: '-80px' },

  // Right panel
  right: { width: '480px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', borderLeft: '1px solid #334155' },
  card: { width: '100%', maxWidth: '360px' },
  logoBox: { width: '44px', height: '44px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', marginBottom: '1.5rem' },
  title: { fontSize: '28px', fontWeight: '800', color: '#f1f5f9', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: '#64748b', marginBottom: '2rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.01em' },
  input: { padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', width: '100%' },
  error: { padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '8px', fontSize: '14px' },
  btn: { padding: '0.875rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.01em', marginTop: '0.5rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' },

  footer: { marginTop: '1.5rem', fontSize: '14px', color: '#94a3b8', textAlign: 'center' },
  link: { color: '#818cf8', textDecoration: 'none', fontWeight: '600' }
};
