import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
function resolveCover(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const LEVEL_META = {
  beginner:     { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  intermediate: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  advanced:     { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
};

const PRICE_RANGES = [
  { label: 'Any Price',  min: 0,    max: Infinity },
  { label: 'Free',       min: 0,    max: 0         },
  { label: 'Under ₹500', min: 1,    max: 499       },
  { label: '₹500–₹2000', min: 500,  max: 2000      },
  { label: 'Above ₹2000',min: 2001, max: Infinity  },
];

function CourseCover({ src, title }) {
  const [err, setErr] = useState(false);
  const resolved = resolveCover(src);
  if (resolved && !err) {
    return <img src={resolved} alt={title} onError={() => setErr(true)} style={S.coverImg} />;
  }
  // Deterministic gradient placeholder from title
  const hue = (title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ ...S.coverPlaceholder, background: `linear-gradient(135deg, hsl(${hue},60%,18%) 0%, hsl(${(hue+40)%360},50%,12%) 100%)` }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// Custom styled select dropdown
function FilterSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={S.selectWrap}>
      <button type="button" onClick={() => setOpen(o => !o)} style={S.selectTrigger}>
        <span style={{ color: selected ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13 }}>
          {selected?.label || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={S.dropdown}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ ...S.dropdownItem, background: value === opt.value ? 'rgba(99,102,241,0.12)' : 'transparent', color: value === opt.value ? '#818cf8' : 'var(--text-secondary)' }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [level, setLevel]     = useState('all');
  const [priceIdx, setPriceIdx] = useState(0);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy]   = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/courses')
      .then(res => setCourses((res.data.data?.courses || res.data.data || []).filter(c => c.settings?.isPublished)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const priceRange = PRICE_RANGES[priceIdx];

  const filtered = courses
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.level?.toLowerCase().includes(q);
      const matchLevel    = level === 'all' || c.level === level;
      const matchCategory = category === 'all' || c.category === category;
      const amt = c.pricing?.amount || 0;
      const matchPrice = amt >= priceRange.min && amt <= priceRange.max;
      return matchSearch && matchLevel && matchCategory && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return (a.pricing?.amount || 0) - (b.pricing?.amount || 0);
      if (sortBy === 'price-desc') return (b.pricing?.amount || 0) - (a.pricing?.amount || 0);
      if (sortBy === 'title')      return a.title?.localeCompare(b.title);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // newest
    });

  const hasFilters = search || level !== 'all' || priceIdx !== 0 || category !== 'all';

  const clearAll = () => { setSearch(''); setLevel('all'); setPriceIdx(0); setCategory('all'); setSortBy('newest'); };

  return (
    <div style={S.page}>
      {/* Banner */}
      <div style={S.banner}>
        <div style={S.bannerOrb} />
        <div style={S.bannerInner}>
          <span style={S.badge}>Course Catalogue</span>
          <h1 style={S.bannerTitle}>Explore All Courses</h1>
          <p style={S.bannerSub}>Handcrafted learning paths designed to build real-world skills.</p>
          {/* Main search */}
          <div style={S.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by title, category, keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={S.clearBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Advanced filter bar */}
        <div style={S.filterBar}>
          <div style={S.filterLeft}>
            <FilterSelect
              value={level}
              onChange={setLevel}
              placeholder="All Levels"
              options={[
                { value: 'all', label: 'All Levels' },
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
            <FilterSelect
              value={category}
              onChange={setCategory}
              placeholder="All Categories"
              options={categories.map(c => ({ value: c, label: c === 'all' ? 'All Categories' : c }))}
            />
            <FilterSelect
              value={priceIdx}
              onChange={v => setPriceIdx(Number(v))}
              placeholder="Any Price"
              options={PRICE_RANGES.map((r, i) => ({ value: i, label: r.label }))}
            />
            <FilterSelect
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              options={[
                { value: 'newest',     label: 'Newest First' },
                { value: 'title',      label: 'Title A–Z' },
                { value: 'price-asc',  label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
              ]}
            />
            {hasFilters && (
              <button onClick={clearAll} style={S.clearAllBtn}>
                Clear filters
              </button>
            )}
          </div>
          <span style={S.count}>
            {loading ? '—' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={S.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={S.skeletonCard} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={S.emptyTitle}>No courses found</p>
            <p style={S.emptyText}>Try adjusting your filters or search term.</p>
            {hasFilters && <button onClick={clearAll} style={S.emptyBtn}>Clear all filters</button>}
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(course => {
              const lc = LEVEL_META[course.level] || { bg: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', border: 'rgba(148,163,184,0.15)' };
              return (
                <div key={course._id} style={S.card} onClick={() => navigate(`/candidate/course/${course._id}`)}>
                  {/* Cover */}
                  <div style={S.coverWrap}>
                    <CourseCover src={course.coverImage} title={course.title} />
                    <span style={{ ...S.levelPill, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>
                      {course.level || 'General'}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={S.cardBody}>
                    <span style={S.categoryLabel}>{course.category || 'General'}</span>
                    <h3 style={S.courseTitle}>{course.title}</h3>
                    <p style={S.courseDesc}>{course.description}</p>
                  </div>

                  {/* Footer */}
                  <div style={S.cardFoot}>
                    <span style={S.priceTag}>
                      {course.pricing?.amount > 0
                        ? <><span style={S.priceSymbol}>₹</span>{course.pricing.amount}</>
                        : <span style={{ color: '#10b981', fontWeight: 700 }}>Free</span>}
                    </span>
                    <button style={S.viewBtn}>View Course</button>
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
  bannerInner: { position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' },
  badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 99, padding: '4px 14px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' },
  bannerTitle: { fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.75rem' },
  bannerSub: { fontSize: 17, color: 'var(--text-secondary)', marginBottom: '2rem' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.8rem 1.25rem', maxWidth: 560, margin: '0 auto', transition: 'border-color 0.2s' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 15, outline: 'none' },
  clearBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' },

  body: { maxWidth: 1320, margin: '0 auto', padding: '2.5rem 2rem' },

  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' },
  filterLeft: { display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' },
  clearAllBtn: { padding: '0.45rem 1rem', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  count: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 },

  // Custom select
  selectWrap: { position: 'relative' },
  selectTrigger: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 130 },
  dropdown: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#161d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.375rem', zIndex: 200, minWidth: 160, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' },
  dropdownItem: { padding: '0.55rem 0.875rem', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  skeletonCard: { height: 320, borderRadius: 16 },

  empty: { textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  emptyText: { fontSize: 14, color: 'var(--text-muted)' },
  emptyBtn: { marginTop: '0.5rem', padding: '0.6rem 1.5rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },

  // Card
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s, transform 0.2s' },
  coverWrap: { position: 'relative', height: 168, overflow: 'hidden', flexShrink: 0 },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  coverPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  levelPill: { position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '3px 9px', textTransform: 'capitalize', backdropFilter: 'blur(8px)' },

  cardBody: { padding: '1.125rem 1.25rem', flex: 1 },
  categoryLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
  courseTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.5rem' },
  courseDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

  cardFoot: { padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceTag: { fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' },
  priceSymbol: { fontSize: 12, fontWeight: 600, verticalAlign: 'super', marginRight: 1 },
  viewBtn: { padding: '0.4rem 1rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
};
