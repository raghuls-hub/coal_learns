import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { AwardIcon, RibbonIcon, ArrowRightIcon } from '../components/Icons';

export default function MyCertificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    try {
      const res = await apiClient.get('/certificates/my');
      setCertificates(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (cert) => {
    const token = localStorage.getItem('token');
    window.open(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/certificates/download/${cert.certificateId}?token=${token}`,
      '_blank'
    );
  };

  if (loading) return <div style={S.loading}>Loading certificates…</div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <span style={S.badge}>My Achievements</span>
          <h1 style={S.title}>My Certificates</h1>
          <p style={S.subtitle}>Your verified credentials — officially earned and forever yours.</p>
        </div>
      </div>

      <div style={S.body}>
        {certificates.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIconWrap}>
              <AwardIcon size={56} color='#334155' />
            </div>
            <h2 style={S.emptyTitle}>No certificates yet</h2>
            <p style={S.emptySub}>Complete all chapters in a course to earn your certified credential.</p>
            <button onClick={() => navigate('/my-learning')} style={S.goBtn}>
              Continue Learning <ArrowRightIcon size={16} color="white" style={{ marginLeft: '6px' }} />
            </button>
          </div>
        ) : (
          <div style={S.grid}>
            {certificates.map(cert => (
              <div key={cert._id} style={S.card}>
                {/* Gold top bar */}
                <div style={S.cardGoldBar} />

                <div style={S.cardHeader}>
                  <div style={S.verifiedBadge}>Verified Credential</div>
                  <span style={S.issuedDate}>
                    {new Date(cert.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div style={S.cardBody}>
                  <div style={S.certIcon}>
                    <RibbonIcon size={32} color='#fbbf24' />
                  </div>
                  <h3 style={S.courseName}>{cert.courseName || 'Course Title Unavailable'}</h3>
                  <p style={S.instructorName}>Instructor: {cert.instructorName || 'Platform Instructor'}</p>
                  <p style={S.certId}>ID: {cert.certificateId}</p>
                </div>

                {cert.qrCodeData && (
                  <div style={S.qrWrap}>
                    <img src={cert.qrCodeData} alt="QR Code" style={S.qr} />
                    <span style={S.qrLabel}>Scan to verify authenticity</span>
                  </div>
                )}

                <div style={S.cardFooter}>
                  <button onClick={() => handleDownload(cert)} style={S.downloadBtn}>
                    Download Certificate PDF
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
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif" },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#64748b', background: '#0f172a', fontSize: '18px' },

  header: { background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', padding: '3.5rem 2rem 3rem', borderBottom: '1px solid #1e293b', textAlign: 'center' },
  headerInner: { maxWidth: '600px', margin: '0 auto' },
  badge: { display: 'inline-block', fontSize: '11px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '99px', padding: '4px 14px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: '38px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 0.75rem', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '16px', color: '#64748b' },

  body: { maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' },

  empty: { textAlign: 'center', padding: '5rem 2rem', background: '#1e293b', borderRadius: '20px', border: '1px dashed #334155' },
  emptyIconWrap: { fontSize: '56px', marginBottom: '1.5rem' },
  emptyTitle: { fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.75rem' },
  emptySub: { fontSize: '15px', color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: '1.6' },
  goBtn: { padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' },
  card: { background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' },
  cardGoldBar: { height: '4px', background: 'linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b)' },

  cardHeader: { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  verifiedBadge: { fontSize: '11px', fontWeight: '700', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '99px', padding: '3px 10px' },
  issuedDate: { fontSize: '12px', color: '#64748b', fontWeight: '500' },

  cardBody: { padding: '1.5rem', flex: 1 },
  certIcon: { fontSize: '32px', marginBottom: '0.75rem' },
  courseName: { fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.4rem', lineHeight: '1.4' },
  instructorName: { fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' },
  certId: { fontSize: '11px', color: '#475569', fontFamily: 'monospace', marginTop: '0.5rem' },

  qrWrap: { padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  qr: { width: '90px', height: '90px', borderRadius: '8px', border: '1px solid #334155' },
  qrLabel: { fontSize: '10px', color: '#475569', fontWeight: '500' },

  cardFooter: { padding: '1rem 1.5rem', borderTop: '1px solid #334155' },
  downloadBtn: { width: '100%', padding: '0.7rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
};
