import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    pricing: { amount: 0, currency: 'INR' }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/api/courses', formData);
      alert('Course created successfully!');
      navigate('/my-courses');
    } catch (error) {
      alert('Failed to create course: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>Create New Course</h1>
        <p style={styles.subtitle}>Fill in the details below to create your course. You can add modules and content after creation.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Course Title *</label>
              <input
                type="text"
                placeholder="e.g., Introduction to Web Development"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                placeholder="Provide a comprehensive description of what students will learn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                style={styles.textarea}
                rows="5"
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Programming, Business, Design"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Level *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  style={styles.select}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Pricing</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Price (₹) *</label>
              <input
                type="number"
                placeholder="99.99"
                value={formData.pricing.amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  pricing: { ...formData.pricing, amount: parseFloat(e.target.value) || 0 }
                })}
                required
                style={styles.input}
                min="0"
                step="0.01"
              />
              <small style={styles.hint}>Set your course price</small>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate('/my-courses')} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Next Steps After Creation</h3>
        <ol style={styles.stepsList}>
          <li>Add modules to structure your course content</li>
          <li>Upload videos, PDFs, and other learning materials</li>
          <li>Review and publish your course</li>
          <li>Share your course with students!</li>
        </ol>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2.5rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100%' },
  formCard: { 
    background: 'var(--bg-surface)', 
    padding: '3rem', 
    borderRadius: '24px', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', 
    marginBottom: '2.5rem' 
  },
  title: { fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.6rem', letterSpacing: '-0.025em' },
  subtitle: { color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-dim)' },
  sectionTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: { fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' },
  input: { 
    padding: '0.875rem 1.125rem', 
    background: 'rgba(15, 23, 42, 0.5)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    color: 'var(--text-primary)', 
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  },
  textarea: { 
    padding: '0.875rem 1.125rem', 
    background: 'rgba(15, 23, 42, 0.5)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    resize: 'vertical', 
    minHeight: '140px',
    transition: 'border-color 0.2s, background 0.2s',
  },
  select: { 
    padding: '0.875rem 1.125rem', 
    background: 'rgba(15, 23, 42, 0.5)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    appearance: 'none',
  },
  hint: { color: 'var(--text-muted)', fontSize: '12px', marginTop: '0.3rem' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' },
  actions: { display: 'flex', gap: '1.25rem', justifyContent: 'flex-end' },
  cancelBtn: { 
    padding: '0.9rem 2.25rem', 
    background: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    fontSize: '14px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitBtn: { 
    padding: '0.9rem 2.25rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '14px', 
    fontWeight: '800', 
    cursor: 'pointer', 
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s',
  },
  infoCard: { 
    background: 'rgba(99, 102, 241, 0.05)', 
    border: '1px solid rgba(99, 102, 241, 0.2)', 
    padding: '2.5rem', 
    borderRadius: '24px' 
  },
  infoTitle: { fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--accent-primary)' },
  stepsList: { paddingLeft: '1.5rem', lineHeight: '2.4', color: 'var(--text-secondary)', fontSize: '15px' },
};
