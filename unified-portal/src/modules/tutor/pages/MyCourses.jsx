import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

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
      <div style={S.grid}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}</div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>My Courses</h1>
          <p style={S.subtitle}>Manage your course catalog</p>
        </div>
        <button onClick={() => navigate('/tutor/create-course')} style={S.createBtn}>+ Create New Course</button>
      </div>

      {courses.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>📚</div>
          <h3 style={S.emptyTitle}>No courses yet</h3>
          <p style={S.emptySub}>Create your first course to get started!</p>
          <button onClick={() => navigate('/tutor/create-course')} style={S.createBtn}>Create Course</button>
        </div>
      ) : (
        <div style={S.grid}>
          {courses.map(course => {
            const isPublished = course.settings?.isPublished;
            const isArchived = course.settings?.isArchived;
            return (
              <div key={course._id} style={S.card} onClick={() => navigate(`/tutor/course/${course._id}`)}>
                <div style={S.cardHead}>
                  <h3 style={S.courseTitle}>{course.title}</h3>
                  <span style={{
                    ...S.badge,
                    background: isPublished ? 'rgba(16,185,129,0.1)' : isArchived ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.08)',
                    color: isPublished ? '#10b981' : isArchived ? '#f59e0b' : 'var(--text-muted)',
                    border: `1px solid ${isPublished ? 'rgba(16,185,129,0.2)' : isArchived ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                  }}>
                    {isPublished ? 'Published' : isArchived ? 'Archived' : 'Draft'}
                  </span>
                </div>
                <p style={S.desc}>{course.description}</p>
                <div style={S.meta}>
                  <span style={S.metaTag}>{course.category}</span>
                  <span style={S.metaTag}>{course.level}</span>
                  <span style={{ ...S.metaTag, color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>₹{course.pricing?.amount || 0}</span>
                </div>
                <div style={S.stats}>
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
                <div style={S.actions}>
                  <button onClick={(e) => togglePublish(course._id, e)} style={S.publishBtn}>
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={(e) => deleteCourse(course._id, e)} style={S.deleteBtn}>Delete</button>
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
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)' },
  createBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  empty: { textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 },
  emptyIcon: { fontSize: 48, marginBottom: '1rem' },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' },
  emptySub: { fontSize: 15, color: 'var(--text-secondary)', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'border-color 0.2s' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' },
  courseTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4, letterSpacing: '-0.01em' },
  badge: { fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 },
  desc: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaTag: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px', textTransform: 'capitalize' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' },
  statItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3 },
  statVal: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' },
  statLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' },
  publishBtn: { padding: '0.7rem', background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  deleteBtn: { padding: '0.7rem', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};
