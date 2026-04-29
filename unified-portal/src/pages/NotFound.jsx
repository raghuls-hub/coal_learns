import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: 80, fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: '1rem' }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Page Not Found</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Go Home
      </button>
    </div>
  );
}
