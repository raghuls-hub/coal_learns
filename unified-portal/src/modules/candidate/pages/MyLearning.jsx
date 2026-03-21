import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { WrenchIcon, AlertCircleIcon } from '../components/Icons';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [deletedPopup, setDeletedPopup] = useState(false); // popup for deleted course
  const [maintenancePopup, setMaintenancePopup] = useState(false); // popup for unpublished course
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollRes, certRes] = await Promise.all([
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/certificates/my')
      ]);
      setEnrollments(enrollRes.data.data || []);
      setCertificates(certRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCertificate = async (courseId) => {
    if (!courseId) return;
    setClaiming(courseId);
    try {
      const res = await apiClient.post('/certificates/claim', { courseId });
      if (res.data.success) {
        alert('Certificate Claimed Successfully!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to claim certificate');
    } finally {
      setClaiming(null);
    }
  };

  const handleReviewCourse = (enrollment) => {
    const isDeleted = !enrollment.course;
    const isUnpublished = enrollment.course && !enrollment.course?.settings?.isPublished;

    if (isDeleted) {
      setDeletedPopup(true);
      return;
    }

    if (isUnpublished) {
      setMaintenancePopup(true);
      return;
    }
    
    // Always navigate in the same tab as requested
    navigate(`/candidate/learning/${enrollment._id}?enrollmentId=${enrollment._id}`);
  };

  if (loading) return <div style={styles.loading}>Loading your courses...</div>;

  return (
    <div style={styles.container}>
      {/* Maintenance Popup */}
      {maintenancePopup && (
        <div style={styles.overlay} onClick={() => setMaintenancePopup(false)}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>
            <div style={styles.popupIcon}><WrenchIcon size={40} color='#6366f1' /></div>
            <h3 style={styles.popupTitle}>Planned Maintenance</h3>
            <p style={styles.popupMsg}>
              The course is under maintenance. Please check back later.
            </p>
            <button onClick={() => setMaintenancePopup(false)} style={styles.popupBtn}>Got it</button>
          </div>
        </div>
      )}

      {/* Deleted Course Popup */}
      {deletedPopup && (
        <div style={styles.overlay} onClick={() => setDeletedPopup(false)}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>
            <div style={styles.popupIcon}><AlertCircleIcon size={40} color='#f87171' /></div>
            <h3 style={styles.popupTitle}>Course No Longer Available</h3>
            <p style={styles.popupMsg}>
              This course has been removed by the mentor. Your progress and certificates are safely preserved.
            </p>
            <button onClick={() => setDeletedPopup(false)} style={styles.popupBtn}>Got it</button>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Learning</h1>
          <p style={styles.subtitle}>Continue where you left off</p>
        </div>
        <button onClick={() => navigate('/candidate/catalog')} style={styles.browseBtn}>
          Browse More Courses
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div style={styles.empty}>
          <h3>No courses yet</h3>
          <p>Start learning by enrolling in a course</p>
          <button onClick={() => navigate('/candidate/catalog')} style={styles.emptyBtn}>
            Explore Courses
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {enrollments.map(enrollment => {
            // Prefer live course data, fall back to snapshot
            const courseData = enrollment.course || enrollment.courseSnapshot || {};
            const isDeleted = !enrollment.course;
            const isUnpublished = enrollment.course && !enrollment.course?.settings?.isPublished;
            const isCompleted = enrollment.progress === 100 || enrollment.status === 'completed';

            // Match certificate by stored courseId or the enrollment id
            const cert = certificates.find(c =>
              (c.enrollment && c.enrollment === enrollment._id) ||
              (c.course && enrollment.course && c.course === enrollment.course._id)
            );
            const isClaimed = !!cert;
            const courseId = enrollment.course ? (enrollment.course._id || enrollment.course) : null;

            return (
              <div key={enrollment._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.courseTitle}>
                    {courseData.title || 'Unknown Course'}
                  </h3>
                  <div style={styles.badges}>
                    {isDeleted && (
                      <span style={styles.archivedBadge}>Removed</span>
                    )}
                    <span style={{
                      ...styles.statusBadge,
                      background: isCompleted ? '#C6F6D5' : '#EBF8FF',
                      color: isCompleted ? '#22543D' : '#2C5282'
                    }}>
                      {isCompleted ? 'Completed' : (enrollment.status || 'Active')}
                    </span>
                  </div>
                </div>

                <p style={styles.courseDesc}>
                  {courseData.description || 'No description available.'}
                </p>

                {courseData.instructorName && (
                  <p style={styles.instructor}>Instructor: {courseData.instructorName}</p>
                )}

                <div style={styles.progressSection}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${enrollment.progress || 0}%` }} />
                  </div>
                  <span style={styles.progressText}>{enrollment.progress || 0}% Complete</span>
                </div>

                <div style={styles.actions}>
                  {/* Always show Review/Continue button — popup if deleted */}
                  <button
                    onClick={() => handleReviewCourse(enrollment)}
                    style={{
                      ...styles.continueBtn,
                      opacity: (isDeleted || isUnpublished) ? 0.6 : 1,
                      cursor: (isDeleted || isUnpublished) ? 'not-allowed' : 'pointer'
                    }}
                    title={isDeleted ? 'Course is deleted' : isUnpublished ? 'Course is under maintenance' : ''}
                  >
                    {isDeleted ? 'Course is deleted' : (isCompleted ? 'Review Course' : 'Continue Learning')}
                  </button>

                  {isCompleted && (
                    isClaimed ? (
                      <button
                        onClick={() => navigate('/candidate/my-certificates')}
                        style={styles.viewCertBtn}
                      >
                        View Certificate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaimCertificate(courseId)}
                        disabled={claiming === courseId || !courseId}
                        style={{
                          ...styles.claimBtn,
                          opacity: (!courseId || claiming === courseId) ? 0.65 : 1,
                          cursor: !courseId ? 'wait' : 'pointer',
                        }}
                        title={!courseId ? 'Claiming via saved course data...' : 'Claim your certificate'}
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

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px', color: 'var(--text-secondary)', background: 'var(--bg-base)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-dim)' },
  title: { fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: 'var(--text-secondary)', marginTop: '0.4rem' },
  browseBtn: { padding: '0.65rem 1.5rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--accent-glow)' },
  empty: { textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-sidebar)', borderRadius: '16px', border: '1px dashed var(--border-dim)' },
  emptyBtn: { marginTop: '1.5rem', padding: '0.875rem 2rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },
  card: { background: 'var(--bg-sidebar)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
  courseTitle: { fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', flex: 1, lineHeight: '1.4' },
  badges: { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 },
  archivedBadge: { fontSize: '11px', fontWeight: '700', color: '#f87171', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(239,68,68,0.25)' },
  statusBadge: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', textTransform: 'capitalize' },
  courseDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 },
  instructor: { fontSize: '13px', color: '#94a3b8', fontWeight: '500', margin: 0 },
  progressSection: { display: 'flex', flexDirection: 'column', gap: '4px' },
  progressBar: { width: '100%', height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)', transition: 'width 0.3s', borderRadius: '3px' },
  progressText: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' },
  continueBtn: { flex: 1, padding: '0.65rem', background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  claimBtn: { flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
  viewCertBtn: { flex: 1, padding: '0.65rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  popup: { background: 'var(--bg-sidebar)', borderRadius: '16px', padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)' },
  popupIcon: { fontSize: '48px', marginBottom: '1rem' },
  popupTitle: { fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' },
  popupMsg: { fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' },
  popupBtn: { padding: '0.75rem 2rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' },
};

