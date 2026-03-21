import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={S.container}>
      <header style={S.header}>
        <h1 style={S.title}>LMS Unified Portal</h1>
        <p style={S.subtitle}>Select your gateway to proceed to the learning management system.</p>
      </header>

      <div style={S.grid}>
        <div style={S.card} onClick={() => navigate('/candidate')}>
          <div style={S.iconBox}>🎓</div>
          <h2 style={S.cardTitle}>Candidate Portal</h2>
          <p style={S.cardDesc}>Access your courses, track your progress, and earn certificates.</p>
          <button style={S.btn}>Enter as Candidate</button>
        </div>

        <div style={S.card} onClick={() => navigate('/tutor')}>
          <div style={S.iconBox}>👨‍🏫</div>
          <h2 style={S.cardTitle}>Tutor Portal</h2>
          <p style={S.cardDesc}>Manage your courses, students, and curriculum effortlessly.</p>
          <button style={S.btn}>Enter as Tutor</button>
        </div>
      </div>

      <footer style={S.footer}>
        © 2026 Coal Learns. Powered by Antigravity.
      </footer>
    </div>
  );
}

const S = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '4rem',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '800',
    marginBottom: '1rem',
    background: 'linear-gradient(to right, #38BDF8, #818CF8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#94A3B8',
  },
  grid: {
    display: 'flex',
    gap: '2rem',
    width: '100%',
    maxWidth: '900px',
  },
  card: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: '3rem 2rem',
    borderRadius: '1.5rem',
    border: '1px solid #334155',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  iconBox: {
    fontSize: '4rem',
    marginBottom: '2rem',
  },
  cardTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '1rem',
  },
  cardDesc: {
    color: '#94A3B8',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  btn: {
    marginTop: 'auto',
    backgroundColor: '#38BDF8',
    color: '#0F172A',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
  },
  footer: {
    marginTop: '5rem',
    color: '#475569',
    fontSize: '0.875rem',
  }
};
