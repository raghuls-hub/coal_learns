import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function LearningInterface() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  
  const [enrollment, setEnrollment] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [finalExam, setFinalExam] = useState(null);

  useEffect(() => {
    fetchEnrollment();
  }, [enrollmentId]);

  const fetchEnrollment = async () => {
    try {
      const res = await apiClient.get(`/enrollments/${enrollmentId}`);
      setEnrollment(res.data.data);
      
      const course = res.data.data.course;
      if (course.modules && course.modules.length > 0) {
        setModules(course.modules);
        
        // Initial load only
        if (!currentModule && course.modules[0].content && course.modules[0].content.length > 0) {
           setCurrentModule(course.modules[0]);
           setCurrentContent(course.modules[0].content[0]);
        }
      }

      await fetchProgress(); // Separate function

      // Fetch Final Exam info
      const examRes = await apiClient.get(`/courses/${course._id}/final-assessment`);
      if (examRes.data.data) {
        setFinalExam(examRes.data.data);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
      try {
        const progressRes = await apiClient.get(`/progress/${enrollmentId}`);
        const data = progressRes.data.data;
        
        if (!data) return;

        // Transform Backend Data (Object/Arrays) to UI State (Map of IDs -> Boolean)
        const newProgress = {};
        
        // 1. Map Completed Content
        if (data.completedContent) {
            data.completedContent.forEach(c => {
                const id = c._id || c; 
                newProgress[id] = true;
            });
        }

        // 2. Map Completed Assessments (Checkmarks)
        if (data.assessmentScores) {
            console.log('[Frontend] Raw assessmentScores:', data.assessmentScores);
            data.assessmentScores.forEach(score => {
                console.log('[Frontend] Processing score:', {
                    assessment: score.assessment,
                    assessmentType: typeof score.assessment,
                    hasId: !!score.assessment?._id,
                    passed: score.passed
                });
                if (score.passed) {
                    const id = score.assessment?._id || score.assessment;
                    console.log(`[Frontend] Mapping assessment ${id} = true`);
                    newProgress[id] = true; // Use Assessment ID as key
                }
            });
        }
        
        // 3. Map Final Exam Unlock Status (from backend)
        // Backend determines unlock based on: all content complete + all assessments passed
        newProgress.finalExamUnlocked = data.finalExamUnlocked || false;
        
        console.log('[Frontend] Processed Progress State:', newProgress);
        console.log('[Frontend] Final Exam Unlocked:', newProgress.finalExamUnlocked);
        setProgress(newProgress);
        
      } catch (err) { console.error('[Frontend] Fetch Progress Error:', err); }
  };

  const handleContentClick = (module, content) => {
    setCurrentModule(module);
    setCurrentContent(content);
  };

  const markComplete = async () => {
    if (!currentContent || !currentModule) return;
    
    try {
      const url = `/progress/${enrollmentId}/content/${currentContent._id}`;
      // console.log('[Frontend] Sending PUT to:', url); // Kept for minimal debug if needed
      
      const res = await apiClient.put(url, {
        moduleId: currentModule._id
      });
      
      // Optimistic update
      setProgress(prev => ({...prev, [currentContent._id]: true}));
      
      // Live sync
      await fetchProgress(); 
      
    } catch (error) {
      console.error('[Frontend] Failed to mark complete:', error);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!enrollment) return <div style={styles.loading}>Enrollment not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <button onClick={() => navigate('/my-learning')} style={styles.backBtn}>← My Learning</button>
          <h2 style={styles.courseTitle}>{enrollment.course.title}</h2>
        </div>
        
        <div style={styles.modulesList}>
          {modules.map((module, mIdx) => (
            <div key={module._id} style={styles.moduleItem}>
              <div style={styles.moduleHeader}>Module {mIdx + 1}: {module.title}</div>
              {module.content && module.content.map((content, cIdx) => (
                <div
                  key={content._id}
                  onClick={() => handleContentClick(module, content)}
                  style={currentContent?._id === content._id ? styles.contentItemActive : styles.contentItem}
                >
                  <span>{progress[content._id] && '✓ '}{content.title}</span>
                </div>
              ))}
              {module.assessment && (
                <div
                  onClick={() => navigate(`/assessment/${module.assessment._id}/take`, { state: { enrollmentId } })}
                  style={progress[module.assessment._id] ? styles.assessmentItemPassed : styles.assessmentItem}
                >
                  <span style={{marginRight: '8px'}}>{progress[module.assessment._id] ? '✓' : '📝'}</span>
                  Take Assessment
                  {progress[module.assessment._id] && <span style={{fontSize:'12px', marginLeft:'auto'}}>Passed</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {finalExam && (
           <div style={{padding: '1.5rem', borderTop: '1px solid #f1f5f9'}}>
              <h4 style={{fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase'}}>Final Assessment</h4>
              
              <div 
                 onClick={() => {
                   if (progress.finalExamUnlocked) {
                     navigate(`/assessment/${finalExam._id}/take`);
                   } else {
                     alert('🔒 Final Exam is Locked\n\nTo unlock:\n• Pass all module quizzes');
                   }
                 }}
                 style={{
                   padding: '1rem',
                   background: progress.finalExamUnlocked ? '#4f46e5' : '#e2e8f0',
                   color: progress.finalExamUnlocked ? 'white' : '#94a3b8',
                   borderRadius: '8px',
                   fontWeight: '600',
                   cursor: progress.finalExamUnlocked ? 'pointer' : 'not-allowed',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   transition: 'all 0.2s',
                   boxShadow: progress.finalExamUnlocked ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)' : 'none'
                 }}
              >
                <span>{progress.finalExamUnlocked ? '🔓' : '🔒'}</span>
                <span>Take Final Exam</span>
                {!progress.finalExamUnlocked && <span style={{fontSize: '11px', marginLeft: 'auto'}}>Pass All Quizzes</span>}
              </div>
              
              {!progress.finalExamUnlocked && (
                <div style={{marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e'}}>
                  <div style={{fontWeight: '600', marginBottom: '0.25rem'}}>📋 To Unlock Final Exam:</div>
                  <div style={{marginLeft: '1.25rem'}}>
                    ✓ Pass all module quizzes
                  </div>
                </div>
              )}
           </div>
        )}
      </div>

      <div style={styles.main}>
        {currentContent ? (
          <>
            <div style={styles.contentHeader}>
              <h1 style={styles.contentTitle}>{currentContent.title}</h1>
              <button onClick={markComplete} style={styles.completeBtn}>
                {progress[currentContent._id] ? '✓ Completed' : 'Mark as Complete'}
              </button>
            </div>

            {currentContent.description && (
              <p style={styles.description}>{currentContent.description}</p>
            )}

            <div style={styles.contentArea}>
              {currentContent.type === 'video' && currentContent.data?.url && (() => {
                const getYouTubeEmbedUrl = (url) => {
                  // Extract video ID from various YouTube URL formats
                  let videoId = null;
                  
                  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
                  if (url.includes('watch?v=')) {
                    videoId = url.split('watch?v=')[1]?.split('&')[0];
                  } 
                  // Short URL: https://youtu.be/VIDEO_ID
                  else if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1]?.split('?')[0];
                  }
                  // Already embed URL: https://www.youtube.com/embed/VIDEO_ID
                  else if (url.includes('/embed/')) {
                    return url;
                  }
                  
                  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
                };

                const isYouTube = currentContent.data.url.includes('youtube.com') || currentContent.data.url.includes('youtu.be');
                
                return (
                  <div style={styles.videoWrapper}>
                    {isYouTube ? (
                      <iframe
                        width="100%"
                        height="500"
                        src={getYouTubeEmbedUrl(currentContent.data.url)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={styles.video}
                      ></iframe>
                    ) : (
                      <video controls style={styles.video} src={currentContent.data.url}></video>
                    )}
                  </div>
                );
              })()}

              {currentContent.type === 'text' && currentContent.data?.htmlContent && (
                <div style={styles.textContent} dangerouslySetInnerHTML={{ __html: currentContent.data.htmlContent }}></div>
              )}

              {currentContent.type === 'link' && currentContent.data?.externalUrl && (
                <div style={styles.linkContent}>
                  <p>Reference Link:</p>
                  <a href={currentContent.data.externalUrl} target="_blank" rel="noopener noreferrer" style={styles.externalLink}>
                    {currentContent.data.externalUrl}
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.empty}>Select content to begin learning</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  
  // Sidebar
  sidebar: { 
    width: '350px', 
    background: '#ffffff', 
    borderRight: '1px solid #e2e8f0', 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%',
    zIndex: 10
  },
  sidebarHeader: { 
    padding: '1.5rem', 
    borderBottom: '1px solid #f1f5f9', 
    background: '#ffffff', 
    position: 'sticky', 
    top: 0 
  },
  backBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem',
    marginBottom: '1rem', 
    padding: '0',
    background: 'none', 
    border: 'none', 
    color: '#64748b', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  courseTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' },
  
  modulesList: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
  moduleItem: { marginBottom: '1.5rem' },
  moduleHeader: { 
    fontSize: '13px', 
    fontWeight: '700', 
    color: '#94a3b8', 
    marginBottom: '0.75rem', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  },
  
  contentItem: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem', 
    fontSize: '15px', 
    color: '#334155', 
    cursor: 'pointer', 
    borderRadius: '8px', 
    marginBottom: '0.25rem', 
    transition: 'all 0.2s',
  },
  contentItemActive: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem', 
    fontSize: '15px', 
    color: '#ffffff', 
    cursor: 'pointer', 
    borderRadius: '8px', 
    marginBottom: '0.25rem', 
    background: '#4f46e5', 
    fontWeight: '500', 
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' 
  },
  
  assessmentItem: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem', 
    fontSize: '15px', 
    color: '#b45309', 
    cursor: 'pointer', 
    borderRadius: '8px', 
    background: '#fffbeb', 
    fontWeight: '500', 
    marginTop: '0.5rem', 
    border: '1px solid #fcd34d' 
  },
  assessmentItemPassed: { 
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem', 
    fontSize: '15px', 
    color: '#15803d', 
    cursor: 'pointer', 
    borderRadius: '8px', 
    background: '#dcfce7', 
    fontWeight: '500', 
    marginTop: '0.5rem', 
    border: '1px solid #86efac' 
  },
  
  // Main Content
  main: { flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '0' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b', fontSize: '16px' },
  empty: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b', fontSize: '16px' },
  
  contentHeader: { 
    background: '#ffffff', 
    padding: '1.5rem 2rem', 
    borderBottom: '1px solid #e2e8f0', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 5
  },
  contentTitle: { fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  completeBtn: { 
    padding: '0.625rem 1.25rem', 
    background: '#10b981', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  // Content Area
  contentArea: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  description: { fontSize: '16px', color: '#475569', marginBottom: '2rem', lineHeight: '1.7', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' },
  
  videoWrapper: { 
    position: 'relative', 
    width: '100%', 
    paddingTop: '56.25%', // 16:9 Aspect Ratio
    background: 'black', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
  },
  video: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    border: 0 
  },
  
  textContent: { 
    fontSize: '16px', 
    lineHeight: '1.8', 
    color: '#334155', 
    background: 'white', 
    padding: '2.5rem', 
    borderRadius: '12px', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0'
  },
  
  linkContent: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' },
  externalLink: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    padding: '0.875rem 2rem', 
    background: '#4f46e5', 
    color: 'white', 
    textDecoration: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: '600', 
    marginTop: '1rem',
    transition: 'background 0.2s'
  },
};
