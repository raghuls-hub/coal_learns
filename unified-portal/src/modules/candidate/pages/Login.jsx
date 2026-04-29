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
      <div style={S.orb1} /><div style={S.orb2} />

      {/* Left panel */}
      <div style={S.left}>
        <button onClick={() => navigate('/')} style={S.backBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Home
        </button>
        <div style={S.leftContent}>
          <div style={S.leftBadge}>Candidate Portal</div>
          <h1 style={S.leftTitle}>Learn from the<br /><span className="grad-text">Best Mentors</span></h1>
          <p style={S.leftSub}>Access structured courses, track your progress, and earn certificates that matter.</p>
          <div style={S.features}>
            {['Structured learning paths', 'Progress tracking & analytics', 'Verified PDF certificates', 'AI-powered learning assistant'].map(f => (
              <div key={f} style={S.feature}>
                <div style={S.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={S.right}>
        <div style={S.card}>
          <div style={S.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={S.title}>Welcome back</h2>
          <p style={S.subtitle}>Sign in to your Coal Learns account</p>

          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.group}>
              <label style={S.label}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={S.input} placeholder="you@example.com" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={S.input} placeholder="••••••••" />
            </div>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? <span style={S.spinner} /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={S.footer}>
            Don't have an account?{' '}
            <Link to="/candidate/register" style={S.link}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' },
  orb1: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' },
  orb2: { position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', bottom: -100, right: -100, pointerEvents: 'none' },

  left: { flex: 1, display: 'flex', flexDirection: 'column', padding: '2.5rem 4rem', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 },
  backBtn: { position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0.4rem 0.75rem', borderRadius: 8 },
  leftContent: { maxWidth: 440 },
  leftBadge: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 99, padding: '4px 12px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  leftTitle: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: 'var(--text-primary)' },
  leftSub: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem' },
  features: { display: 'flex', flexDirection: 'column', gap: 14 },
  feature: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 },
  featureDot: { width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', flexShrink: 0 },

  right: { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2.5rem', position: 'relative', zIndex: 1 },
  card: { width: '100%', maxWidth: 380 },
  logoMark: { width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' },
  title: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: '2rem' },

  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', width: '100%', transition: 'border-color 0.2s' },
  error: { padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, fontSize: 13 },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.875rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' },

  footer: { marginTop: '1.5rem', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: '#818cf8', fontWeight: 600 },
};
