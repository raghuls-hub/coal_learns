import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'candidate',
    profile: { firstName: '', lastName: '' }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/users', formData);
      setShowCreateForm(false);
      setFormData({ email: '', password: '', role: 'candidate', profile: { firstName: '', lastName: '' } });
      fetchUsers();
    } catch (error) {
      alert('Failed to create user: ' + (error.response?.data?.error || error.message));
    }
  };

  const toggleStatus = async (userId) => {
    try {
      await apiClient.put(`/api/users/${userId}/status`);
      fetchUsers();
    } catch (error) {
      alert('Failed to toggle user status');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div style={styles.loading}>Loading users...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Create New User</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength="8"
              style={styles.input}
            />
            <input
              type="text"
              placeholder="First Name"
              value={formData.profile.firstName}
              onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, firstName: e.target.value } })}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.profile.lastName}
              onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, lastName: e.target.value } })}
              required
              style={styles.input}
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={styles.select}
            >
              <option value="candidate">Candidate</option>
              <option value="tutor">Tutor</option>
              <option value="course_handler">Course Handler</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={styles.submitBtn}>Create User</button>
          </form>
        </div>
      )}

      <div style={styles.tableCard}>
        {users.length === 0 ? (
          <p style={styles.emptyState}>No users found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={styles.row}>
                  <td style={styles.td}>
                    {user.profile.firstName} {user.profile.lastName}
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={user.isActive ? styles.activeStatus : styles.inactiveStatus}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      <button
                        onClick={() => toggleStatus(user._id)}
                        style={styles.toggleBtn}
                        disabled={user._id === currentUser.userId}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        style={styles.deleteBtn}
                        disabled={user._id === currentUser.userId}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function getRoleBadgeStyle(role) {
  const baseStyle = { padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
  const colors = {
    admin: { background: '#f56565', color: 'white' },
    course_handler: { background: '#667eea', color: 'white' },
    tutor: { background: '#48bb78', color: 'white' },
    candidate: { background: '#cbd5e0', color: '#2d3748' },
  };
  return { ...baseStyle, ...colors[role] };
}

const styles = {
  container: { minHeight: '100vh', padding: '2rem' }, // Background handled by body
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255, 255, 255, 0.5)' },
  title: { fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-main) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  createBtn: { padding: '0.75rem 1.5rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-blue)', transition: 'all 0.2s' },
  
  formCard: { background: 'white', padding: '2.5rem', borderRadius: '20px', marginBottom: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' },
  formTitle: { fontSize: '20px', marginBottom: '1.5rem', color: 'var(--primary-dark)', fontWeight: '700' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  input: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-card)', transition: 'all 0.2s' },
  select: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-card)', cursor: 'pointer' },
  submitBtn: { padding: '1rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s' },
  
  tableCard: { background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid var(--border-color)' },
  emptyState: { textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' },
  th: { padding: '1.2rem', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' },
  td: { padding: '1.2rem', fontSize: '14px', color: 'var(--text-primary)' },
  actionBtns: { display: 'flex', gap: '0.6rem' },
  toggleBtn: { padding: '0.5rem 1rem', background: 'var(--bg-dark)', color: 'var(--primary-main)', border: '1px solid var(--primary-main)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  deleteBtn: { padding: '0.5rem 1rem', background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  
  activeStatus: { padding: '0.4rem 0.8rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.2)' },
  inactiveStatus: { padding: '0.4rem 0.8rem', background: 'var(--bg-dark)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid var(--border-color)' },
};
