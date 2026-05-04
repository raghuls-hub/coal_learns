import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../services/api";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");
function resolveCover(url) {
  if (!url) return null;
  // Already a full URL
  if (url.startsWith("http")) {
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
  // Relative path - prepend API_BASE
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  // If it doesn't start with /, add it
  return `${API_BASE}/${url}`;
}

export default function CoursePreview() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          apiClient.get(`/courses/${courseId}`),
          apiClient.get(`/courses/${courseId}/modules`),
        ]);
        setCourse(cRes.data.data);
        setModules(mRes.data.data || []);
        if (user) {
          const eRes = await apiClient
            .get("/enrollments/my-courses")
            .catch(() => ({ data: { data: [] } }));
          const found = eRes.data.data?.find(
            (e) => e.course?._id === courseId || e.course === courseId,
          );
          setEnrollment(found || null);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) return navigate("/candidate/login");
    setEnrolling(true);
    try {
      const res = await apiClient.post("/enrollments", { courseId });
      navigate(`/candidate/learning/${res.data.data._id}`);
    } catch {
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <div style={S.loading}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  if (!course) return <div style={S.loading}>Course not found</div>;

  const totalChapters = modules.reduce(
    (a, m) => a + (m.content?.length || 0),
    0,
  );
  const hue =
    (course.title || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    360;
  const coverSrc = resolveCover(course.coverImage || course.thumbnail);

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        {/* Cover background */}
        {coverSrc ? (
          <div style={{ ...S.heroBg, backgroundImage: `url(${coverSrc})` }} />
        ) : (
          <div
            style={{
              ...S.heroBg,
              background: `linear-gradient(135deg, hsl(${hue},55%,10%) 0%, hsl(${(hue + 40) % 360},45%,7%) 100%)`,
            }}
          />
        )}
        <div style={S.heroBgOverlay} />
        <div style={S.heroOrb} />
        <div style={S.heroInner}>
          <div style={S.heroLeft}>
            <button
              onClick={() => navigate("/candidate/catalog")}
              style={S.backBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Catalog
            </button>
            <div style={S.metaRow}>
              <span style={S.categoryBadge}>{course.category}</span>
              <span style={S.levelBadge}>{course.level}</span>
              <span style={S.modulesBadge}>
                {modules.length} Modules · {totalChapters} Chapters
              </span>
            </div>
            <h1 style={S.heroTitle}>{course.title}</h1>
            <p style={S.heroDesc}>{course.description}</p>
            {course.courseHandler && (
              <p style={S.instructor}>
                By{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {course.courseHandler.profile?.firstName}{" "}
                  {course.courseHandler.profile?.lastName}
                </strong>
              </p>
            )}
          </div>

          {/* Enroll Card */}
          <div style={S.enrollCard}>
            <div style={S.priceDisplay}>
              {course.pricing?.amount > 0 ? (
                <>
                  <span style={S.priceAmount}>₹{course.pricing.amount}</span>
                </>
              ) : (
                <span style={{ ...S.priceAmount, color: "#10b981" }}>Free</span>
              )}
            </div>
            {enrollment ? (
              <button
                onClick={() =>
                  navigate(`/candidate/learning/${enrollment._id}`)
                }
                style={S.enrolledBtn}
              >
                Continue Learning →
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={S.enrollBtn}
              >
                {enrolling
                  ? "Enrolling..."
                  : course.pricing?.amount > 0
                    ? "Enroll Now"
                    : "Start Free"}
              </button>
            )}
            <div style={S.includes}>
              {[
                `${modules.length} structured modules`,
                `${totalChapters} chapters`,
                "Verified certificate",
                "Lifetime access",
              ].map((item) => (
                <div key={item} style={S.includeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div style={S.body}>
        <h2 style={S.sectionTitle}>Course Curriculum</h2>
        <div style={S.moduleList}>
          {modules.map((mod, i) => (
            <div key={mod._id} style={S.moduleCard}>
              <div style={S.moduleHeader}>
                <span style={S.moduleNum}>Module {i + 1}</span>
                <h3 style={S.moduleTitle}>{mod.title}</h3>
                <span style={S.moduleCount}>
                  {mod.content?.length || 0} chapters
                </span>
              </div>
              {mod.description && <p style={S.moduleDesc}>{mod.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "var(--bg-base)" },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    color: "var(--text-secondary)",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid var(--border)",
    padding: "3rem 2rem",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(2px)",
    transform: "scale(1.05)",
    pointerEvents: "none",
  },
  heroBgOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(6,9,18,0.82)",
    pointerEvents: "none",
  },
  heroOrb: {
    position: "absolute",
    width: 600,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
    top: -100,
    right: -100,
    pointerEvents: "none",
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    gap: "3rem",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroLeft: { flex: 1, minWidth: 300 },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "0.4rem 0",
    marginBottom: "1.5rem",
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: "1.25rem",
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#818cf8",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 99,
    padding: "3px 10px",
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#22d3ee",
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.2)",
    borderRadius: 99,
    padding: "3px 10px",
    textTransform: "capitalize",
  },
  modulesBadge: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-muted)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: 99,
    padding: "3px 10px",
  },
  heroTitle: {
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    fontWeight: 900,
    color: "var(--text-primary)",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    marginBottom: "1rem",
  },
  heroDesc: {
    fontSize: 16,
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    marginBottom: "1rem",
    maxWidth: 600,
  },
  instructor: { fontSize: 14, color: "var(--text-secondary)" },

  enrollCard: {
    width: 300,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    flexShrink: 0,
  },
  priceDisplay: { textAlign: "center" },
  priceAmount: {
    fontSize: 36,
    fontWeight: 900,
    color: "var(--text-primary)",
    letterSpacing: "-0.03em",
  },
  enrollBtn: {
    padding: "0.875rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
  },
  enrolledBtn: {
    padding: "0.875rem",
    background: "rgba(16,185,129,0.1)",
    color: "#10b981",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  includes: { display: "flex", flexDirection: "column", gap: 10 },
  includeItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--text-secondary)",
    fontWeight: 500,
  },

  body: { maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    marginBottom: "1.5rem",
  },
  moduleList: { display: "flex", flexDirection: "column", gap: "1rem" },
  moduleCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid #6366f1",
    borderRadius: 12,
    padding: "1.5rem",
  },
  moduleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  moduleNum: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--text-primary)",
    flex: 1,
  },
  moduleCount: { fontSize: 12, color: "var(--text-muted)", fontWeight: 500 },
  moduleDesc: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: "0.75rem",
    lineHeight: 1.6,
  },
};
