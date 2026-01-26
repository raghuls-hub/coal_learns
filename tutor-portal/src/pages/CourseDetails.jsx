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

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        apiClient.get(`/api/courses/${courseId}`),
        apiClient.get(`/api/courses/${courseId}/modules`)
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
      await apiClient.post(`/api/courses/${courseId}/modules`, {
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

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div style={styles.container}>


      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{course.title}</h1>
          <p style={styles.subtitle}>{course.category} • {course.level}</p>
        </div>
        <button onClick={() => setShowModuleForm(true)} style={styles.createBtn}>
          + Add Module
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
            <div
              key={module._id}
              style={styles.moduleCard}
              onClick={() => navigate(`/course/${courseId}/module/${module._id}`)}
            >
              <div style={styles.moduleInfo}>
                <span style={styles.moduleOrder}>Module {index + 1}</span>
                <h3 style={styles.moduleTitle}>{module.title}</h3>
                <span style={styles.itemCount}>{module.content?.length || 0} items</span>
              </div>
              <span style={styles.arrow}>→</span>
            </div>
          ))
        )}
      </div>

      <div style={{marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0'}}>
        <h2 style={{fontSize: '20px', fontWeight: '700', color: '#1a202c', marginBottom: '1rem'}}>Final Assessment</h2>
        <div 
          style={{...styles.moduleCard, borderLeft: '4px solid #f59e0b', background: '#fffbeb'}}
          onClick={() => navigate(`/course/${courseId}/final-exam`)}
        >
          <div style={styles.moduleInfo}>
             <span style={{...styles.moduleOrder, color: '#d97706'}}>MANDATORY</span>
             <h3 style={styles.moduleTitle}>Final Course Exam</h3>
             <span style={styles.itemCount}>Required for Certificate</span>
          </div>
          <button style={{padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}>
             Manage Exam
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100%', fontFamily: "'Inter', sans-serif" },
  backBtn: { marginBottom: '1rem', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' },
  subtitle: { color: '#718096', fontSize: '14px' },
  createBtn: { padding: '0.75rem 1.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  modulesList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  moduleCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #667eea' },
  moduleInfo: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  moduleOrder: { fontSize: '12px', color: '#667eea', fontWeight: '600', textTransform: 'uppercase' },
  moduleTitle: { fontSize: '18px', fontWeight: '600', color: '#2d3748' },
  itemCount: { fontSize: '13px', color: '#a0aec0' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#718096', background: '#f7fafc', borderRadius: '8px' },
  formCard: { background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  form: { display: 'flex', gap: '1rem', marginTop: '1rem' },
  input: { flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px' },
  formActions: { display: 'flex', gap: '0.5rem' },
  submitBtn: { padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  arrow: { fontSize: '20px', color: '#cbd5e0' },
};
