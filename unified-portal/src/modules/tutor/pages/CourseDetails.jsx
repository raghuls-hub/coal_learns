import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
function resolveCover(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const CATEGORIES = ['Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'DevOps', 'Mobile', 'Other'];

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Module form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Cover edit
  const [showCoverEdit, setShowCoverEdit] = useState(false);
  const [coverMode, setCoverMode] = useState('url');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverSaving, setCoverSaving] = useState(false);

  useEffect(() => { fetchData(); }, [courseId]);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/courses/${courseId}/modules`),
      ]);
      const c = cRes.data.data;
      setCourse(c);
      const resolvedCover = resolveCover(c.coverImage || c.thumbnail) || '';
      setCoverUrl(resolvedCover);
      setCoverPreview(resolvedCover);
      const mods = c.modules?.length && typeof c.modules[0] === 'object' ? c.modules : mRes.data.data || [];
      setModules(mods);
    } catch {}
    finally { setLoading(false); }
  };

  const createModule = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/courses/${courseId}/modules`, { title: newTitle, order: modules.length + 1 });
      setNewTitle(''); setShowModuleForm(false); fetchData();
    } catch { alert('Failed to create module'); }
  };

  const editModule = async (modId, e) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/courses/${courseId}/modules/${modId}`, { title: editTitle });
      setEditingId(null); fetchData();
    } catch { alert('Failed to update module'); }
  };

  const deleteModule = async (modId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this module and all its content?')) return;
    try { await apiClient.delete(`/courses/${courseId}/modules/${modId}`); fetchData(); }
    catch { alert('Failed to delete module'); }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setCoverUploading(true);
    try {
      const res = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.url || '';
      const resolved = url.startsWith('http') ? url : `${API_BASE}${url}`;
      setCoverUrl(resolved);
      setCoverPreview(resolved);
    } catch { alert('Upload failed'); }
    finally { setCoverUploading(false); }
  };

  const saveCover = async () => {
    setCoverSaving(true);
    try {
      await apiClient.put(`/courses/${courseId}`, { coverImage: coverUrl });
      setCourse(c => ({ ...c, coverImage: coverUrl }));
      setShowCoverEdit(false);
    } catch { alert('Failed to save cover'); }
    finally { setCoverSaving(false); }
  };

  if (loading) return <div style={S.loading}>Loading…</div>;
  if (!course) return <div style={S.loading}>Course not found</div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          {/* Cover thumbnail */}
          <div style={S.coverThumb}>
            {course.coverImage || course.thumbnail
              ? <img src={resolveCover(course.coverImage || course.thumbnail)} alt="cover" style={S.coverThumbImg} onError={e => e.target.style.display = 'none'} />
              : <div style={S.coverThumbPlaceholder}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" opacity="0.4">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="white" strokeWidth="1.5"/>
                    <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
            }
          </div>
          <div>
            <h1 style={S.title}>{course.title}</h1>
            <p style={S.subtitle}>{course.category} · {course.level}</p>
          </div>
        </div>
        <div style={S.headerActions}>
          <button onClick={() => setShowCoverEdit(v => !v)} style={S.coverEditBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit Cover
          </button>
          <button onClick={() => setShowModuleForm(true)} style={S.addBtn}>+ Add Module</button>
        </div>
      </div>

      {/* Cover Edit Panel */}
      {showCoverEdit && (
        <div style={S.coverPanel}>
          <p style={S.panelTitle}>Update Course Cover Image</p>
          <div style={S.coverToggle}>
            <button type="button" onClick={() => setCoverMode('url')} style={{ ...S.toggleBtn, ...(coverMode === 'url' ? S.toggleActive : {}) }}>Image URL</button>
            <button type="button" onClick={() => setCoverMode('upload')} style={{ ...S.toggleBtn, ...(coverMode === 'upload' ? S.toggleActive : {}) }}>Upload File</button>
          </div>
          {coverMode === 'url' ? (
            <div style={F.group}>
              <label style={F.label}>Image URL</label>
              <input
                value={coverUrl}
                onChange={e => { setCoverUrl(e.target.value); setCoverPreview(e.target.value); }}
                style={F.input}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          ) : (
            <div style={S.uploadZone}>
              <input type="file" accept="image/*" onChange={handleCoverUpload} id="cover-edit-upload" style={{ display: 'none' }} />
              <label htmlFor="cover-edit-upload" style={S.uploadLabel}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {coverUploading ? 'Uploading…' : 'Click to upload image'}
                </span>
              </label>
            </div>
          )}
          {coverPreview && (
            <img src={coverPreview} alt="preview" style={S.coverPreviewImg} onError={() => setCoverPreview('')} />
          )}
          <div style={S.panelActions}>
            <button onClick={saveCover} disabled={coverSaving} style={S.saveBtn}>
              {coverSaving ? 'Saving…' : 'Save Cover'}
            </button>
            <button onClick={() => setShowCoverEdit(false)} style={S.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Module Form */}
      {showModuleForm && (
        <div style={S.formCard}>
          <p style={S.panelTitle}>Add New Module</p>
          <form onSubmit={createModule} style={S.inlineForm}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required style={{ ...F.input, flex: 1 }} placeholder="Module title…" autoFocus />
            <button type="submit" style={S.saveBtn}>Create</button>
            <button type="button" onClick={() => setShowModuleForm(false)} style={S.cancelBtn}>Cancel</button>
          </form>
        </div>
      )}

      {/* Module List */}
      <div style={S.moduleList}>
        {modules.length === 0 ? (
          <div style={S.empty}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No modules yet. Start structuring your course!</p>
          </div>
        ) : modules.map((mod, i) => (
          <div key={mod._id}>
            {editingId === mod._id ? (
              <div style={S.editRow}>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...F.input, flex: 1 }} autoFocus />
                <button onClick={(e) => editModule(mod._id, e)} style={S.saveBtn}>Save</button>
                <button onClick={() => setEditingId(null)} style={S.cancelBtn}>Cancel</button>
              </div>
            ) : (
              <div style={S.moduleCard} onClick={() => navigate(`/tutor/course/${courseId}/module/${mod._id}`)}>
                <div style={S.moduleLeft}>
                  <span style={S.moduleNum}>Module {i + 1}</span>
                  <h3 style={S.moduleTitle}>{mod.title}</h3>
                  <span style={S.moduleCount}>{mod.content?.length || 0} chapters</span>
                </div>
                <div style={S.moduleActions}>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(mod._id); setEditTitle(mod.title); }} style={S.iconBtn}>Edit</button>
                  <button onClick={(e) => deleteModule(mod._id, e)} style={{ ...S.iconBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const F = {
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
};

const S = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)', fontSize: 16 },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  coverThumb: { width: 64, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' },
  coverThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverThumbPlaceholder: { width: '100%', height: '100%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 3 },
  subtitle: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 },
  headerActions: { display: 'flex', gap: '0.75rem', flexShrink: 0 },
  coverEditBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  addBtn: { padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  coverPanel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  panelTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  coverToggle: { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, width: 'fit-content' },
  toggleBtn: { padding: '0.4rem 1rem', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' },
  toggleActive: { background: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  uploadZone: { border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 10 },
  uploadLabel: { display: 'flex', alignItems: 'center', gap: 10, padding: '1.25rem', cursor: 'pointer' },
  coverPreviewImg: { width: 180, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' },
  panelActions: { display: 'flex', gap: '0.75rem' },
  saveBtn: { padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '0.65rem 1.25rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  formCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' },
  inlineForm: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' },

  moduleList: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  empty: { textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 },
  moduleCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #6366f1', borderRadius: 12, padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'border-color 0.2s' },
  moduleLeft: { display: 'flex', flexDirection: 'column', gap: 4 },
  moduleNum: { fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' },
  moduleTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  moduleCount: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  moduleActions: { display: 'flex', gap: '0.5rem' },
  iconBtn: { padding: '0.45rem 0.875rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  editRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', flexWrap: 'wrap' },
};
