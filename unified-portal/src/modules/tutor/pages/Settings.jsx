import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg }

  useEffect(() => {
    if (user?.profile) {
      setForm({ firstName: user.profile.firstName || '', lastName: user.profile.lastName || '', phone: user.profile.phone || '', bio: user.profile.bio || '' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await apiClient.put('/auth/profile', form);
      setStatus({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Profile Settings</h1>
      <div style={S.card}>
        {status && (
          <div style={{ ...S.alert, background: status.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: status.type === 'success' ? '#10b981' : '#f87171' }}>
            {status.msg}
          </div>
        )}
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.group}>
            <label style={S.label}>Email Address</label>
            <input type="email" value={user?.email || ''} disabled style={{ ...S.input, opacity: 0.5, cursor: 'not-allowed' }} />
            <span style={S.hint}>Email cannot be changed.</span>
          </div>
          <div style={S.row}>
            <div style={S.group}>
              <label style={S.label}>First Name</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required style={S.input} />
            </div>
            <div style={S.group}>
              <label style={S.label}>Last Name</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required style={S.input} />
            </div>
          </div>
          <div style={S.group}>
            <label style={S.label}>Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={S.input} placeholder="+91 …" />
          </div>
          <div style={S.group}>
            <label style={S.label}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={S.textarea} rows={4} maxLength={500} placeholder="Tell students about yourself…" />
          </div>
          <button type="submit" disabled={loading} style={S.submitBtn}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const S = {
  page: { padding: '2rem', maxWidth: 700, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '1.5rem' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem' },
  alert: { padding: '0.875rem 1rem', borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' },
  input: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', width: '100%' },
  textarea: { padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 15, outline: 'none', resize: 'vertical', fontFamily: 'inherit', width: '100%' },
  hint: { fontSize: 12, color: 'var(--text-muted)' },
  submitBtn: { padding: '0.875rem', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' },
};
