import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { recordChapterComplete } from "./MyLearning";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

function resolveUrl(url) {
  if (!url) return "";
  // Already a full URL
  if (url.startsWith("http")) {
    try {
      new URL(url);
      return url;
    } catch {
      return "";
    }
  }
  // Relative path - prepend API_BASE
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  // If it doesn't start with /, add it
  return `${API_BASE}/${url}`;
}

function getYTEmbed(url) {
  if (url.includes("watch?v="))
    return `https://www.youtube.com/embed/${url.split("watch?v=")[1]?.split("&")[0]}`;
  if (url.includes("youtu.be/"))
    return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]?.split("?")[0]}`;
  return url;
}

function ChapterIcon({ type, done, active }) {
  const col = active ? "white" : done ? "#10b981" : "var(--text-muted)";
  if (done)
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke={col}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (type === "video" || type === "video_upload")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <polygon points="5,3 19,12 5,21" fill={col} />
      </svg>
    );
  if (type === "notes_upload")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke={col}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2v6h6"
          stroke={col}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (type === "link")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
          stroke={col}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
          stroke={col}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={col}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LearningInterface() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [modules, setModules] = useState([]);
  const [current, setCurrent] = useState(null);
  const [currentMod, setCurrentMod] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: "ai", text: "Hi! Ask me anything about this course." },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const prevRef = useRef(null);
  const aiEndRef = useRef(null);

  useEffect(() => {
    load();
  }, [enrollmentId]);
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiOpen]);

  const load = async () => {
    try {
      const res = await apiClient.get(`/enrollments/${enrollmentId}`);
      setEnrollment(res.data.data);
      const mods = res.data.data.course?.modules || [];
      setModules(mods);
      if (mods[0]?.content?.[0]) {
        setCurrent(mods[0].content[0]);
        setCurrentMod(mods[0]);
        prevRef.current = { content: mods[0].content[0], mod: mods[0] };
      }
      await fetchProgress();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await apiClient.get(`/progress/${enrollmentId}`);
      const map = {};
      (res.data.data?.completedContent || []).forEach((c) => {
        map[c._id || c] = true;
      });
      setProgress(map);
    } catch {}
  };

  const autoMark = async (contentId, modId) => {
    if (!contentId || !modId) return;
    try {
      await apiClient.put(`/progress/${enrollmentId}/content/${contentId}`, {
        moduleId: modId,
      });
      setProgress((p) => ({ ...p, [contentId]: true }));
      recordChapterComplete(contentId);
      fetchProgress();
    } catch {}
  };

  const handleSelect = (mod, content) => {
    if (prevRef.current && prevRef.current.content._id !== content._id) {
      autoMark(prevRef.current.content._id, prevRef.current.mod._id);
    }
    prevRef.current = { content, mod };
    setCurrent(content);
    setCurrentMod(mod);
  };

  const markComplete = async () => {
    if (!current || !currentMod) return;
    try {
      await apiClient.put(`/progress/${enrollmentId}/content/${current._id}`, {
        moduleId: currentMod._id,
      });
      setProgress((p) => ({ ...p, [current._id]: true }));
      recordChapterComplete(current._id);
      await fetchProgress();
    } catch {}
  };

  const sendAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiMessages((m) => [...m, { role: "user", text: msg }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await apiClient.post("/ai/chat", {
        question: msg,
        courseId: enrollment?.course?._id,
      });
      setAiMessages((m) => [...m, { role: "ai", text: res.data.data.answer }]);
    } catch {
      setAiMessages((m) => [
        ...m,
        { role: "error", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const total = modules.reduce((a, m) => a + (m.content?.length || 0), 0);
  const done = Object.keys(progress).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) return <div style={S.loading}>Loading course…</div>;
  if (!enrollment) return <div style={S.loading}>Enrollment not found</div>;

  return (
    <div style={S.container}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHead}>
          <button
            onClick={() => navigate("/candidate/my-learning")}
            style={S.backBtn}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginRight: 5 }}
            >
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            My Learning
          </button>
          <h2 style={S.sidebarTitle}>{enrollment.course?.title}</h2>
          <div style={S.progressWrap}>
            <div style={S.progressBar}>
              <div style={{ ...S.progressFill, width: `${pct}%` }} />
            </div>
            <span style={S.progressLabel}>{pct}% Complete</span>
          </div>
        </div>
        <div style={S.moduleList}>
          {modules.map((mod, mi) => (
            <div key={mod._id} style={S.modGroup}>
              <div style={S.modHeader}>
                <span style={S.modNum}>Module {mi + 1}</span>
                <span style={S.modTitle}>{mod.title}</span>
              </div>
              {mod.content?.map((c) => {
                const isActive = current?._id === c._id;
                const isDone = !!progress[c._id];
                return (
                  <div
                    key={c._id}
                    onClick={() => handleSelect(mod, c)}
                    style={{
                      ...S.chapter,
                      ...(isActive
                        ? S.chapterActive
                        : isDone
                          ? S.chapterDone
                          : {}),
                    }}
                  >
                    <span style={S.chapterIcon}>
                      <ChapterIcon
                        type={c.type}
                        done={isDone}
                        active={isActive}
                      />
                    </span>
                    <span
                      style={{
                        ...S.chapterLabel,
                        color: isActive
                          ? "white"
                          : isDone
                            ? "#10b981"
                            : "var(--text-secondary)",
                      }}
                    >
                      {c.title}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {current ? (
          <>
            <div style={S.contentHead}>
              <div>
                <p style={S.breadcrumb}>{currentMod?.title}</p>
                <h1 style={S.contentTitle}>{current.title}</h1>
              </div>
              <button
                onClick={markComplete}
                disabled={!!progress[current._id]}
                style={progress[current._id] ? S.doneBtnDone : S.doneBtn}
              >
                {progress[current._id] ? (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginRight: 5 }}
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Completed
                  </>
                ) : (
                  "Mark Complete"
                )}
              </button>
            </div>

            <div style={S.contentBody}>
              {current.description && (
                <p style={S.desc}>{current.description}</p>
              )}

              {(current.type === "video" || current.type === "video_upload") &&
                current.data?.url &&
                (() => {
                  const url = resolveUrl(current.data.url);
                  const isYT =
                    url.includes("youtube.com") || url.includes("youtu.be");
                  return (
                    <div style={S.videoWrap}>
                      {isYT ? (
                        <iframe
                          src={getYTEmbed(url)}
                          style={S.video}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          frameBorder="0"
                        />
                      ) : (
                        <video controls style={S.video} src={url} key={url} />
                      )}
                    </div>
                  );
                })()}

              {current.type === "notes_upload" && current.data?.url && (
                <div style={S.resourceBox}>
                  <p style={S.resourceLabel}>Resource Attachment</p>
                  <a
                    href={resolveUrl(current.data.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.resourceLink}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginRight: 8 }}
                    >
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {current.data.filename || "Download File"}
                  </a>
                </div>
              )}

              {current.type === "text" && current.data?.htmlContent && (
                <div
                  style={S.textContent}
                  dangerouslySetInnerHTML={{ __html: current.data.htmlContent }}
                />
              )}

              {current.type === "link" && current.data?.externalUrl && (
                <div style={S.resourceBox}>
                  <p style={S.resourceLabel}>External Resource</p>
                  <a
                    href={current.data.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.resourceLink}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginRight: 8 }}
                    >
                      <path
                        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {current.data.externalUrl}
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
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
            <p style={S.emptyText}>Select a chapter to start learning</p>
          </div>
        )}
      </main>

      {/* AI Assistant */}
      <button
        onClick={() => setAiOpen((o) => !o)}
        style={S.aiTrigger}
        title="AI Learning Assistant"
      >
        {aiOpen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span style={{ marginLeft: 6 }}>{aiOpen ? "Close" : "AI Help"}</span>
      </button>

      {aiOpen && (
        <div style={S.aiWindow}>
          <div style={S.aiHead}>
            <span style={S.aiTitle}>AI Learning Assistant</span>
            <span style={S.aiOnline}>
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  marginRight: 5,
                }}
              />
              Online
            </span>
          </div>
          <div style={S.aiMessages}>
            {aiMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...S.bubble,
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                      : "rgba(255,255,255,0.06)",
                  color: m.role === "user" ? "white" : "var(--text-primary)",
                }}
              >
                {m.text}
              </div>
            ))}
            {aiLoading && <div style={S.typing}>Thinking…</div>}
            <div ref={aiEndRef} />
          </div>
          <form onSubmit={sendAi} style={S.aiForm}>
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask a question…"
              style={S.aiInput}
              disabled={aiLoading}
            />
            <button type="submit" disabled={aiLoading} style={S.aiSend}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const S = {
  container: {
    display: "flex",
    height: "100vh",
    background: "var(--bg-base)",
    overflow: "hidden",
    position: "relative",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "var(--text-secondary)",
    fontSize: 18,
  },

  sidebar: {
    width: 300,
    minWidth: 300,
    background: "var(--bg-surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  sidebarHead: {
    padding: "1.25rem",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "0 0 0.75rem",
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    marginBottom: "0.875rem",
  },
  progressWrap: { display: "flex", flexDirection: "column", gap: 5 },
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
  progressLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  moduleList: { padding: "0.75rem", overflowY: "auto", flex: 1 },
  modGroup: { marginBottom: "1.25rem" },
  modHeader: { paddingLeft: 8, marginBottom: "0.4rem" },
  modNum: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  modTitle: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  chapter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0.55rem 0.75rem",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 2,
    transition: "background 0.15s",
  },
  chapterActive: {
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  chapterDone: { background: "rgba(16,185,129,0.1)" },
  chapterIcon: {
    width: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chapterLabel: { fontSize: 13, lineHeight: 1.4, fontWeight: 500 },

  main: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  contentHead: {
    background: "var(--bg-surface)",
    borderBottom: "1px solid var(--border)",
    padding: "1.25rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 5,
    flexShrink: 0,
  },
  breadcrumb: {
    fontSize: 11,
    color: "var(--text-muted)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  doneBtn: {
    display: "flex",
    alignItems: "center",
    padding: "0.55rem 1.25rem",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  doneBtnDone: {
    display: "flex",
    alignItems: "center",
    padding: "0.55rem 1.25rem",
    background: "rgba(16,185,129,0.1)",
    color: "#10b981",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "default",
    whiteSpace: "nowrap",
  },

  contentBody: {
    padding: "2rem",
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
    flex: 1,
  },
  desc: {
    fontSize: 15,
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    marginBottom: "1.5rem",
    background: "var(--bg-card)",
    padding: "1.25rem 1.5rem",
    borderRadius: 10,
    border: "1px solid var(--border)",
  },
  videoWrap: {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%",
    background: "#000",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: 0,
  },
  textContent: {
    fontSize: 15,
    lineHeight: 1.85,
    color: "var(--text-secondary)",
    background: "var(--bg-card)",
    padding: "2rem",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },
  resourceBox: {
    textAlign: "center",
    padding: "3rem",
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },
  resourceLabel: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginBottom: "1rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  resourceLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.875rem 2rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    textDecoration: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    gap: "1rem",
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
  },
  emptyText: { fontSize: 15, color: "var(--text-muted)", fontWeight: 500 },

  aiTrigger: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0.75rem 1.25rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 99,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    zIndex: 200,
    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
  },
  aiWindow: {
    position: "fixed",
    bottom: "5.5rem",
    right: "2rem",
    width: 340,
    height: 480,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
  },
  aiHead: {
    padding: "1rem 1.25rem",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiTitle: { fontSize: 14, fontWeight: 700, color: "var(--text-primary)" },
  aiOnline: {
    display: "flex",
    alignItems: "center",
    fontSize: 11,
    color: "#10b981",
    fontWeight: 600,
  },
  aiMessages: {
    flex: 1,
    padding: "1rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  bubble: {
    maxWidth: "85%",
    padding: "0.75rem 1rem",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
  },
  typing: { alignSelf: "flex-start", color: "var(--text-muted)", fontSize: 12 },
  aiForm: {
    padding: "0.875rem",
    borderTop: "1px solid var(--border)",
    display: "flex",
    gap: 8,
  },
  aiInput: {
    flex: 1,
    padding: "0.65rem 0.875rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
  },
  aiSend: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.65rem 1rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
