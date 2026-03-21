import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        role: 'mentor',
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      });
      navigate('/tutor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.leftContent}>
          <div style={S.badge}>Teach With Us</div>
          <h1 style={S.headline}>Empower<br />Future Innovators</h1>
          <p style={S.tagline}>Join our network of expert mentors. Share your knowledge, create impactful courses, and build your professional brand.</p>
        </div>
        <div style={S.decCircle1} />
        <div style={S.decCircle2} />
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <div style={S.logoBox}>CL</div>
          <h2 style={S.title}>Tutor Registration</h2>
          <p style={S.subtitle}>Create your mentor account</p>

          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.row}>
              <div style={S.group}>
                <label style={S.label}>First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  style={S.input}
                  placeholder="John"
                />
              </div>
              <div style={S.group}>
                <label style={S.label}>Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  style={S.input}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div style={S.group}>
              <label style={S.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={S.input}
                placeholder="john@example.com"
              />
            </div>

            <div style={S.group}>
              <label style={S.label}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={S.input}
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            <div style={S.group}>
              <label style={S.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={S.input}
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {error && <div style={S.error}>{error}</div>}

            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? 'Creating Account...' : 'Register as Mentor'}
            </button>
          </form>

          <p style={S.footer}>
            Already have an account? <Link to="/tutor/login" style={S.link}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: 'var(--bg-base)' },
  left: { flex: 1, background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', padding: '4rem', position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border-dim)' },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: '420px' },
  badge: { display: 'inline-block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '99px', padding: '4px 14px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  headline: { fontSize: '48px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.15', marginBottom: '1.5rem', letterSpacing: '-0.02em' },
  tagline: { fontSize: '17px', color: 'var(--text-secondary)', lineHeight: '1.7' },
  decCircle1: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', border: '60px solid rgba(56, 189, 248, 0.03)', bottom: '-150px', right: '-150px' },
  decCircle2: { position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', border: '40px solid rgba(56, 189, 248, 0.05)', top: '-80px', left: '-80px' },
  right: { width: '520px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
  card: { width: '100%', maxWidth: '400px' },
  logoBox: { width: '44px', height: '44px', background: 'var(--accent-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', marginBottom: '1.5rem' },
  title: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '2.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: { display: 'flex', gap: '1rem' },
  group: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.01em' },
  input: { padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-dim)', background: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' },
  error: { padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '8px', fontSize: '14px' },
  btn: { padding: '0.875rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.01em', marginTop: '0.5rem', boxShadow: 'var(--accent-glow)' },
  footer: { marginTop: '1.5rem', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }
};
