import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function MyCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/certificates/my')
      .then(res => setCerts(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (cert) => {
    const token = localStorage.getItem('CANDIDATE_AUTH_TOKEN');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${base}/certificates/download/${cert.certificateId}?token=${token}`, '_blank');
  };

  if (loading) return (
    <div style={S.page}>
      <div style={S.grid}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 16 }} />)}</div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerOrb} />
        <div style={S.headerInner}>
          <span style={S.badge}>My Achievements</span>
          <h1 style={S.title}>My Certificates</h1>
          <p style={S.subtitle}>Your verified credentials — officially earned and forever yours.</p>
        </div>
      </div>

      <div style={S.body}>
        {certs.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>🏆</div>
            <h2 style={S.emptyTitle}>No certificates yet</h2>
            <p style={S.emptySub}>Complete all chapters in a course to earn your verified credential.</p>
            <button onClick={() => navigate('/candidate/my-learning')} style={S.emptyBtn}>Continue Learning</button>
          </div>
        ) : (
          <div style={S.grid}>
            {certs.map(cert => (
              <div key={cert._id} style={S.card}>
                <div style={S.goldBar} />
                <div style={S.cardHead}>
                  <span style={S.verifiedBadge}>✓ Verified Credential</span>
                  <span style={S.issuedDate}>
                    {new Date(cert.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div style={S.cardBody}>
                  <div style={S.ribbonIcon}>🎖️</div>
                  <h3 style={S.courseName}>{cert.courseName || 'Course Title Unavailable'}</h3>
                  <p style={S.instructorName}>Instructor: {cert.instructorName || 'Platform Instructor'}</p>
                  <p style={S.certId}>ID: {cert.certificateId}</p>
                </div>
                {cert.qrCodeData && (
                  <div style={S.qrWrap}>
                    <img src={cert.qrCodeData} alt="QR" style={S.qr} />
                    <span style={S.qrLabel}>Scan to verify</span>
                  </div>
                )}
                <div style={S.cardFoot}>
                  <button onClick={() => handleDownload(cert)} style={S.downloadBtn}>
                    ↓ Download Certificate PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)' },
  header: { position: 'relative', overflow: 'hidden', padding: '4rem 2rem 3.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' },
  headerOrb: { position: 'absolute', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 70%)', top: -100, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' },
  headerInner: { position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' },
  badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 99, padding: '4px 14px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.75rem' },
  subtitle: { fontSize: 16, color: 'var(--text-secondary)' },

  body: { maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' },
  empty: { textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border)' },
  emptyIcon: { fontSize: 56, marginBottom: '1.25rem' },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' },
  emptySub: { fontSize: 15, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.6 },
  emptyBtn: { padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  goldBar: { height: 3, background: 'linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b)' },
  cardHead: { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' },
  verifiedBadge: { fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 99, padding: '3px 10px' },
  issuedDate: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  cardBody: { padding: '1.5rem', flex: 1 },
  ribbonIcon: { fontSize: 32, marginBottom: '0.75rem' },
  courseName: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.4 },
  instructorName: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: '0.5rem' },
  certId: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.5rem' },
  qrWrap: { padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  qr: { width: 88, height: 88, borderRadius: 8, border: '1px solid var(--border)' },
  qrLabel: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 },
  cardFoot: { padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' },
  downloadBtn: { width: '100%', padding: '0.7rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};
