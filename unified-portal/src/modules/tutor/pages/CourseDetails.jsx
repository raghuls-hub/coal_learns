import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => { fetchData(); }, [courseId]);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/courses/${courseId}/modules`),
      ]);
      setCourse(cRes.data.data);
      const mods = cRes.data.data.modules?.length && typeof cRes.data.data.modules[0] === 'object'
        ? cRes.data.data.modules
        : mRes.data.data || [];
      setModules(mods);
    } catch {}
    finally { setLoading(false); }
  };

  const createModule = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/courses/${courseId}/modules`, { title: newTitle, order: modules.length + 1 });
      setNewTitle(''); setShowForm(false); fetchData();
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

  if (loading) return <div style={S.loading}>Loading…</div>;
  if (!course) return <div style={S.loading}>Course not found</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>{course.title}</h1>
          <p style={S.subtitle}>{course.category} · {course.level}</p>
        </div>
        <button onClick={() => setShowForm(true)} style={S.addBtn}>+ Add Module</button>
      </div>

      {showForm && (
        <div style={S.formCard}>
          <h3 style={S.formTitle}>Add New Module</h3>
          <form onSubmit={createModule} style={S.form}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required style={S.input} placeholder="Module title…" autoFocus />
            <div style={S.formActions}>
              <button type="submit" style={S.submitBtn}>Create Module</button>
              <button type="button" onClick={() => setShowForm(false)} style={S.cancelBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={S.moduleList}>
        {modules.length === 0 ? (
          <div style={S.empty}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>No modules yet. Start structuring your course!</p>
          </div>
        ) : modules.map((mod, i) => (
          <div key={mod._id}>
            {editingId === mod._id ? (
              <div style={S.editRow}>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...S.input, flex: 1 }} autoFocus />
                <button onClick={(e) => editModule(mod._id, e)} style={S.submitBtn}>Save</button>
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

const S = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)', fontSize: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 },
  addBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },

  formCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' },
  form: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  input: { padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', minWidth: 200 },
  formActions: { display: 'flex', gap: '0.75rem' },
  submitBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  moduleList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: { textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 },
  moduleCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #6366f1', borderRadius: 12, padding: '1.5rem 1.75rem', cursor: 'pointer', transition: 'border-color 0.2s' },
  moduleLeft: { display: 'flex', flexDirection: 'column', gap: 4 },
  moduleNum: { fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' },
  moduleTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' },
  moduleCount: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
  moduleActions: { display: 'flex', gap: '0.5rem' },
  iconBtn: { padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  editRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', flexWrap: 'wrap' },
};
