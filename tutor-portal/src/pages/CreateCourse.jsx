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
    pricing: { amount: 0, currency: 'USD', commissionRate: 20 }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/api/courses', formData);
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
      <div style={styles.header}>
        <button onClick={() => navigate('/my-courses')} style={styles.backBtn}>
          ← Back to Courses
        </button>
      </div>

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
            
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Price (USD) *</label>
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

              <div style={styles.inputGroup}>
                <label style={styles.label}>Platform Commission (%)</label>
                <input
                  type="number"
                  value={formData.pricing.commissionRate}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    pricing: { ...formData.pricing, commissionRate: parseInt(e.target.value) || 20 }
                  })}
                  style={styles.input}
                  min="0"
                  max="100"
                />
                <small style={styles.hint}>You'll earn {100 - formData.pricing.commissionRate}% of each sale</small>
              </div>
            </div>

            <div style={styles.revenuePreview}>
              <p>💰 Your earnings per sale: <strong>${(formData.pricing.amount * (100 - formData.pricing.commissionRate) / 100).toFixed(2)}</strong></p>
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
        <h3 style={styles.infoTitle}>📝 Next Steps After Creation</h3>
        <ol style={styles.stepsList}>
          <li>Add modules to structure your course content</li>
          <li>Upload videos, PDFs, and other learning materials</li>
          <li>Create assessments to test student knowledge</li>
          <li>Review and publish your course</li>
          <li>Share your course with students!</li>
        </ol>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: '#f7fafc' },
  header: { marginBottom: '2rem' },
  backBtn: { padding: '0.5rem 1rem', background: 'white', color: '#48bb78', border: '1px solid #48bb78', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  formCard: { background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' },
  subtitle: { color: '#718096', marginBottom: '2rem', lineHeight: '1.6' },
  form: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#1a202c' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '14px', fontWeight: '500', color: '#4a5568' },
  input: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' },
  textarea: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit', resize: 'vertical' },
  select: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px' },
  hint: { color: '#718096', fontSize: '12px' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' },
  revenuePreview: { padding: '1rem', background: '#f0fff4', borderRadius: '8px', color: '#22543d', borderLeft: '4px solid #48bb78' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.875rem 2rem', background: 'white', color: '#718096', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  infoCard: { background: '#edf2f7', padding: '2rem', borderRadius: '12px' },
  infoTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1rem', color: '#1a202c' },
  stepsList: { paddingLeft: '1.5rem', lineHeight: '2', color: '#4a5568' },
};
