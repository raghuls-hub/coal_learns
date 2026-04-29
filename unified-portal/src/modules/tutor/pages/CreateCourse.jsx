import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner', pricing: { amount: 0, currency: 'INR' } });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/courses', form);
      navigate('/tutor/my-courses');
    } catch (err) {
      alert('Failed to create course: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.layout}>
        <div style={S.formCard}>
          <h1 style={S.title}>Create New Course</h1>
          <p style={S.subtitle}>Fill in the details below. You can add modules and content after creation.</p>

          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.section}>
              <h3 style={S.sectionTitle}>Basic Information</h3>
              <div style={S.group}>
                <label style={S.label}>Course Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required style={S.input} placeholder="e.g., Introduction to Web Development" />
              </div>
              <div style={S.group}>
                <label style={S.label}>Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} required style={S.textarea} rows={5} placeholder="Describe what students will learn…" />
              </div>
              <div style={S.row}>
                <div style={S.group}>
                  <label style={S.label}>Category *</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)} required style={S.input} placeholder="e.g., Programming, Design" />
                </div>
                <div style={S.group}>
                  <label style={S.label}>Level *</label>
                  <select value={form.level} onChange={e => set('level', e.target.value)} style={S.select}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={S.section}>
              <h3 style={S.sectionTitle}>Pricing</h3>
              <div style={S.group}>
                <label style={S.label}>Price (₹)</label>
                <input type="number" min="0" step="0.01" value={form.pricing.amount}
                  onChange={e => set('pricing', { ...form.pricing, amount: parseFloat(e.target.value) || 0 })}
                  style={S.input} placeholder="0 for free" />
                <span style={S.hint}>Set to 0 to make the course free</span>
              </div>
            </div>

            <div style={S.actions}>
              <button type="button" onClick={() => navigate('/tutor/my-courses')} style={S.cancelBtn}>Cancel</button>
              <button type="submit" disabled={loading} style={S.submitBtn}>
                {loading ? 'Creating…' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>

        <div style={S.infoCard}>
          <h3 style={S.infoTitle}>Next Steps</h3>
          <ol style={S.steps}>
            {['Create the course with basic info', 'Add modules to structure content', 'Upload videos, PDFs, and notes', 'Review and publish your course'].map((s, i) => (
              <li key={i} style={S.step}>
                <span style={S.stepNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  layout: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem' },
  title: { fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.5rem' },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', width: '100%' },
  textarea: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', resize: 'vertical', minHeight: 120, fontFamily: 'inherit', width: '100%' },
  select: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', appearance: 'none', width: '100%' },
  hint: { fontSize: 12, color: 'var(--text-muted)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.8rem 2rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  submitBtn: { padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' },

  infoCard: { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '2rem' },
  infoTitle: { fontSize: 16, fontWeight: 800, color: '#818cf8', marginBottom: '1.25rem' },
  steps: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  step: { display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 },
  stepNum: { width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#818cf8', flexShrink: 0 },
};
