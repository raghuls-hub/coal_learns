import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [modal, setModal] = useState(null); // { type: 'deleted' | 'maintenance' }
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiClient.get('/enrollments/my-courses'),
      apiClient.get('/certificates/my'),
    ]).then(([eRes, cRes]) => {
      setEnrollments(eRes.data.data || []);
      setCertificates(cRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleClaim = async (courseId) => {
    if (!courseId) return;
    setClaiming(courseId);
    try {
      await apiClient.post('/certificates/claim', { courseId });
      const [eRes, cRes] = await Promise.all([apiClient.get('/enrollments/my-courses'), apiClient.get('/certificates/my')]);
      setEnrollments(eRes.data.data || []);
      setCertificates(cRes.data.data || []);
    } catch {}
    finally { setClaiming(null); }
  };

  const handleContinue = (enrollment) => {
    if (!enrollment.course) return setModal('deleted');
    if (!enrollment.course?.settings?.isPublished) return setModal('maintenance');
    navigate(`/candidate/learning/${enrollment._id}`);
  };

  if (loading) return (
    <div style={S.page}>
      <div style={S.grid}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}</div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Modal */}
      {modal && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: '1rem' }}>{modal === 'deleted' ? '🗑️' : '🔧'}</div>
            <h3 style={S.modalTitle}>{modal === 'deleted' ? 'Course Removed' : 'Under Maintenance'}</h3>
            <p style={S.modalMsg}>
              {modal === 'deleted'
                ? 'This course has been removed by the mentor. Your progress and certificates are safely preserved.'
                : 'This course is temporarily under maintenance. Please check back later.'}
            </p>
            <button onClick={() => setModal(null)} style={S.modalBtn}>Got it</button>
          </div>
        </div>
      )}

      <div style={S.header}>
        <div>
          <h1 style={S.title}>My Learning</h1>
          <p style={S.subtitle}>Continue where you left off</p>
        </div>
        <button onClick={() => navigate('/candidate/catalog')} style={S.browseBtn}>Browse Courses</button>
      </div>

      {enrollments.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>📚</div>
          <h3 style={S.emptyTitle}>No courses yet</h3>
          <p style={S.emptySub}>Start learning by enrolling in a course</p>
          <button onClick={() => navigate('/candidate/catalog')} style={S.emptyBtn}>Explore Courses</button>
        </div>
      ) : (
        <div style={S.grid}>
          {enrollments.map(en => {
            const data = en.course || en.courseSnapshot || {};
            const isDeleted = !en.course;
            const isUnpublished = en.course && !en.course?.settings?.isPublished;
            const isCompleted = en.progress === 100 || en.status === 'completed';
            const cert = certificates.find(c => (c.course && en.course && c.course === en.course._id) || c.enrollment === en._id);
            const courseId = en.course?._id || en.course;

            return (
              <div key={en._id} style={S.card}>
                <div style={S.cardTop}>
                  <div style={S.cardTitleRow}>
                    <h3 style={S.courseTitle}>{data.title || 'Unknown Course'}</h3>
                    <div style={S.badges}>
                      {isDeleted && <span style={S.removedBadge}>Removed</span>}
                      <span style={{ ...S.statusBadge, background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: isCompleted ? '#10b981' : '#818cf8', border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                        {isCompleted ? 'Completed' : en.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  <p style={S.courseDesc}>{data.description || 'No description available.'}</p>
                </div>

                <div style={S.progressSection}>
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: `${en.progress || 0}%` }} />
                  </div>
                  <span style={S.progressText}>{en.progress || 0}% complete</span>
                </div>

                <div style={S.actions}>
                  <button
                    onClick={() => handleContinue(en)}
                    style={{ ...S.continueBtn, opacity: (isDeleted || isUnpublished) ? 0.5 : 1 }}
                  >
                    {isDeleted ? 'Course Removed' : isCompleted ? 'Review Course' : 'Continue Learning'}
                  </button>
                  {isCompleted && (
                    cert ? (
                      <button onClick={() => navigate('/candidate/my-certificates')} style={S.certBtn}>
                        View Certificate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaim(courseId)}
                        disabled={claiming === courseId || !courseId}
                        style={S.claimBtn}
                      >
                        {claiming === courseId ? 'Claiming...' : 'Claim Certificate'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem', minHeight: '80vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' },
  title: { fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 },
  browseBtn: { padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  empty: { textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border)' },
  emptyIcon: { fontSize: 48, marginBottom: '1rem' },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' },
  emptySub: { fontSize: 15, color: 'var(--text-secondary)', marginBottom: '1.5rem' },
  emptyBtn: { padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardTop: { flex: 1 },
  cardTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' },
  courseTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 },
  badges: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 },
  removedBadge: { fontSize: 11, fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, padding: '2px 8px' },
  statusBadge: { fontSize: 11, fontWeight: 600, borderRadius: 99, padding: '2px 8px', textTransform: 'capitalize' },
  courseDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 },

  progressSection: { display: 'flex', flexDirection: 'column', gap: 6 },
  progressBar: { height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #22d3ee)', borderRadius: 99, transition: 'width 0.4s ease' },
  progressText: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },

  actions: { display: 'flex', gap: '0.75rem' },
  continueBtn: { flex: 1, padding: '0.65rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  claimBtn: { flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  certBtn: { flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '2.5rem', maxWidth: 400, width: '90%', textAlign: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' },
  modalMsg: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' },
  modalBtn: { padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
};
