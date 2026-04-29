import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const StatCard = ({ label, value, color, children }) => (
  <div style={{ ...S.statCard, borderTop: `3px solid ${color}` }}>
    <div style={S.statTop}>
      <span style={S.statLabel}>{label}</span>
      <span style={{ ...S.statValue, color }}>{value}</span>
    </div>
    {children}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{payload[0].value}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ courses: [], enrollments: [], totalCourses: 0, publishedCourses: 0, totalEnrollments: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.get('/courses'), apiClient.get('/enrollments/tutor')])
      .then(([cRes, eRes]) => {
        const courses = cRes.data.data?.courses || [];
        const enrollments = eRes.data.data || [];
        let totalRevenue = 0;
        const revMap = {};
        enrollments.forEach(en => {
          const amt = en.amountPaid || 0;
          totalRevenue += amt;
          if (en.course?._id) revMap[en.course._id] = (revMap[en.course._id] || 0) + amt;
        });
        setData({
          courses: courses.map(c => ({ ...c, revenue: revMap[c._id] || 0 })),
          enrollments,
          totalCourses: courses.length,
          publishedCourses: courses.filter(c => c.settings?.isPublished).length,
          totalEnrollments: enrollments.length,
          totalRevenue,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enrollChartData = data.courses.map(c => ({ name: c.title?.slice(0, 14) + (c.title?.length > 14 ? '…' : ''), value: c.stats?.enrollmentCount || 0 }));
  const progressChartData = data.enrollments.slice(0, 10).map(en => ({ name: `${en.user?.profile?.firstName || '?'}`, value: en.progress || 0 }));
  const revenueChartData = data.courses.map(c => ({ name: c.title?.slice(0, 14) + (c.title?.length > 14 ? '…' : ''), value: c.revenue || 0 }));

  return (
    <div style={S.page}>
      {loading && (
        <div style={S.loadingOverlay}>
          <div style={S.loadingText}>Loading analytics…</div>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={S.banner}>
        <div style={S.bannerOrb} />
        <div style={S.bannerContent}>
          <h1 style={S.bannerTitle}>Good to see you, <span className="grad-text">{user?.profile?.firstName || 'Mentor'}</span></h1>
          <p style={S.bannerSub}>Here's an overview of your teaching performance.</p>
        </div>
        <button onClick={() => navigate('/tutor/create-course')} style={S.createBtn}>+ Create Course</button>
      </div>

      {/* KPI Row */}
      <div style={S.kpiRow}>
        {[
          { label: 'Total Courses', value: data.totalCourses, color: '#6366f1' },
          { label: 'Published', value: data.publishedCourses, color: '#22d3ee' },
          { label: 'Total Students', value: data.totalEnrollments, color: '#a78bfa' },
          { label: 'Total Revenue', value: `₹${data.totalRevenue.toFixed(0)}`, color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...S.kpi, borderLeft: `3px solid ${color}` }}>
            <span style={S.kpiLabel}>{label}</span>
            <span style={{ ...S.kpiValue, color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={S.chartsGrid}>
        <StatCard label="Enrollments per Course" value={data.totalEnrollments} color="#6366f1">
          <div style={S.listSection}>
            {data.courses.slice(0, 5).map(c => (
              <div key={c._id} style={S.listRow}>
                <span style={S.listTitle}>{c.title}</span>
                <span style={{ ...S.listBadge, background: c.settings?.isPublished ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', color: c.settings?.isPublished ? '#10b981' : 'var(--text-muted)', border: `1px solid ${c.settings?.isPublished ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
                  {c.settings?.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
          <div style={S.chartArea}>
            <p style={S.chartLabel}>Enrollments per Course</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={enrollChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>

        <StatCard label="Student Progress" value={`${data.totalEnrollments} students`} color="#a78bfa">
          <div style={S.listSection}>
            {data.enrollments.slice(0, 5).map(en => (
              <div key={en._id} style={S.listRow}>
                <span style={S.listTitle}>{en.user?.profile?.firstName} {en.user?.profile?.lastName} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({en.course?.title?.slice(0, 20)})</span></span>
                <span style={{ ...S.listValue, color: '#a78bfa' }}>{en.progress || 0}%</span>
              </div>
            ))}
          </div>
          <div style={S.chartArea}>
            <p style={S.chartLabel}>Student Progress (%)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={progressChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(167,139,250,0.08)' }} />
                <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>

        <StatCard label="Revenue" value={`₹${data.totalRevenue.toFixed(0)}`} color="#10b981">
          <div style={S.listSection}>
            {data.courses.slice(0, 5).map(c => (
              <div key={c._id} style={S.listRow}>
                <span style={S.listTitle}>{c.title}</span>
                <span style={{ ...S.listValue, color: '#10b981' }}>₹{(c.revenue || 0).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={S.chartArea}>
            <p style={S.chartLabel}>Revenue per Course (₹)</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>
      </div>
    </div>
  );
}

const S = {
  page: { padding: '2rem', maxWidth: 1400, margin: '0 auto', position: 'relative' },
  loadingOverlay: { position: 'fixed', inset: 0, background: 'rgba(6,9,18,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  loadingText: { fontSize: 16, fontWeight: 700, color: '#22d3ee' },

  banner: { position: 'relative', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem 2.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  bannerOrb: { position: 'absolute', width: 400, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)', top: -50, right: -50, pointerEvents: 'none' },
  bannerContent: { position: 'relative', zIndex: 1 },
  bannerTitle: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.4rem' },
  bannerSub: { fontSize: 14, color: 'var(--text-secondary)' },
  createBtn: { position: 'relative', zIndex: 1, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  kpi: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 6 },
  kpiLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  kpiValue: { fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' },

  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' },
  statLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue: { fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' },

  listSection: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem', flex: 1 },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' },
  listTitle: { fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' },
  listBadge: { fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px' },
  listValue: { fontSize: 13, fontWeight: 700 },

  chartArea: { paddingTop: '1rem', borderTop: '1px solid var(--border)' },
  chartLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center' },
};
