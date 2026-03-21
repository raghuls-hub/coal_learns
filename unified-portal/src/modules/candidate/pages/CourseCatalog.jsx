import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      const published = (res.data.data?.courses || res.data.data || [])
        .filter(c => c.settings?.isPublished);
      setCourses(published);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['all', 'beginner', 'intermediate', 'advanced'];
  const filtered = courses.filter(c => {
    const matchLevel = filter === 'all' || c.level === filter;
    const matchSearch = !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  if (loading) return <div style={S.loading}>Discovering courses…</div>;

  return (
    <div style={S.page}>
      {/* Header Banner */}
      <div style={S.banner}>
        <div style={S.bannerInner}>
          <span style={S.bannerBadge}>Course Catalogue</span>
          <h1 style={S.bannerTitle}>Explore All Courses</h1>
          <p style={S.bannerSub}>Handcrafted learning paths designed to build real-world skills.</p>
          <div style={S.searchBox}>
            <span>Search:</span>
            <input
              type="text"
              placeholder="Search courses by title or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.searchInput}
            />
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Level filters */}
        <div style={S.filterBar}>
          {levels.map(lv => (
            <button key={lv} onClick={() => setFilter(lv)} style={filter === lv ? S.filterActive : S.filter}>
              {lv === 'all' ? 'All Levels' : lv.charAt(0).toUpperCase() + lv.slice(1)}
            </button>
          ))}
          <span style={S.countLabel}>{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: '40px', marginBottom: '1rem' }}>Empty</div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>No courses found. Try a different filter or keyword.</p>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(course => (
              <div key={course._id} style={S.card} onClick={() => navigate(`/candidate/course/${course._id}`)}>
                <div style={S.cardTop}>
                  <div style={S.topRow}>
                    <span style={S.levelBadge(course.level)}>{course.level || 'All Levels'}</span>
                    <span style={S.price}>
                      {course.pricing?.amount > 0 ? `₹${course.pricing.amount}` : 'Free'}
                    </span>
                  </div>
                  <h3 style={S.courseTitle}>{course.title}</h3>
                  <p style={S.courseDesc}>{course.description}</p>
                </div>

                <div style={S.cardBottom}>
                  <span style={S.categoryTag}>{course.category || 'General'}</span>
                  <button style={S.viewBtn}>View Course</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const levelColors = {
  beginner: { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
  intermediate: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  advanced: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-secondary)', fontSize: '18px', background: 'var(--bg-base)' },

  banner: { background: 'linear-gradient(135deg, #1e1b4b 0%, var(--bg-base) 100%)', padding: '4rem 2rem 3rem', borderBottom: '1px solid var(--border-dim)' },
  bannerInner: { maxWidth: '900px', margin: '0 auto', textAlign: 'center' },
  bannerBadge: { fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '99px', padding: '4px 14px', letterSpacing: '0.08em', textTransform: 'uppercase' },
  bannerTitle: { fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', margin: '1rem 0 0.75rem', letterSpacing: '-0.02em' },
  bannerSub: { fontSize: '17px', color: 'var(--text-secondary)', marginBottom: '2rem' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-sidebar)', border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '0.75rem 1.25rem', maxWidth: '540px', margin: '0 auto' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' },

  body: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  filterBar: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' },
  filter: { padding: '0.5rem 1.25rem', background: 'var(--bg-sidebar)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  filterActive: { padding: '0.5rem 1.25rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  countLabel: { marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' },

  empty: { textAlign: 'center', padding: '5rem 2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { background: 'var(--bg-sidebar)', borderRadius: '16px', border: '1px solid var(--border-dim)', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' },
  cardTop: { padding: '1.5rem 1.5rem 1rem' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  levelBadge: (lv) => ({
    fontSize: '11px', fontWeight: '700',
    ...(levelColors[lv] || { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-secondary)' }),
    background: (levelColors[lv] || { bg: 'rgba(148,163,184,0.1)' }).bg,
    borderRadius: '99px', padding: '3px 10px', textTransform: 'capitalize'
  }),
  price: { fontSize: '15px', fontWeight: '800', color: '#34d399' },
  courseTitle: { fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.4' },
  courseDesc: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

  cardBottom: { marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryTag: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' },
  viewBtn: { padding: '0.45rem 1rem', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--accent-glow)' },
};
