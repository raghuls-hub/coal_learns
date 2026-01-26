import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      // Filter only published courses
      const publishedCourses = (res.data.data?.courses || res.data.data || [])
        .filter(course => course.settings?.isPublished);
      setCourses(publishedCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return course.level === filter;
  });

  if (loading) return <div style={styles.loading}>Loading courses...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Explore Courses</h1>
          <p style={styles.subtitle}>Discover new skills and advance your knowledge</p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <button
          onClick={() => setFilter('all')}
          style={filter === 'all' ? styles.filterActive : styles.filter}
        >
          All Courses
        </button>
        <button
          onClick={() => setFilter('beginner')}
          style={filter === 'beginner' ? styles.filterActive : styles.filter}
        >
          Beginner
        </button>
        <button
          onClick={() => setFilter('intermediate')}
          style={filter === 'intermediate' ? styles.filterActive : styles.filter}
        >
          Intermediate
        </button>
        <button
          onClick={() => setFilter('advanced')}
          style={filter === 'advanced' ? styles.filterActive : styles.filter}
        >
          Advanced
        </button>
      </div>

      <div style={styles.grid}>
        {filteredCourses.length === 0 ? (
          <div style={styles.empty}>
            <p>No courses available at the moment</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div key={course._id} style={styles.card}>
              <span style={styles.levelBadge}>{course.level}</span>
              <h3 style={styles.courseTitle}>{course.title}</h3>
              <p style={styles.courseDesc}>{course.description}</p>
              
              <div style={styles.meta}>
                <span style={styles.category}>📚 {course.category}</span>
                <span style={styles.price}>{course.pricing?.amount > 0 ? `$${course.pricing.amount}` : 'Free'}</span>
              </div>
              
              <button
                onClick={() => navigate(`/course/${course._id}`)}
                style={styles.viewBtn}
              >
                View Course
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', background: '#f7fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '32px', fontWeight: 'bold', color: '#1a202c' },
  subtitle: { fontSize: '16px', color: '#718096', marginTop: '0.5rem' },
  filterBar: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  filter: { padding: '0.75rem 1.5rem', background: 'white', color: '#4a5568', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
  filterActive: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' },
  empty: { gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#718096' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative' },
  levelBadge: { position: 'absolute', top: '1rem', right: '1rem', padding: '0.375rem 0.75rem', background: '#edf2f7', color: '#4a5568', fontSize: '12px', fontWeight: '600', borderRadius: '6px', textTransform: 'capitalize' },
  courseTitle: { fontSize: '20px', fontWeight: '700', color: '#2d3748', marginBottom: '0.75rem', marginTop: '0.5rem' },
  courseDesc: { fontSize: '14px', color: '#718096', marginBottom: '1.5rem', lineHeight: '1.6' },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  category: { fontSize: '13px', color: '#4a5568' },
  price: { fontSize: '18px', fontWeight: '700', color: '#667eea' },
  viewBtn: { width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s' },
};
