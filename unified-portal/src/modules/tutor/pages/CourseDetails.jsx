import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/courses/${courseId}/modules`)
      ]);

      setCourse(courseRes.data.data);
      // Depending on API structure, modules might be in course object or separate
      // Assuming modules are returned or populated request needed?
      // Based on typical REST: GET /api/courses/{id}/modules is best practice
      // But if backend doesn't have it, we might need to rely on populate in getCourse
      if (courseRes.data.data.modules && courseRes.data.data.modules.length > 0 && typeof courseRes.data.data.modules[0] === 'object') {
        setModules(courseRes.data.data.modules);
      } else {
        // If modules are just IDs, or if we want to fetch separately. 
        // Let's assume for now we might need to implement the route or use what we have.
        // Checking backend Service... getCourseById populates modules.
        setModules(modulesRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
      // alert('Error loading course details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/courses/${courseId}/modules`, {
        title: newModuleTitle,
        order: modules.length + 1
      });
      setNewModuleTitle('');
      setShowModuleForm(false);
      fetchCourseDetails();
    } catch (error) {
      console.error('Failed to create module:', error);
      alert('Failed to create module');
    }
  };

  const handleEditModule = async (moduleId, e) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/courses/${courseId}/modules/${moduleId}`, {
        title: editTitle
      });
      setEditingModule(null);
      setEditTitle('');
      fetchCourseDetails();
    } catch (error) {
      console.error('Failed to edit module:', error);
      alert('Failed to update module');
    }
  };

  const handleDeleteModule = async (moduleId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this module and all its content?')) {
      try {
        await apiClient.delete(`/courses/${courseId}/modules/${moduleId}`);
        fetchCourseDetails();
      } catch (error) {
        console.error('Failed to delete module:', error);
        alert('Failed to delete module');
      }
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!course) return <div style={styles.loading}>Course not found</div>;

  return (
    <div style={styles.container}>


      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{course.title}</h1>
          <p style={styles.subtitle}>{course.category} • {course.level}</p>
        </div>
        <button onClick={() => setShowModuleForm(true)} style={styles.createBtn}>
          Add Module
        </button>
      </div>

      {showModuleForm && (
        <div style={styles.formCard}>
          <h3>Add New Module</h3>
          <form onSubmit={handleCreateModule} style={styles.form}>
            <input
              type="text"
              placeholder="Module Title"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required
              style={styles.input}
            />
            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>Create</button>
              <button type="button" onClick={() => setShowModuleForm(false)} style={styles.cancelBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.modulesList}>
        {modules.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No modules yet. Start structuring your course!</p>
          </div>
        ) : (
          modules.map((module, index) => (
            <div key={module._id} style={styles.moduleWrapper}>
              {editingModule === module._id ? (
                <div style={styles.editForm}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={styles.editInput}
                  />
                  <div style={styles.editActions}>
                    <button onClick={(e) => handleEditModule(module._id, e)} style={styles.saveBtn}>Save</button>
                    <button onClick={() => setEditingModule(null)} style={styles.cancelLink}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  style={styles.moduleCard}
                  onClick={() => navigate(`/tutor/course/${courseId}/module/${module._id}`)}
                >
                  <div style={styles.moduleInfo}>
                    <span style={styles.moduleOrder}>Module {index + 1}</span>
                    <h3 style={styles.moduleTitle}>{module.title}</h3>
                    <span style={styles.itemCount}>{module.content?.length || 0} items</span>
                  </div>
                  <div style={styles.moduleActions}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingModule(module._id); setEditTitle(module.title); }}
                      style={styles.iconBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteModule(module._id, e)}
                      style={{...styles.iconBtn, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)'}}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>


    </div>
  );
}

const styles = {
  container: { padding: '3rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100%' },
  loading: { textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontSize: '16px' },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '3rem', 
    background: 'rgba(30, 41, 59, 0.4)', 
    padding: '2.5rem', 
    borderRadius: '24px', 
    border: '1px solid var(--border-dim)',
    backdropFilter: 'blur(10px)',
  },
  title: { fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.025em' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '600' },
  createBtn: { 
    padding: '1rem 2rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '15px', 
    fontWeight: '800', 
    cursor: 'pointer', 
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s',
  },
  modulesList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  moduleCard: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: 'var(--bg-surface)', 
    padding: '2rem', 
    borderRadius: '20px', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
    cursor: 'pointer', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
    borderLeft: '4px solid var(--accent-primary)' 
  },
  moduleInfo: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  moduleOrder: { fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' },
  moduleTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  itemCount: { fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' },
  emptyState: { 
    textAlign: 'center', 
    padding: '5rem 2rem', 
    color: 'var(--text-secondary)', 
    background: 'var(--bg-surface)', 
    borderRadius: '24px', 
    border: '1px solid var(--border-dim)' 
  },
  formCard: { 
    background: 'var(--bg-surface)', 
    padding: '2.5rem', 
    borderRadius: '20px', 
    marginBottom: '3rem', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
  },
  form: { display: 'flex', gap: '1.25rem', marginTop: '2rem' },
  input: { 
    flex: 1, 
    padding: '0.9rem 1.125rem', 
    background: 'var(--bg-base)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  formActions: { display: 'flex', gap: '1rem' },
  submitBtn: { 
    padding: '0.9rem 1.75rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: '800', 
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelBtn: { 
    padding: '0.9rem 1.75rem', 
    background: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  moduleWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  moduleActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  iconBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-dim)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    background: 'var(--bg-surface)',
    borderRadius: '20px',
    border: '1px solid var(--border-dim)',
  },
  editInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    background: 'var(--bg-base)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  editActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelLink: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
  }
};
