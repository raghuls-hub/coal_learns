import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api';

export default function CertificateVerify() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get(`/certificates/${certificateId}`)
      .then(res => { if (res.data.success) setData(res.data.data); else setError('Invalid certificate'); })
      .catch(() => setError('Certificate not found or invalid'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <div style={S.page}>
      <div style={S.orb} />
      <div style={S.card}>
        <div style={S.logoMark}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Verifying certificate…</div>
        ) : error ? (
          <div style={S.errorState}>
            <div style={S.errorIcon}>✕</div>
            <h2 style={{ color: '#f87171', fontSize: 22, fontWeight: 800, marginBottom: '0.5rem' }}>Invalid Certificate</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{error}</p>
          </div>
        ) : (
          <div style={S.successState}>
            <div style={S.successIcon}>✓</div>
            <h2 style={S.successTitle}>Verified Certificate</h2>
            <p style={S.successSub}>This certificate is authentic and was issued by Coal Learns.</p>
            <div style={S.details}>
              {[
                ['Recipient', `${data.user?.profile?.firstName} ${data.user?.profile?.lastName}`],
                ['Course', data.courseName || data.course?.title || 'N/A'],
                ['Instructor', data.instructorName || 'Platform Instructor'],
                ['Issue Date', new Date(data.issueDate).toLocaleDateString()],
                ['Certificate ID', data.certificateId],
              ].map(([label, value]) => (
                <div key={label} style={S.row}>
                  <span style={S.rowLabel}>{label}</span>
                  <span style={label === 'Certificate ID' ? S.rowMono : S.rowValue}>{value}</span>
                </div>
              ))}
            </div>
            <p style={S.footer}>Coal Learns Verification System · Powered by Antigravity</p>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' },
  orb: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: -150, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '3rem', maxWidth: 500, width: '100%', position: 'relative', zIndex: 1 },
  logoMark: { width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' },
  errorState: { textAlign: 'center' },
  errorIcon: { width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#f87171', margin: '0 auto 1.5rem' },
  successState: { textAlign: 'center' },
  successIcon: { width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#10b981', margin: '0 auto 1.5rem' },
  successTitle: { fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  successSub: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: '2rem' },
  details: { textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', paddingBottom: '0.875rem', marginBottom: '0.875rem', borderBottom: '1px solid var(--border)' },
  rowLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 },
  rowValue: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' },
  rowMono: { fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' },
  footer: { fontSize: 12, color: 'var(--text-muted)' },
};
