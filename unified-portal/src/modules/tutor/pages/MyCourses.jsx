import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function resolveCover(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function CourseCoverThumb({ course }) {
  const [err, setErr] = useState(false);
  const src = resolveCover(course.coverImage || course.thumbnail);
  const hue = (course.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (src && !err) {
    return <img src={src} alt={course.title} onError={() => setErr(true)} style={S.coverImg} />;
  }
  return (
    <div style={{ ...S.coverPlaceholder, background: `linear-gradient(135deg, hsl(${hue},55%,14%) 0%, hsl(${(hue + 40) % 360},45%,9%) 100%)` }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity="0.3">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = () => {
    apiClient.get('/courses')
      .then(res => setCourses(res.data.data?.courses || res.data.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const togglePublish = async (id, e) => {
    e.stopPropagation();
    try { await apiClient.put(`/courses/${id}/publish`); fetchCourses(); } catch {}
  };

  const deleteCourse = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this course? Students retain their progress and certificates.')) return;
    try { await apiClient.delete(`/courses/${id}`); fetchCourses(); } catch {}
  };

  if (loading) return (
    <div style={S.page}>
      <div style={S.grid}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 16 }} />)}</div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>My Courses</h1>
          <p style={S.subtitle}>Manage your course catalog</p>
        </div>
        <button onClick={() => navigate('/tutor/create-course')} style={S.createBtn}>
          + Create New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIconWrap}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={S.emptyTitle}>No courses yet</h3>
          <p style={S.emptySub}>Create your first course to get started!</p>
          <button onClick={() => navigate('/tutor/create-course')} style={S.createBtn}>Create Course</button>
        </div>
      ) : (
        <div style={S.grid}>
          {courses.map(course => {
            const isPublished = course.settings?.isPublished;
            const isArchived  = course.settings?.isArchived;
            const statusBg    = isPublished ? 'rgba(16,185,129,0.1)'  : isArchived ? 'rgba(245,158,11,0.1)'  : 'rgba(148,163,184,0.08)';
            const statusColor = isPublished ? '#10b981'               : isArchived ? '#f59e0b'               : 'var(--text-muted)';
            const statusBdr   = isPublished ? 'rgba(16,185,129,0.2)'  : isArchived ? 'rgba(245,158,11,0.2)'  : 'var(--border)';
            const statusLabel = isPublished ? 'Published'             : isArchived ? 'Archived'              : 'Draft';

            return (
              <div key={course._id} style={S.card} onClick={() => navigate(`/tutor/course/${course._id}`)}>
                {/* Cover */}
                <div style={S.coverWrap}>
                  <CourseCoverThumb course={course} />
                  <span style={{ ...S.statusPill, background: statusBg, color: statusColor, border: `1px solid ${statusBdr}` }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Body */}
                <div style={S.cardBody}>
                  <h3 style={S.courseTitle}>{course.title}</h3>
                  <p style={S.desc}>{course.description}</p>
                  <div style={S.metaRow}>
                    <span style={S.metaTag}>{course.category}</span>
                    <span style={S.metaTag}>{course.level}</span>
                    <span style={{ ...S.metaTag, color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>
                      ₹{course.pricing?.amount || 0}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={S.statsRow}>
                  {[
                    [course.stats?.enrollmentCount || 0, 'Students'],
                    [course.modules?.length || 0, 'Modules'],
                    [`₹${((course.pricing?.amount || 0) * (course.stats?.enrollmentCount || 0)).toFixed(0)}`, 'Revenue'],
                  ].map(([v, l]) => (
                    <div key={l} style={S.statItem}>
                      <strong style={S.statVal}>{v}</strong>
                      <span style={S.statLabel}>{l}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={S.actionsRow}>
                  <button onClick={(e) => togglePublish(course._id, e)} style={S.publishBtn}>
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={(e) => deleteCourse(course._id, e)} style={S.deleteBtn}>
                    Delete
                  </button>
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
  page: { padding: '2rem', maxWidth: 1400, margin: '0 auto' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem 2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  createBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  empty: { textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' },
  emptySub: { fontSize: 14, color: 'var(--text-secondary)' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },

  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.2s, transform 0.15s',
  },

  coverWrap: { position: 'relative', height: 140, flexShrink: 0, overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '0.06em', backdropFilter: 'blur(8px)' },

  cardBody: { padding: '1.25rem 1.25rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' },
  courseTitle: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, letterSpacing: '-0.01em' },
  desc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  metaRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  metaTag: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 9px', textTransform: 'capitalize' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0.875rem 0.5rem' },
  statVal: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' },
  statLabel: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },

  actionsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.875rem 1.25rem' },
  publishBtn: { padding: '0.65rem', background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  deleteBtn: { padding: '0.65rem', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};
