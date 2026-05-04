import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

// ─── Activity Storage (localStorage) ─────────────────────────────────────────
// Note: Keeping localStorage functions for backward compatibility, but primary tracking
// now happens via the backend's progress_tracking_history table

const STORAGE_KEY = "cl_activity";
const COMPLETED_KEY = "cl_completed";

function loadActivity() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function loadCompleted() {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]");
  } catch {
    return [];
  }
}

// Track content completion - now primarily handled by backend
// This function is kept for UI state updates
export function recordChapterComplete(contentId) {
  // Deduplicate locally — but real tracking happens in backend
  const done = loadCompleted();
  if (done.includes(contentId)) return;
  done.push(contentId);
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(done));
}

// ─── Monthly Heatmap ──────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_ABBR = ["S", "M", "T", "W", "T", "F", "S"];

function getIntensityColor(count) {
  if (!count) return "rgba(255,255,255,0.05)";
  if (count === 1) return "rgba(99,102,241,0.3)";
  if (count === 2) return "rgba(99,102,241,0.52)";
  if (count === 3) return "rgba(99,102,241,0.72)";
  return "#6366f1";
}

// Build last 6 months of data grouped by month
function buildMonthlyGrid(activityMap) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const months = [];

  for (let m = 5; m >= 0; m--) {
    const year = today.getFullYear();
    const month = today.getMonth() - m;
    // Use Date to handle year rollover automatically
    const ref = new Date(year, month, 1);
    const refYear = ref.getFullYear();
    const refMonth = ref.getMonth();
    const daysInMonth = new Date(refYear, refMonth + 1, 0).getDate();
    const firstDow = new Date(refYear, refMonth, 1).getDay(); // 0=Sun

    // Build rows: each row is one week (Sun–Sat)
    // Row 0 starts with `firstDow` empty cells, then day 1
    const rows = [];
    let row = Array(7).fill(null);
    let col = firstDow;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(refYear, refMonth, d);
      const key = `${refYear}-${String(refMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      row[col] = {
        day: d,
        key,
        count: activityMap[key] || 0,
        isFuture: date > today,
      };
      col++;
      if (col === 7) {
        rows.push(row);
        row = Array(7).fill(null);
        col = 0;
      }
    }
    // Push the last partial row if it has any days
    if (col > 0) rows.push(row);

    months.push({ label: MONTH_NAMES[refMonth], year: refYear, rows });
  }
  return months;
}

function ActivityHeatmap({ activityMap, totalDays, totalModules }) {
  const [tooltip, setTooltip] = useState(null);
  const months = useMemo(() => buildMonthlyGrid(activityMap), [activityMap]);
  const CELL = 14,
    GAP = 3;

  return (
    <div style={H.wrap}>
      <div style={H.header}>
        <div>
          <h2 style={H.title}>Learning Activity</h2>
          <p style={H.sub}>
            {totalModules} chapter{totalModules !== 1 ? "s" : ""} completed ·{" "}
            {totalDays} active day{totalDays !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={H.legend}>
          <span style={H.legendLabel}>Less</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: getIntensityColor(i),
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          ))}
          <span style={H.legendLabel}>More</span>
        </div>
      </div>

      <div style={H.grid}>
        {months.map(({ label, year, rows }) => (
          <div key={`${label}${year}`} style={H.monthBlock}>
            <p style={H.monthLabel}>
              {label} {year}
            </p>
            <div style={{ display: "flex", gap: GAP, marginBottom: GAP }}>
              {DAY_ABBR.map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: CELL,
                    fontSize: 9,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            {rows.map((week, wi) => (
              <div
                key={wi}
                style={{ display: "flex", gap: GAP, marginBottom: GAP }}
              >
                {week.map((cell, di) => {
                  if (!cell)
                    return (
                      <div key={di} style={{ width: CELL, height: CELL }} />
                    );
                  return (
                    <div
                      key={di}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: cell.isFuture
                          ? "rgba(255,255,255,0.03)"
                          : getIntensityColor(cell.count),
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: cell.count > 0 ? "pointer" : "default",
                      }}
                      onMouseEnter={(e) =>
                        setTooltip({ ...cell, x: e.clientX, y: e.clientY })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          style={{ ...H.tooltip, left: tooltip.x + 12, top: tooltip.y - 44 }}
        >
          <strong>
            {tooltip.count} chapter{tooltip.count !== 1 ? "s" : ""}
          </strong>
          {" on "}
          {new Date(tooltip.key + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}
    </div>
  );
}

const H = {
  wrap: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "1.75rem 2rem",
    marginBottom: "2.5rem",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: 17,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  sub: { fontSize: 13, color: "var(--text-secondary)" },
  legend: { display: "flex", alignItems: "center", gap: 4 },
  legendLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  grid: { display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: 4 },
  monthBlock: { flexShrink: 0 },
  monthLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-secondary)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  tooltip: {
    position: "fixed",
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    color: "var(--text-primary)",
    pointerEvents: "none",
    zIndex: 1000,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
};

// ─── Course Cover ─────────────────────────────────────────────────────────────
function CourseCover({ src, title, style }) {
  const [err, setErr] = useState(false);
  const resolved = resolveCover(src);
  if (resolved && !err) {
    return (
      <img
        src={resolved}
        alt={title}
        onError={() => setErr(true)}
        style={style}
      />
    );
  }
  const hue =
    (title || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      style={{
        ...style,
        background: `linear-gradient(135deg, hsl(${hue},55%,16%) 0%, hsl(${(hue + 40) % 360},45%,10%) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity="0.3">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activityMap, setActivityMap] = useState(() => loadActivity());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  // Fetch activity from database instead of localStorage for consistent tracking
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const res = await apiClient.get("/progress/activity/user-activity", {
          headers: { "x-timezone": tz },
        });
        if (res.data.success && res.data.data.activityMap) {
          setActivityMap(res.data.data.activityMap);
        }
      } catch (err) {
        console.log("[MyLearning] Error fetching activity:", err.message);
        // Fallback to localStorage if API fails
        setActivityMap(loadActivity());
      }
    };

    // Fetch immediately
    fetchActivity();

    // Refetch every 5 seconds while visible
    const interval = setInterval(() => {
      if (!document.hidden) fetchActivity();
    }, 5000);

    // Also refetch when page becomes visible
    const handleVisibility = () => {
      if (!document.hidden) fetchActivity();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        apiClient.get("/enrollments/my-courses"),
        apiClient.get("/certificates/my"),
      ]);
      setEnrollments(eRes.data.data || []);
      setCertificates(cRes.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const { totalDays, totalModules } = useMemo(() => {
    const days = Object.keys(activityMap).length;
    const mods = Object.values(activityMap).reduce((a, v) => a + v, 0);
    return { totalDays: days, totalModules: mods };
  }, [activityMap]);

  const handleClaim = async (courseId) => {
    if (!courseId) return;
    setClaiming(courseId);
    try {
      await apiClient.post("/certificates/claim", { courseId });
      await fetchAll();
    } catch {
    } finally {
      setClaiming(null);
    }
  };

  const handleContinue = (en) => {
    if (!en.course) return setModal("deleted");
    if (!en.course?.settings?.isPublished) return setModal("maintenance");
    navigate(`/candidate/learning/${en._id}`);
  };

  if (loading)
    return (
      <div style={S.page}>
        <div style={S.grid}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 260, borderRadius: 16 }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div style={S.page}>
      {modal && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                ...S.modalIconWrap,
                background:
                  modal === "deleted"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(245,158,11,0.1)",
                border: `1px solid ${modal === "deleted" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
              }}
            >
              {modal === "deleted" ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="#f87171"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <h3 style={S.modalTitle}>
              {modal === "deleted" ? "Course Removed" : "Under Maintenance"}
            </h3>
            <p style={S.modalMsg}>
              {modal === "deleted"
                ? "This course has been removed by the mentor. Your progress and certificates are safely preserved."
                : "This course is temporarily under maintenance. Please check back later."}
            </p>
            <button onClick={() => setModal(null)} style={S.modalBtn}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div style={S.header}>
        <div>
          <h1 style={S.title}>My Learning</h1>
          <p style={S.subtitle}>Continue where you left off</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/candidate/catalog")}
            style={S.browseBtn}
          >
            Browse Courses
          </button>
        </div>
      </div>

      <ActivityHeatmap
        activityMap={activityMap}
        totalDays={totalDays}
        totalModules={totalModules}
      />

      {enrollments.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 style={S.emptyTitle}>No courses yet</h3>
          <p style={S.emptySub}>Start learning by enrolling in a course</p>
          <button
            onClick={() => navigate("/candidate/catalog")}
            style={S.emptyBtn}
          >
            Explore Courses
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {enrollments.map((en) => {
            const data = en.course || en.courseSnapshot || {};
            const isDeleted = !en.course;
            const isUnpublished =
              en.course && !en.course?.settings?.isPublished;
            const isCompleted =
              en.progress === 100 || en.status === "completed";
            const cert = certificates.find(
              (c) =>
                (c.course && en.course && c.course === en.course._id) ||
                c.enrollment === en._id,
            );
            const courseId = en.course?._id || en.course;

            return (
              <div key={en._id} style={S.card}>
                <CourseCover
                  src={data.coverImage || data.thumbnail}
                  title={data.title}
                  style={S.cardCover}
                />
                <div style={S.cardBody}>
                  <div style={S.cardTitleRow}>
                    <h3 style={S.courseTitle}>
                      {data.title || "Unknown Course"}
                    </h3>
                    <div style={S.badges}>
                      {isDeleted && <span style={S.removedBadge}>Removed</span>}
                      <span
                        style={{
                          ...S.statusBadge,
                          background: isCompleted
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(99,102,241,0.1)",
                          color: isCompleted ? "#10b981" : "#818cf8",
                          border: `1px solid ${isCompleted ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}`,
                        }}
                      >
                        {isCompleted ? "Completed" : en.status || "Active"}
                      </span>
                    </div>
                  </div>
                  <p style={S.courseDesc}>
                    {data.description || "No description available."}
                  </p>
                </div>
                <div style={S.cardFoot}>
                  <div style={S.progressSection}>
                    <div style={S.progressBar}>
                      <div
                        style={{
                          ...S.progressFill,
                          width: `${en.progress || 0}%`,
                        }}
                      />
                    </div>
                    <span style={S.progressText}>
                      {en.progress || 0}% complete
                    </span>
                  </div>
                  <div style={S.actions}>
                    <button
                      onClick={() => handleContinue(en)}
                      style={{
                        ...S.continueBtn,
                        opacity: isDeleted || isUnpublished ? 0.5 : 1,
                      }}
                    >
                      {isDeleted
                        ? "Course Removed"
                        : isCompleted
                          ? "Review Course"
                          : "Continue Learning"}
                    </button>
                    {isCompleted &&
                      (cert ? (
                        <button
                          onClick={() => navigate("/candidate/my-certificates")}
                          style={S.certBtn}
                        >
                          View Certificate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClaim(courseId)}
                          disabled={claiming === courseId || !courseId}
                          style={S.claimBtn}
                        >
                          {claiming === courseId
                            ? "Claiming…"
                            : "Claim Certificate"}
                        </button>
                      ))}
                  </div>
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
  page: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "2.5rem 2rem",
    minHeight: "80vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    color: "var(--text-primary)",
    letterSpacing: "-0.03em",
  },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", marginTop: 4 },
  browseBtn: {
    padding: "0.6rem 1.5rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "5rem 2rem",
    background: "var(--bg-card)",
    borderRadius: 20,
    border: "1px dashed var(--border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.5rem",
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)" },
  emptySub: { fontSize: 14, color: "var(--text-secondary)" },
  emptyBtn: {
    marginTop: "0.5rem",
    padding: "0.75rem 2rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  cardCover: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    display: "block",
    flexShrink: 0,
  },
  cardBody: { padding: "1.25rem 1.25rem 0.75rem", flex: 1 },
  cardTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginBottom: "0.5rem",
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-primary)",
    flex: 1,
    lineHeight: 1.4,
  },
  badges: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
    flexShrink: 0,
  },
  removedBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#f87171",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 99,
    padding: "2px 8px",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 99,
    padding: "2px 8px",
    textTransform: "capitalize",
  },
  courseDesc: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  cardFoot: {
    padding: "0.875rem 1.25rem 1.25rem",
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  },
  progressSection: { display: "flex", flexDirection: "column", gap: 5 },
  progressBar: {
    height: 4,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #22d3ee)",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  progressText: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  actions: { display: "flex", gap: "0.625rem" },
  continueBtn: {
    flex: 1,
    padding: "0.6rem",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  claimBtn: {
    flex: 1,
    padding: "0.6rem",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  certBtn: {
    flex: 1,
    padding: "0.6rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "2.5rem",
    maxWidth: 400,
    width: "90%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.875rem",
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 19, fontWeight: 700, color: "var(--text-primary)" },
  modalMsg: {
    fontSize: 14,
    color: "var(--text-secondary)",
    lineHeight: 1.65,
    marginBottom: "0.5rem",
  },
  modalBtn: {
    padding: "0.75rem 2rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
