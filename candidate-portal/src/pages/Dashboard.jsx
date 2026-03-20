import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient, { getMyEnrollments, getCourses } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exploreCourses, setExploreCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const coursesRes = await getCourses();
      setExploreCourses(coursesRes.data.data.courses || []);
      const enrollRes = await getMyEnrollments();
      const enrolled = enrollRes.data.data.map(e => ({
        ...e.course, enrollmentId: e._id, progress: e.progress
      }));
      setMyCourses(enrolled);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedCourses = activeTab === 'explore' ? exploreCourses : myCourses;

  const handleCourseClick = (courseId) => {
    const isEnrolled = myCourses.some(c => c._id === courseId);
    navigate(isEnrolled ? `/course/${courseId}` : `/course/${courseId}/details`);
  };

  const filtered = displayedCourses.filter(course =>
    (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={S.page}>
      {/* Hero greeting */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <span style={S.heroBadge}>Dashboard</span>
          <h1 style={S.heroTitle}>
            Welcome back, <span style={S.heroName}>{user?.email?.split('@')[0] || 'Learner'}</span>
          </h1>
          <p style={S.heroSub}>Continue where you left off or discover something new.</p>
        </div>
      </div>

      <div style={S.content}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <div style={S.tabBar}>
            {['explore', 'my-learning'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? S.tabActive : S.tab}
              >
                {tab === 'explore' ? 'Explore Courses' : 'My Learning'}
              </button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>Search:</span>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={S.searchInput}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={S.loading}>Loading courses…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>No Data</div>
            <p style={S.emptyText}>
              {activeTab === 'my-learning' ? 'No enrolled courses yet.' : 'No courses found.'}
            </p>
            {activeTab === 'my-learning' && (
              <button onClick={() => setActiveTab('explore')} style={S.ctaBtn}>Browse Courses</button>
            )}
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(course => (
              <div key={course._id} style={S.card} onClick={() => handleCourseClick(course._id)}>
                <div style={S.cardImgBar}>
                  <span style={S.categoryPill}>{course.category || 'General'}</span>
                  {activeTab === 'explore' && (
                    <span style={S.pricePill}>
                      {course.pricing?.amount > 0 ? `₹${course.pricing.amount}` : 'Free'}
                    </span>
                  )}
                </div>
                <div style={S.cardBody}>
                  <h3 style={S.courseTitle}>{course.title}</h3>
                  <p style={S.courseDesc}>{course.description}</p>
                  {course.level && <span style={S.levelTag}>{course.level}</span>}
                </div>
                {activeTab === 'my-learning' && (
                  <div style={S.progressArea}>
                    <div style={S.progressBar}>
                      <div style={{ ...S.progressFill, width: `${course.progress || 0}%` }} />
                    </div>
                    <span style={S.progressLabel}>{course.progress || 0}% complete</span>
                  </div>
                )}
                <div style={S.cardFooter}>
                  <span style={S.goAction}>
                    {activeTab === 'my-learning' ? 'Continue' : 'View Course'}
                  </span>
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

  // Hero
  hero: { background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', padding: '3rem 2rem 2.5rem', borderBottom: '1px solid #1e293b' },
  heroInner: { maxWidth: '1200px', margin: '0 auto' },
  heroBadge: { fontSize: '11px', fontWeight: '700', color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '99px', padding: '3px 12px', letterSpacing: '0.08em', textTransform: 'uppercase' },
  heroTitle: { fontSize: '36px', fontWeight: '800', color: '#f1f5f9', margin: '1rem 0 0.5rem', letterSpacing: '-0.02em' },
  heroName: { background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: '16px', color: '#64748b' },

  // Toolbar
  content: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' },
  tabBar: { display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '5px', borderRadius: '12px', border: '1px solid #334155' },
  tab: { padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600', color: '#64748b', fontSize: '14px' },
  tabActive: { padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', cursor: 'pointer', fontWeight: '700', color: 'white', fontSize: '14px', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '0 1rem', flex: '0 0 auto' },
  searchIcon: { fontSize: '14px' },
  searchInput: { padding: '0.65rem 0', border: 'none', background: 'transparent', color: '#f1f5f9', fontSize: '14px', outline: 'none', width: '220px' },

  // States
  loading: { textAlign: 'center', color: '#64748b', padding: '4rem', fontSize: '16px' },
  empty: { textAlign: 'center', padding: '5rem 2rem', color: '#64748b' },
  emptyIcon: { fontSize: '48px', marginBottom: '1rem' },
  emptyText: { fontSize: '16px', marginBottom: '1.5rem' },
  ctaBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-2px)' } },

  cardImgBar: { background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '1.25rem 1.25rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155' },
  categoryPill: { fontSize: '11px', fontWeight: '700', color: '#818cf8', background: 'rgba(129,140,248,0.12)', borderRadius: '99px', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  pricePill: { fontSize: '13px', fontWeight: '800', color: '#34d399' },

  cardBody: { padding: '1rem 1.25rem', flex: 1 },
  courseTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 0.5rem', lineHeight: '1.4' },
  courseDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  levelTag: { display: 'inline-block', marginTop: '0.75rem', fontSize: '11px', fontWeight: '600', color: '#94a3b8', background: '#0f172a', borderRadius: '6px', padding: '3px 8px', textTransform: 'capitalize' },

  // Progress
  progressArea: { padding: '0 1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  progressBar: { height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '2px', transition: 'width 0.4s ease' },
  progressLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600' },

  cardFooter: { padding: '0.75rem 1.25rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' },
  goAction: { fontSize: '13px', fontWeight: '700', color: '#818cf8' },
};
