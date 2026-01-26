import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient, { getMyEnrollments, getCourses } from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [exploreCourses, setExploreCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my-learning'

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch Market Courses
            const coursesRes = await getCourses();
            setExploreCourses(coursesRes.data.data.courses || []);

            // Fetch My Enrollments
            const enrollRes = await getMyEnrollments();
            // Map enrollments to course objects for display
            const enrolled = enrollRes.data.data.map(e => ({
                ...e.course,
                enrollmentId: e._id,
                progress: e.progress
            }));
            setMyCourses(enrolled);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayedCourses = activeTab === 'explore' ? exploreCourses : myCourses;

    const handleCourseClick = (courseId) => {
        // Simple logic: if in "My Learning", go to player.
        // If in "Explore", check if owned. If owned -> Player. If not -> Sales Page (future).
        // For now, let's just go to course player route, which handles the check or we'll add Sales Page route later.
        // We implemented Course Sales Page requirement, so we should route there if not enrolled?
        // Actually, let's route to `/course/:id` and let that page decide or simple logic here.

        const isEnrolled = myCourses.some(c => c._id === courseId);

        if (isEnrolled) {
            navigate(`/course/${courseId}`);
        } else {
            // Go to sales page (we'll create this next)
            navigate(`/course/${courseId}/details`);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.section}>
                <div style={styles.headerRow}>
                    <div style={styles.tabs}>
                        <button
                            style={activeTab === 'explore' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('explore')}
                        >
                            Explore Courses
                        </button>
                        <button
                            style={activeTab === 'my-learning' ? styles.activeTab : styles.tab}
                            onClick={() => setActiveTab('my-learning')}
                        >
                            My Learning
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.grid}>
                    {displayedCourses
                        .filter(course =>
                            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(course => (
                            <div key={course._id} style={styles.card} onClick={() => handleCourseClick(course._id)}>
                                <div style={styles.cardContent}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span style={styles.badge}>{course.category}</span>
                                        {activeTab === 'explore' && (
                                            <span style={styles.priceTag}>
                                                {typeof course.pricing?.amount === 'number' && course.pricing.amount > 0
                                                    ? `$${course.pricing.amount}`
                                                    : 'Free'}
                                            </span>
                                        )}
                                    </div>

                                    <h3 style={styles.courseTitle}>{course.title}</h3>
                                    <p style={styles.description}>{course.description}</p>

                                    {activeTab === 'my-learning' && (
                                        <div style={styles.progress}>
                                            <div style={styles.progressBar}>
                                                <div style={{
                                                    width: `${course.progress || 0}%`,
                                                    background: '#667eea',
                                                    height: '100%',
                                                    borderRadius: '4px'
                                                }}></div>
                                            </div>
                                            <span style={styles.progressText}>{course.progress || 0}% Complete</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    {displayedCourses.length === 0 && (
                        <div style={styles.emptyState}>
                            <p>No courses found in {activeTab === 'explore' ? 'Catalogue' : 'My Learning'}.</p>
                            {activeTab === 'my-learning' && (
                                <button onClick={() => setActiveTab('explore')} style={styles.ctaBtn}>Browse Courses</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    section: { marginBottom: '3rem' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    tabs: { display: 'flex', gap: '1rem', background: '#e2e8f0', padding: '4px', borderRadius: '8px' },
    tab: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600', color: '#718096' },
    activeTab: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#2d3748', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    searchInput: { padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '300px', outline: 'none', transition: 'box-shadow 0.2s' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' },
    card: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '280px' },
    cardContent: { padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' },
    badge: { fontSize: '11px', background: '#ebf4ff', color: '#4299e1', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', width: 'fit-content' },
    priceTag: { fontSize: '14px', fontWeight: '700', color: '#2d3748' },
    courseTitle: { fontSize: '18px', fontWeight: '700', color: '#2d3748', margin: '0.75rem 0 0.5rem', lineHeight: '1.4' },
    description: { fontSize: '14px', color: '#718096', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' },
    progress: { marginTop: 'auto' },
    progressBar: { height: '6px', background: '#edf2f7', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' },
    progressText: { fontSize: '12px', color: '#718096', fontWeight: '500' },
    emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#718096' },
    ctaBtn: { marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#4299e1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
};
