import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={S.container}>
      <h1 style={S.title}>404 - Page Not Found</h1>
      <p style={S.text}>The link is broken or the portal is being refactored.</p>
      <p style={S.sub}>Redirecting you to the Landing Page in 3 seconds...</p>
      <button style={S.btn} onClick={() => navigate('/')}>Take Me Back Now</button>
    </div>
  );
}

const S = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  title: { fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: '#38BDF8' },
  text: { fontSize: '1.25rem', color: '#94A3B8', marginBottom: '2rem' },
  sub: { fontSize: '1rem', color: '#475569', marginBottom: '2.5rem' },
  btn: {
    backgroundColor: 'transparent',
    border: '1px solid #38BDF8',
    color: '#38BDF8',
    padding: '0.75rem 2rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
