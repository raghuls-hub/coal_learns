import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { MortarboardIcon, UsersIcon, RevenueIcon, LightbulbIcon, ZapIcon } from '../components/Icons';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    courses: [],
    enrollments: [],
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/enrollments/tutor')
      ]);
      const courses = coursesRes.data.data.courses || [];
      const enrollments = enrollmentsRes.data.data || [];
      
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(c => c.settings?.isPublished).length;
      const totalEnrollments = enrollments.length;
      
      // Calculate revenue per course and total revenue
      let totalRevenue = 0;
      const courseRevenues = {};
      enrollments.forEach(en => {
        const amount = en.amountPaid || 0;
        totalRevenue += amount;
        if (en.course && en.course._id) {
          courseRevenues[en.course._id] = (courseRevenues[en.course._id] || 0) + amount;
        }
      });

      // Attach revenue to courses list for display
      const coursesWithRevenue = courses.map(c => ({
        ...c,
        revenue: courseRevenues[c._id] || 0
      }));

      setStats({ courses: coursesWithRevenue, enrollments, totalCourses, publishedCourses, totalEnrollments, totalRevenue });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: '800' }}>Refreshing Stats...</div>
        </div>
      )}
      {/* Stats Grid */}

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconWrap}><MortarboardIcon size={22} color='#6366f1' /></div>
            <div>
              <h3 style={styles.cardTitle}>Total Courses</h3>
              <p style={styles.stat}>{stats.totalCourses}</p>
            </div>
          </div>
          <div style={styles.listContainer}>
            {stats.courses.map((course, idx) => (
              <div key={idx} style={styles.listItem}>
                <span style={styles.itemTitle}>{course.title}</span>
                <span style={styles.itemBadge}>{course.settings?.isPublished ? 'Published' : 'Draft'}</span>
              </div>
            ))}
            {stats.courses.length === 0 && <p style={styles.emptyText}>No courses yet</p>}
          </div>
          <div style={styles.chartWrapper}>
            <p style={styles.chartTitle}>Enrollments per Course</p>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.courses.map(c => ({ name: c.title, value: c.stats?.enrollmentCount || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                    formatter={(value) => [value, 'Enrollments']}
                  />
                  <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconWrap}><UsersIcon size={22} color='#8b5cf6' /></div>
            <div>
              <h3 style={styles.cardTitle}>Total Enrollments</h3>
              <p style={styles.stat}>{stats.totalEnrollments}</p>
            </div>
          </div>
          <div style={styles.listContainer}>
            {stats.enrollments.map((en, idx) => (
              <div key={idx} style={styles.listItem}>
                <span style={styles.itemTitle}>{en.user?.profile?.firstName} {en.user?.profile?.lastName} <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>({en.course?.title})</span></span>
                <span style={styles.itemValue}>{en.progress || 0}%</span>
              </div>
            ))}
            {stats.enrollments.length === 0 && <p style={styles.emptyText}>No enrollments yet</p>}
          </div>
          <div style={styles.chartWrapper}>
            <p style={styles.chartTitle}>Student Progress (%)</p>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.enrollments.map(en => ({ name: `${en.user?.profile?.firstName} ${en.user?.profile?.lastName}`, value: en.progress || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Progress']}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconWrap}><RevenueIcon size={22} color='#10b981' /></div>
            <div>
              <h3 style={styles.cardTitle}>Total Revenue</h3>
              <p style={styles.stat}>₹{stats.totalRevenue.toFixed(0)}</p>
            </div>
          </div>
          <div style={styles.listContainer}>
            {stats.courses.map((course, idx) => (
              <div key={idx} style={styles.listItem}>
                <span style={styles.itemTitle}>{course.title}</span>
                <span style={styles.itemValue}>₹{(course.revenue || 0).toFixed(0)}</span>
              </div>
            ))}
            {stats.courses.length === 0 && <p style={styles.emptyText}>No revenue yet</p>}
          </div>
          <div style={styles.chartWrapper}>
            <p style={styles.chartTitle}>Revenue per Course</p>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.courses.map(c => ({ name: c.title, value: c.revenue || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column' },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
    gap: '2rem', 
    marginBottom: '3rem',
    alignItems: 'stretch',
    minHeight: 'calc(100vh - 150px)'
  },
  card: { 
    background: 'var(--bg-surface)', 
    padding: '2rem', 
    borderRadius: '20px', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  cardHeader: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-dim)',
    paddingBottom: '1rem',
    flexShrink: 0
  },
  cardIconWrap: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { 
    fontSize: '14px', 
    color: 'var(--text-secondary)', 
    marginBottom: '0.25rem', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em' 
  },
  stat: { 
    fontSize: '32px', 
    fontWeight: '900', 
    color: 'var(--text-primary)', 
    letterSpacing: '-0.02em',
    margin: 0
  },
  listContainer: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingRight: '0.5rem',
    flex: 1,
    marginBottom: '1.5rem'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  itemTitle: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '70%'
  },
  itemValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--accent-primary)'
  },
  itemBadge: {
    fontSize: '11px',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    background: 'var(--accent-primary)',
    color: '#fff',
    fontWeight: 'bold'
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textAlign: 'center',
    padding: '1rem 0'
  },
  chartWrapper: {
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-dim)',
    flexShrink: 0
  },
  chartTitle: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    marginBottom: '0.5rem',
    textAlign: 'center'
  }
};
