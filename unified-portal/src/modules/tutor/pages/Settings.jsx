import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.profile) {
      setFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        bio: user.profile.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await apiClient.put('/auth/profile', formData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>Profile Settings</h2>
      
      <div style={styles.card}>
        {success && <div style={styles.successMsg}>{success}</div>}
        {error && <div style={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}}
            />
            <small style={styles.hint}>Email cannot be changed.</small>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              maxLength="500"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2.5rem', maxWidth: '800px', margin: '0 auto' },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '2rem',
    letterSpacing: '-0.02em'
  },
  card: {
    background: 'var(--bg-surface)',
    padding: '2.5rem',
    borderRadius: '20px',
    border: '1px solid var(--border-dim)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '0.8rem 1rem',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-dim)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '0.8rem 1rem',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-dim)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  submitBtn: {
    padding: '1rem',
    background: 'var(--accent-gradient)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '1rem',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    transition: 'opacity 0.2s',
  },
  successMsg: {
    padding: '1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontSize: '14px',
    fontWeight: '600'
  },
  errorMsg: {
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontSize: '14px',
    fontWeight: '600'
  }
};
