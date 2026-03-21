import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient, { checkEnrollment, enrollInCourse } from '../services/api';

export default function CourseSalesPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            const courseRes = await apiClient.get(`/courses/${courseId}`);
            setCourse(courseRes.data.data);

            // Check enrollment status
            try {
                const enrollRes = await checkEnrollment(courseId);
                if (enrollRes.data.isEnrolled) {
                    setIsEnrolled(true);
                    // If already enrolled, redirect to player? Or show "Go to Course"
                }
            } catch (err) {
                console.log('Not enrolled or error checking');
            }
        } catch (error) {
            console.error('Failed to load course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (isEnrolled) {
            navigate(`/candidate/course/${courseId}`);
            return;
        }

        setEnrolling(true);
        try {
            // Mock payment flow
            await enrollInCourse(courseId);
            alert('Enrollment Successful! Redirecting to course...');
            setIsEnrolled(true);
            navigate(`/candidate/course/${courseId}`);
        } catch (error) {
            console.error('Enrollment failed:', error);
            alert('Enrollment failed. Please try again.');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading course details...</div>;
    if (!course) return <div style={{ padding: '2rem', textAlign: 'center' }}>Course not found</div>;

    return (
        <div style={styles.container}>
            <div style={styles.heroSection}>
                <div style={styles.heroContent}>
                    <span style={styles.badge}>{course.category} | {course.level}</span>
                    <h1 style={styles.title}>{course.title}</h1>
                    <p style={styles.subtitle}>{course.description}</p>
                    <div style={styles.meta}>
                        <span>Instructor: {course.courseHandler?.profile?.firstName} {course.courseHandler?.profile?.lastName}</span>
                        <span>Last updated: {new Date(course.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style={styles.enrollCard}>
                    <img src={course.thumbnail || 'https://via.placeholder.com/300x200'} alt={course.title} style={styles.thumbnail} />
                    <div style={styles.priceBox}>
                        <span style={styles.price}>
                            {course.pricing?.amount > 0 ? `$${course.pricing.amount}` : 'Free'}
                        </span>
                    </div>
                    <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        style={styles.enrollBtn}
                    >
                        {enrolling ? 'Processing...' : isEnrolled ? 'Go to Course' : 'Buy Now'}
                    </button>
                    <p style={styles.guarantee}>30-Day Money-Back Guarantee</p>
                    <div style={styles.includes}>
                        <h4>This course includes:</h4>
                        <ul>
                            <li>10 hours on-demand video</li>
                            <li>Assignments</li>
                            <li>Certificate of ownership</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style={styles.contentSection}>
                <div style={styles.mainColumn}>
                    <div style={styles.box}>
                        <h2>What you'll learn</h2>
                        <div style={styles.learnList}>
                            {/* Mock learning points based on description */}
                            <p>Master the fundamentals of {course.title}</p>
                            <p>Build real-world projects</p>
                            <p>Advance your career needs</p>
                        </div>
                    </div>

                    <div style={styles.box}>
                        <h2>Course Content</h2>
                        <p>Loading syllabus...</p>
                        {/* We could fetch modules here for preview if public */}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { fontFamily: "'Inter', sans-serif", color: '#2d3748' },
    heroSection: { background: '#1a202c', color: 'white', padding: '3rem 2rem', display: 'flex', justifyContent: 'center', gap: '3rem', position: 'relative' },
    heroContent: { maxWidth: '600px', paddingTop: '1rem' },
    badge: { color: '#ecc94b', fontWeight: '700', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' },
    title: { fontSize: '36px', fontWeight: '800', margin: '0.5rem 0 1rem', lineHeight: '1.2' },
    subtitle: { fontSize: '18px', lineHeight: '1.6', marginBottom: '1.5rem', color: '#e2e8f0' },
    meta: { display: 'flex', gap: '1rem', fontSize: '14px', color: '#cbd5e0' },
    enrollCard: { width: '340px', background: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', position: 'absolute', right: '10%', top: '3rem', color: '#2d3748', zIndex: 10 },
    thumbnail: { width: '100%', height: '190px', objectFit: 'cover', borderRadius: '4px 4px 0 0' },
    priceBox: { padding: '1.5rem 1.5rem 0.5rem' },
    price: { fontSize: '32px', fontWeight: '800', color: '#2d3748' },
    enrollBtn: { width: 'calc(100% - 3rem)', margin: '0 1.5rem', padding: '1rem', background: '#e53e3e', color: 'white', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', borderRadius: '4px', marginTop: '0.5rem', transition: 'background 0.2s' },
    guarantee: { textAlign: 'center', fontSize: '12px', color: '#718096', marginTop: '0.75rem' },
    includes: { padding: '1.5rem' },
    contentSection: { maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem', paddingRight: '400px' }, // Space for fixed card
    mainColumn: { maxWidth: '700px' },
    box: { marginBottom: '2rem', background: 'white', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' },
    learnList: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', color: '#4a5568' },
};
