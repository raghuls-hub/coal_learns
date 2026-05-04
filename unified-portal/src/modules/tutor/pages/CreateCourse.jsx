import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");
function resolveCover(url) {
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

const CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Data Science",
  "DevOps",
  "Mobile",
  "Other",
];

function StyledSelect({ value, onChange, options, label, required }) {
  return (
    <div style={F.group}>
      {label && (
        <label style={F.label}>
          {label}
          {required && <span style={F.req}> *</span>}
        </label>
      )}
      <div style={F.selectWrap}>
        <select
          value={value}
          onChange={onChange}
          required={required}
          style={F.select}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          style={F.selectArrow}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function CreateCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    pricing: { amount: 0, currency: "INR" },
    coverImage: "",
  });
  const [coverMode, setCoverMode] = useState("url"); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await apiClient.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.url || "";
      const resolved = resolveCover(url);
      set("coverImage", resolved);
      setCoverPreview(resolved);
    } catch {
      alert("Cover upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUrl = (url) => {
    set("coverImage", url);
    setCoverPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/courses", form);
      navigate("/tutor/my-courses");
    } catch (err) {
      alert(
        "Failed to create course: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <div style={S.formCard}>
          <h1 style={S.title}>Create New Course</h1>
          <p style={S.subtitle}>
            Fill in the details below. You can add modules and content after
            creation.
          </p>

          <form onSubmit={handleSubmit} style={S.form}>
            {/* Basic Info */}
            <div style={S.section}>
              <p style={S.sectionLabel}>Basic Information</p>
              <div style={F.group}>
                <label style={F.label}>
                  Course Title <span style={F.req}>*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  style={F.input}
                  placeholder="e.g., Introduction to Web Development"
                />
              </div>
              <div style={F.group}>
                <label style={F.label}>
                  Description <span style={F.req}>*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  required
                  style={F.textarea}
                  rows={5}
                  placeholder="Describe what students will learn in this course…"
                />
              </div>
              <div style={S.row2}>
                <div style={F.group}>
                  <label style={F.label}>
                    Category <span style={F.req}>*</span>
                  </label>
                  <div style={F.selectWrap}>
                    <select
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      required
                      style={F.select}
                    >
                      <option value="">Select category…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <svg
                      style={F.selectArrow}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="var(--text-muted)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <StyledSelect
                  label="Level"
                  required
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                  options={[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div style={S.section}>
              <p style={S.sectionLabel}>Course Cover Image</p>
              <div style={S.coverToggle}>
                <button
                  type="button"
                  onClick={() => setCoverMode("url")}
                  style={{
                    ...S.toggleBtn,
                    ...(coverMode === "url" ? S.toggleActive : {}),
                  }}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode("upload")}
                  style={{
                    ...S.toggleBtn,
                    ...(coverMode === "upload" ? S.toggleActive : {}),
                  }}
                >
                  Upload File
                </button>
              </div>
              {coverMode === "url" ? (
                <div style={F.group}>
                  <label style={F.label}>Image URL</label>
                  <input
                    value={form.coverImage}
                    onChange={(e) => handleCoverUrl(e.target.value)}
                    style={F.input}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
              ) : (
                <div style={S.uploadZone}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    id="cover-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="cover-upload" style={S.uploadLabel}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="var(--text-muted)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      style={{ fontSize: 14, color: "var(--text-secondary)" }}
                    >
                      {uploading ? "Uploading…" : "Click to upload cover image"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      PNG, JPG, WEBP up to 5MB
                    </span>
                  </label>
                </div>
              )}
              {coverPreview && (
                <div style={S.coverPreviewWrap}>
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    style={S.coverPreview}
                    onError={() => setCoverPreview("")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview("");
                      set("coverImage", "");
                    }}
                    style={S.removeCoverBtn}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div style={S.section}>
              <p style={S.sectionLabel}>Pricing</p>
              <div style={F.group}>
                <label style={F.label}>Price (₹)</label>
                <div style={F.inputPrefix}>
                  <span style={F.prefix}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.pricing.amount}
                    onChange={(e) =>
                      set("pricing", {
                        ...form.pricing,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{ ...F.input, paddingLeft: "2.5rem" }}
                    placeholder="0"
                  />
                </div>
                <span style={F.hint}>Set to 0 to make the course free</span>
              </div>
            </div>

            <div style={S.actions}>
              <button
                type="button"
                onClick={() => navigate("/tutor/my-courses")}
                style={S.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? "Creating…" : "Create Course"}
              </button>
            </div>
          </form>
        </div>

        <div style={S.infoCard}>
          <h3 style={S.infoTitle}>Next Steps</h3>
          <div style={S.steps}>
            {[
              ["01", "Create the course with basic info"],
              ["02", "Add modules to structure content"],
              ["03", "Upload videos, PDFs, and notes"],
              ["04", "Review and publish your course"],
            ].map(([n, text]) => (
              <div key={n} style={S.step}>
                <span style={S.stepNum}>{n}</span>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared form field styles
const F = {
  group: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  req: { color: "#f87171" },
  input: {
    padding: "0.8rem 1rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "0.8rem 1rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    minHeight: 120,
    fontFamily: "inherit",
    width: "100%",
    lineHeight: 1.6,
  },
  selectWrap: { position: "relative" },
  select: {
    width: "100%",
    padding: "0.8rem 2.5rem 0.8rem 1rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  selectArrow: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  inputPrefix: { position: "relative" },
  prefix: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    color: "var(--text-muted)",
    fontWeight: 600,
    pointerEvents: "none",
  },
  hint: { fontSize: 12, color: "var(--text-muted)" },
};

const S = {
  page: { padding: "2rem", maxWidth: 1000, margin: "0 auto" },
  layout: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "2.5rem",
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: "var(--text-primary)",
    letterSpacing: "-0.03em",
    marginBottom: "0.4rem",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginBottom: "2.5rem",
    lineHeight: 1.6,
  },
  form: { display: "flex", flexDirection: "column", gap: "2.5rem" },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    paddingBottom: "2rem",
    borderBottom: "1px solid var(--border)",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" },

  coverToggle: {
    display: "flex",
    gap: 6,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 4,
    width: "fit-content",
  },
  toggleBtn: {
    padding: "0.45rem 1.1rem",
    background: "transparent",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-muted)",
  },
  toggleActive: { background: "rgba(99,102,241,0.15)", color: "#818cf8" },

  uploadZone: {
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: 12,
    overflow: "hidden",
  },
  uploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "2rem",
    cursor: "pointer",
  },
  coverPreviewWrap: { display: "flex", alignItems: "flex-start", gap: "1rem" },
  coverPreview: {
    width: 200,
    height: 112,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid var(--border)",
  },
  removeCoverBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0.4rem 0.875rem",
    background: "rgba(239,68,68,0.08)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },

  actions: { display: "flex", gap: "1rem", justifyContent: "flex-end" },
  cancelBtn: {
    padding: "0.8rem 2rem",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "0.8rem 2rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
  },

  infoCard: {
    background: "rgba(99,102,241,0.05)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 16,
    padding: "2rem",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#818cf8",
    marginBottom: "1.25rem",
  },
  steps: { display: "flex", flexDirection: "column", gap: "0.875rem" },
  step: { display: "flex", alignItems: "center", gap: "0.875rem" },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#818cf8",
    flexShrink: 0,
    letterSpacing: "0.02em",
  },
};
