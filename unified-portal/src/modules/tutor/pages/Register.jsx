import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, profile: { firstName: form.firstName, lastName: form.lastName } });
      navigate('/tutor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.orb1} /><div style={S.orb2} />
      <div style={S.left}>
        <button onClick={() => navigate('/')} style={S.backBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Home
        </button>
        <div style={S.leftContent}>
          <div style={S.leftBadge}>Become a Mentor</div>
          <h1 style={S.leftTitle}>Share Your<br /><span className="grad-text">Expertise</span></h1>
          <p style={S.leftSub}>Join our platform and start creating courses that impact thousands of learners.</p>
        </div>
      </div>
      <div style={S.right}>
        <div style={S.card}>
          <div style={S.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={S.title}>Create Mentor Account</h2>
          <p style={S.subtitle}>Join Coal Learns as a mentor</p>
          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.row}>
              <div style={S.group}>
                <label style={S.label}>First Name</label>
                <input value={form.firstName} onChange={set('firstName')} required style={S.input} placeholder="Jane" />
              </div>
              <div style={S.group}>
                <label style={S.label}>Last Name</label>
                <input value={form.lastName} onChange={set('lastName')} required style={S.input} placeholder="Smith" />
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>Email Address</label>
              <input type="email" value={form.email} onChange={set('email')} required style={S.input} placeholder="jane@example.com" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={8} style={S.input} placeholder="Min. 8 characters" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required style={S.input} placeholder="••••••••" />
            </div>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? 'Creating Account...' : 'Create Mentor Account'}
            </button>
          </form>
          <p style={S.footer}>Already a mentor? <Link to="/tutor/login" style={S.link}>Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' },
  orb1: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' },
  orb2: { position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', bottom: -100, right: -100, pointerEvents: 'none' },
  left: { flex: 1, display: 'flex', flexDirection: 'column', padding: '2.5rem 4rem', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 },
  backBtn: { position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0.4rem 0.75rem', borderRadius: 8 },
  leftContent: { maxWidth: 440 },
  leftBadge: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 99, padding: '4px 12px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  leftTitle: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: 'var(--text-primary)' },
  leftSub: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 },
  right: { width: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2.5rem', position: 'relative', zIndex: 1 },
  card: { width: '100%', maxWidth: 420 },
  logoMark: { width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #22d3ee, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' },
  title: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%' },
  error: { padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, fontSize: 13 },
  btn: { padding: '0.875rem', background: 'linear-gradient(135deg, #22d3ee, #6366f1)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' },
  footer: { marginTop: '1.5rem', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: '#22d3ee', fontWeight: 600 },
};
