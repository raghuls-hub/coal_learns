import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient, { checkEnrollment } from '../services/api';
import AiAssistant from '../components/AiAssistant';

export default function CoursePlayer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [activeModule, setActiveModule] = useState(null);
    const [activeContent, setActiveContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Video tracking
    const videoRef = useRef(null);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);

            // 1. Check Enrollment first
            try {
                const enrollRes = await checkEnrollment(courseId);
                if (!enrollRes.data.isEnrolled) {
                    // Redirect to sales page if not enrolled
                    navigate(`/course/${courseId}/details`);
                    return;
                }
            } catch (err) {
                console.error('Error checking enrollment', err);
                // Fallback: If check fails (e.g. network), maybe allow proceed but API will block content.
                // Safest is to redirect or show error.
                navigate(`/course/${courseId}/details`);
                return;
            }

            // 2. Fetch Course Details
            const courseRes = await apiClient.get(`/api/courses/${courseId}`);
            setCourse(courseRes.data.data);

            // 3. Fetch Modules
            const modulesRes = await apiClient.get(`/api/courses/${courseId}/modules`);
            const fetchedModules = modulesRes.data.data;
            setModules(fetchedModules);

            // Set initial active content
            if (fetchedModules.length > 0 && fetchedModules[0].content && fetchedModules[0].content.length > 0) {
                setActiveModule(fetchedModules[0]);
                setActiveContent(fetchedModules[0].content[0]);
            }
        } catch (error) {
            console.error('Failed to load course player:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContentSelect = (module, content) => {
        setActiveModule(module);
        setActiveContent(content);
    };

    const handleTakeAssessment = (moduleId) => {
        navigate(`/exam/${courseId}/${moduleId}`);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading course content...</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={{ ...styles.sidebar, width: sidebarOpen ? '350px' : '0px', opacity: sidebarOpen ? 1 : 0 }}>
                <div style={styles.sidebarHeader}>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    {/* Back button logic kept but styled minimally */}
                </div>

                <div style={styles.moduleList}>
                    {course.modules?.map((module, index) => (
                        <div key={module._id} style={styles.moduleItem}>
                            <div style={styles.moduleHeader}>
                                <strong>Module {index + 1}: {module.title}</strong>
                            </div>
                            <div style={styles.chapterList}>
                                {module.content?.map((content, idx) => (
                                    <div
                                        key={content._id}
                                        style={{
                                            ...styles.chapterItem,
                                            backgroundColor: activeContent?._id === content._id ? '#ebf4ff' : 'transparent',
                                            color: activeContent?._id === content._id ? '#2b6cb0' : 'inherit'
                                        }}
                                        onClick={() => handleContentSelect(module, content)}
                                    >
                                        <span style={styles.icon}>{content.type === 'video' ? '🎥' : content.type === 'assessment' ? '📝' : '📄'}</span>
                                        <span>{idx + 1}. {content.title}</span>
                                    </div>
                                ))}
                                {/* Module Assessment Button */}
                                {module.assessment && (
                                    <div style={styles.assessmentBtn} onClick={() => handleTakeAssessment(module._id)}>
                                        <span>🛡️ Module Assessment</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.main}>
                <div style={styles.navBar}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                    <span>{activeContent ? activeContent.title : 'Select a chapter'}</span>
                </div>

                <div style={styles.contentArea}>
                    {activeContent ? (
                        <>
                            {activeContent.type === 'video' && (
                                <div style={styles.videoWrapper}>
                                    {/* Using iframe for youtube/vimeo or video tag for direct links */}
                                    {activeContent.data.url?.includes('youtube.com') || activeContent.data.url?.includes('youtu.be') ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={activeContent.data.url.replace('watch?v=', 'embed/')}
                                            title={activeContent.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video controls width="100%" style={{ maxHeight: '80vh' }} ref={videoRef}>
                                            <source src={activeContent.data.url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            )}

                            {activeContent.type === 'text' && (
                                <div style={styles.textReader}>
                                    <h2>{activeContent.title}</h2>
                                    <div dangerouslySetInnerHTML={{ __html: activeContent.data.htmlContent }} />
                                </div>
                            )}

                            {activeContent.type === 'link' && (
                                <div style={styles.linkView}>
                                    <h2>External Resource</h2>
                                    <p>This chapter links to an external resource:</p>
                                    <a href={activeContent.data.externalUrl} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                                        Open {activeContent.title} ↗
                                    </a>
                                </div>
                            )}

                            <div style={styles.descriptionBox}>
                                <h3>About this chapter</h3>
                                <p>{activeContent.description}</p>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <h2>Welcome to the course!</h2>
                            <p>Select a module from the sidebar to start learning.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Assistant Floating Widget */}
            <AiAssistant courseId={courseId} moduleId={activeModule?._id} />
        </div>
    );
}

const styles = {
    container: { display: 'flex', height: 'calc(100vh - 4rem)', overflow: 'hidden', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }, // Adjusted height for layout
    sidebar: { width: '300px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'width 0.3s, opacity 0.3s', flexShrink: 0 },
    sidebarHeader: { padding: '1rem', borderBottom: '1px solid #e2e8f0', background: 'white' },
    courseTitle: { fontSize: '15px', fontWeight: '700', margin: 0, color: '#2d3748' },
    backBtn: { fontSize: '12px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.25rem' },
    moduleList: { flex: 1, overflowY: 'auto', padding: '0.5rem' },
    moduleItem: { marginBottom: '1rem' },
    moduleHeader: { fontSize: '12px', fontWeight: '700', color: '#718096', marginBottom: '0.5rem', padding: '0 0.5rem', textTransform: 'uppercase' },
    chapterList: { display: 'flex', flexDirection: 'column', gap: '2px' },
    chapterItem: { padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s', border: '1px solid transparent' },
    icon: { fontSize: '14px', minWidth: '20px' },
    assessmentBtn: { padding: '0.5rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#c53030', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem', background: '#fff5f5', border: '1px dashed #feb2b2', fontWeight: '600', width: '100%', justifyContent: 'center' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#2d3748', position: 'relative' },
    navBar: { padding: '0.75rem 1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' },
    toggleBtn: { background: '#edf2f7', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '4px' },
    contentArea: { flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f7fafc' },
    videoWrapper: { width: '100%', maxWidth: '900px', aspectRatio: '16/9', background: 'black', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    textReader: { width: '100%', maxWidth: '800px', background: 'white', color: '#2d3748', padding: '3rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    linkView: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '600px' },
    linkBtn: { display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#4299e1', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: '600' },
    descriptionBox: { width: '100%', maxWidth: '900px', marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', color: '#4a5568', border: '1px solid #e2e8f0' },
    emptyState: { textAlign: 'center', marginTop: '4rem', color: '#a0aec0' },
};
