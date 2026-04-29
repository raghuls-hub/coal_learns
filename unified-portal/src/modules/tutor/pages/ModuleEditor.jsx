import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const TYPES = [
  { value: 'video', label: 'Video (URL)' },
  { value: 'video_upload', label: 'Video (Upload)' },
  { value: 'text', label: 'Notes / Text' },
  { value: 'notes_upload', label: 'File Upload (PDF/Doc/Image)' },
  { value: 'link', label: 'Reference Link' },
];

const TYPE_COLORS = { video: '#6366f1', video_upload: '#6366f1', text: '#22d3ee', notes_upload: '#f59e0b', link: '#10b981' };

export default function ModuleEditor() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'video', data: { url: '', htmlContent: '', externalUrl: '', fileId: '', filename: '' } });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchModule(); }, [moduleId]);

  const fetchModule = async () => {
    try {
      const res = await apiClient.get(`/courses/${courseId}/modules/${moduleId}`);
      setModule(res.data.data);
      const c = res.data.data.content;
      setContents(c?.length && typeof c[0] === 'object' ? c : []);
    } catch {}
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', type: 'video', data: { url: '', htmlContent: '', externalUrl: '', fileId: '', filename: '' } });
    setEditing(null);
    setShowForm(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await apiClient.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { fileId, filename, url } = res.data.data;
      setForm(f => ({ ...f, data: { ...f.data, fileId, filename, url } }));
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (uploading) return alert('Please wait for upload to complete');
    try {
      if (editing) {
        await apiClient.put(`/courses/content/${editing._id}`, form);
      } else {
        await apiClient.post(`/courses/${courseId}/modules/${moduleId}/content`, { ...form, order: contents.length + 1 });
      }
      resetForm();
      fetchModule();
    } catch { alert('Failed to save content'); }
  };

  const handleEdit = (c) => {
    setForm({ title: c.title, description: c.description || '', type: c.type, data: c.data });
    setEditing(c);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this chapter?')) return;
    try { await apiClient.delete(`/courses/content/${id}`); fetchModule(); }
    catch { alert('Failed to delete'); }
  };

  if (loading) return <div style={S.loading}>Loading…</div>;
  if (!module) return <div style={S.loading}>Module not found</div>;

  return (
    <div style={S.page}>
      <button onClick={() => navigate(`/tutor/course/${courseId}`)} style={S.backBtn}>
        ← Back to Course
      </button>

      <div style={S.header}>
        <h1 style={S.title}>{module.title}</h1>
        <button onClick={() => setShowForm(true)} style={S.addBtn}>+ Add Chapter</button>
      </div>

      {showForm && (
        <div style={S.formCard}>
          <h3 style={S.formTitle}>{editing ? 'Edit Chapter' : 'Add New Chapter'}</h3>
          <form onSubmit={handleSave} style={S.form}>
            <div style={S.group}>
              <label style={S.label}>Chapter Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={S.input} placeholder="Chapter title…" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={S.textarea} rows={3} placeholder="Optional description…" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Content Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={S.select}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {form.type === 'video' && (
              <div style={S.group}>
                <label style={S.label}>Video URL</label>
                <input value={form.data.url} onChange={e => setForm(f => ({ ...f, data: { ...f.data, url: e.target.value } }))} style={S.input} placeholder="YouTube or direct video URL…" />
              </div>
            )}
            {form.type === 'video_upload' && (
              <div style={S.uploadArea}>
                <input type="file" accept="video/*" onChange={handleUpload} style={S.fileInput} />
                {uploading && <p style={S.uploadingText}>Uploading video…</p>}
                {form.data.filename && <p style={S.uploadedText}>✓ {form.data.filename}</p>}
              </div>
            )}
            {form.type === 'text' && (
              <div style={S.group}>
                <label style={S.label}>Content (HTML/Markdown)</label>
                <textarea value={form.data.htmlContent} onChange={e => setForm(f => ({ ...f, data: { ...f.data, htmlContent: e.target.value } }))} style={{ ...S.textarea, minHeight: 160 }} placeholder="<p>Your content here…</p>" />
              </div>
            )}
            {form.type === 'notes_upload' && (
              <div style={S.uploadArea}>
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleUpload} style={S.fileInput} />
                {uploading && <p style={S.uploadingText}>Uploading file…</p>}
                {form.data.filename && <p style={S.uploadedText}>✓ {form.data.filename}</p>}
              </div>
            )}
            {form.type === 'link' && (
              <div style={S.group}>
                <label style={S.label}>Reference URL</label>
                <input value={form.data.externalUrl} onChange={e => setForm(f => ({ ...f, data: { ...f.data, externalUrl: e.target.value } }))} style={S.input} placeholder="https://…" />
              </div>
            )}

            <div style={S.formActions}>
              <button type="submit" style={S.submitBtn}>{editing ? 'Update' : 'Save'} Chapter</button>
              <button type="button" onClick={resetForm} style={S.cancelBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={S.list}>
        {contents.length === 0 ? (
          <div style={S.empty}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No chapters yet. Add your first chapter above.</p>
          </div>
        ) : contents.map((item, i) => (
          <div key={item._id} style={S.itemCard}>
            <span style={S.orderNum}>{i + 1}</span>
            <div style={S.itemInfo}>
              <h4 style={S.itemTitle}>{item.title}</h4>
              {item.description && <p style={S.itemDesc}>{item.description}</p>}
              <span style={{ ...S.typeBadge, background: `${TYPE_COLORS[item.type]}18`, color: TYPE_COLORS[item.type], border: `1px solid ${TYPE_COLORS[item.type]}30` }}>
                {item.type.replace('_', ' ')}
              </span>
            </div>
            <div style={S.itemActions}>
              <button onClick={() => handleEdit(item)} style={S.editBtn}>Edit</button>
              <button onClick={() => handleDelete(item._id)} style={S.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  page: { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)', fontSize: 16 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.6rem 1.25rem', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' },
  addBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  formCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '2rem', marginBottom: '2rem' },
  formTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%' },
  textarea: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 100, fontFamily: 'inherit', width: '100%' },
  select: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', appearance: 'none', width: '100%' },
  uploadArea: { padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--border)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  fileInput: { color: 'var(--text-secondary)', fontSize: 13 },
  uploadingText: { fontSize: 13, color: '#6366f1', fontWeight: 600 },
  uploadedText: { fontSize: 13, color: '#10b981', fontWeight: 600 },
  formActions: { display: 'flex', gap: '0.75rem' },
  submitBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: { textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 },
  itemCard: { display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' },
  orderNum: { width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#818cf8', fontSize: 14, flexShrink: 0 },
  itemInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  itemTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  itemDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
  typeBadge: { fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', textTransform: 'capitalize', width: 'fit-content', letterSpacing: '0.04em' },
  itemActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  editBtn: { padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  deleteBtn: { padding: '0.5rem 1rem', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
