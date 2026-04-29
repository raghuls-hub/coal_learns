import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];
const LEVEL_COLORS = {
  beginner: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  intermediate: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  advanced: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/courses')
      .then(res => setCourses((res.data.data?.courses || res.data.data || []).filter(c => c.settings?.isPublished)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchLevel = filter === 'all' || c.level === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  });

  return (
    <div style={S.page}>
      {/* Banner */}
      <div style={S.banner}>
        <div style={S.bannerOrb} />
        <div style={S.bannerInner}>
          <span style={S.badge}>Course Catalogue</span>
          <h1 style={S.bannerTitle}>Explore All Courses</h1>
          <p style={S.bannerSub}>Handcrafted learning paths designed to build real-world skills.</p>
          <div style={S.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search courses by title or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.searchInput}
            />
            {search && <button onClick={() => setSearch('')} style={S.clearBtn}>✕</button>}
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Filters */}
        <div style={S.filterRow}>
          <div style={S.filters}>
            {LEVELS.map(lv => (
              <button key={lv} onClick={() => setFilter(lv)} style={filter === lv ? S.filterActive : S.filter}>
                {lv === 'all' ? 'All Levels' : lv.charAt(0).toUpperCase() + lv.slice(1)}
              </button>
            ))}
          </div>
          <span style={S.count}>{loading ? '...' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''}`}</span>
        </div>

        {loading ? (
          <div style={S.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={S.skeletonCard} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={S.emptyText}>No courses found. Try a different filter or keyword.</p>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(course => {
              const lc = LEVEL_COLORS[course.level] || { bg: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', border: 'rgba(148,163,184,0.15)' };
              return (
                <div key={course._id} style={S.card} onClick={() => navigate(`/candidate/course/${course._id}`)}>
                  <div style={S.cardTop}>
                    <div style={S.cardTopRow}>
                      <span style={{ ...S.levelBadge, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>
                        {course.level || 'All Levels'}
                      </span>
                      <span style={S.price}>
                        {course.pricing?.amount > 0 ? `₹${course.pricing.amount}` : <span style={{ color: '#10b981' }}>Free</span>}
                      </span>
                    </div>
                    <h3 style={S.courseTitle}>{course.title}</h3>
                    <p style={S.courseDesc}>{course.description}</p>
                  </div>
                  <div style={S.cardBottom}>
                    <span style={S.categoryTag}>{course.category || 'General'}</span>
                    <button style={S.viewBtn}>View Course →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)' },
  banner: { position: 'relative', overflow: 'hidden', padding: '5rem 2rem 4rem', borderBottom: '1px solid var(--border)', textAlign: 'center' },
  bannerOrb: { position: 'absolute', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', top: -100, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' },
  bannerInner: { position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' },
  badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 99, padding: '4px 14px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' },
  bannerTitle: { fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.75rem' },
  bannerSub: { fontSize: 17, color: 'var(--text-secondary)', marginBottom: '2rem' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem 1.25rem', maxWidth: 540, margin: '0 auto' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 15, outline: 'none' },
  clearBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '0 4px' },

  body: { maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2rem' },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filter: { padding: '0.45rem 1.1rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  filterActive: { padding: '0.45rem 1.1rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  count: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  skeletonCard: { height: 260 },
  empty: { textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  emptyIcon: { width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: 'var(--text-muted)' },

  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s, transform 0.2s' },
  cardTop: { padding: '1.5rem', flex: 1 },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' },
  levelBadge: { fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', textTransform: 'capitalize' },
  price: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' },
  courseTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 },
  courseDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardBottom: { padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryTag: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  viewBtn: { padding: '0.4rem 1rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
};
