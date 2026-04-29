import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      {/* Ambient background orbs */}
      <div style={S.orb1} />
      <div style={S.orb2} />
      <div style={S.orb3} />

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={S.logoText}>Coal Learns</span>
          </div>
          <div style={S.navActions}>
            <button onClick={() => navigate('/candidate/login')} style={S.navBtn}>Sign In</button>
            <button onClick={() => navigate('/candidate/register')} style={S.navBtnPrimary}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroBadge}>
            <span style={S.badgeDot} />
            Professional Learning Platform
          </div>
          <h1 style={S.heroTitle}>
            Master Skills That<br />
            <span className="grad-text">Shape Your Future</span>
          </h1>
          <p style={S.heroSub}>
            A unified platform where world-class mentors craft structured learning paths and ambitious candidates earn verified credentials.
          </p>
          <div style={S.heroActions}>
            <button onClick={() => navigate('/candidate/catalog')} style={S.heroCta}>
              Explore Courses
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => navigate('/tutor/login')} style={S.heroSecondary}>
              Teach on Coal Learns
            </button>
          </div>
          <div style={S.heroStats}>
            {[['10K+', 'Active Learners'], ['500+', 'Expert Courses'], ['98%', 'Completion Rate']].map(([n, l]) => (
              <div key={l} style={S.stat}>
                <span style={S.statNum}>{n}</span>
                <span style={S.statLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section style={S.portals}>
        <div style={S.portalsInner}>
          <h2 style={S.sectionTitle}>Choose Your Path</h2>
          <p style={S.sectionSub}>Two specialized portals, one unified experience.</p>
          <div style={S.cardsGrid}>
            {/* Candidate Card */}
            <div style={S.card} onClick={() => navigate('/candidate/catalog')}>
              <div style={{ ...S.cardGlow, background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
              <div style={{ ...S.cardIcon, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={S.cardTitle}>Candidate Portal</h3>
              <p style={S.cardDesc}>Browse courses, track your learning journey, and earn industry-recognized certificates.</p>
              <ul style={S.cardFeatures}>
                {['Structured learning paths', 'Progress tracking', 'Verified certificates', 'AI learning assistant'].map(f => (
                  <li key={f} style={S.cardFeature}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{ ...S.cardBtn, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Enter as Candidate →
              </button>
            </div>

            {/* Tutor Card */}
            <div style={S.card} onClick={() => navigate('/tutor/login')}>
              <div style={{ ...S.cardGlow, background: 'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.15) 0%, transparent 70%)' }} />
              <div style={{ ...S.cardIcon, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#22d3ee" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={S.cardTitle}>Mentor Portal</h3>
              <p style={S.cardDesc}>Create professional courses, manage your students, and grow your teaching impact.</p>
              <ul style={S.cardFeatures}>
                {['Course builder & editor', 'Student analytics', 'Revenue tracking', 'Certificate engine'].map(f => (
                  <li key={f} style={S.cardFeature}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{ ...S.cardBtn, background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}>
                Enter as Mentor →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ ...S.logoText, fontSize: 14 }}>Coal Learns</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>© 2026 Coal Learns · Powered by Antigravity</p>
        </div>
      </footer>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' },

  orb1: { position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', top: -200, left: -200, pointerEvents: 'none', zIndex: 0 },
  orb2: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', top: 100, right: -150, pointerEvents: 'none', zIndex: 0 },
  orb3: { position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', bottom: 0, left: '40%', pointerEvents: 'none', zIndex: 0 },

  nav: { position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', background: 'rgba(6,9,18,0.8)' },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  navActions: { display: 'flex', gap: 10 },
  navBtn: { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid var(--border-hover)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  navBtnPrimary: { padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', border: 'none', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  hero: { position: 'relative', zIndex: 1, padding: '7rem 2rem 5rem', textAlign: 'center' },
  heroInner: { maxWidth: 800, margin: '0 auto' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 14px', marginBottom: '2rem', letterSpacing: '0.04em', textTransform: 'uppercase' },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' },
  heroTitle: { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem', color: 'var(--text-primary)' },
  heroSub: { fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 2.5rem' },
  heroActions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' },
  heroCta: { display: 'inline-flex', alignItems: 'center', padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' },
  heroSecondary: { padding: '0.875rem 2rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', border: '1px solid var(--border-hover)', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  heroStats: { display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' },
  stat: { display: 'flex', flexDirection: 'column', gap: 4 },
  statNum: { fontSize: 28, fontWeight: 900, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  statLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  portals: { position: 'relative', zIndex: 1, padding: '4rem 2rem 6rem' },
  portalsInner: { maxWidth: 1000, margin: '0 auto' },
  sectionTitle: { fontSize: 36, fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '0.75rem' },
  sectionSub: { fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' },

  card: { position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '2.5rem', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.3s, transform 0.3s', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  cardGlow: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  cardIcon: { width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  cardDesc: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.65 },
  cardFeatures: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  cardFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 },
  cardBtn: { marginTop: 'auto', padding: '0.875rem', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'center' },

  footer: { position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', padding: '1.5rem 2rem' },
  footerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
};
