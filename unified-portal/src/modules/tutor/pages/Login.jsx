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
      navigate('/tutor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
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
        <div style={styles.header}>
          <h1 style={styles.title}>Tutor Portal</h1>
          <p style={styles.subtitle}>Create and manage your courses</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="name@company.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={{ marginBottom: '1rem' }}>Already have a mentor account?</p>
          <Link to="/tutor/register" style={styles.link}>Register as Tutor</Link>
          <p style={{ marginTop: '2rem', fontSize: '12px' }}>Coal Learns for Mentors</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '1rem' },
  card: { background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-dim)', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  title: { fontSize: '28px', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' },
  input: { padding: '0.75rem 1rem', background: 'var(--bg-base)', border: '1px solid var(--border-dim)', borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none' },
  button: { padding: '0.875rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '0.5rem', boxShadow: 'var(--accent-glow)' },
  error: { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '12px', fontSize: '13px', marginBottom: '1.5rem', border: '1px solid var(--error)', textAlign: 'center' },
  footer: { marginTop: '2.5rem', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' },
  link: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }
};
