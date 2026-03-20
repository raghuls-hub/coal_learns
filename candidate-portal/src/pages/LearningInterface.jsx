import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import {
  CheckCircleIcon,
  VideoIcon,
  DocumentIcon,
  LinkIcon,
  BookOpenIcon,
  BackIcon,
} from '../components/Icons';

export default function LearningInterface() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  // Track the content ID that was being viewed so we can auto-mark it when navigating away
  const prevContentRef = useRef(null);
  const prevModuleRef = useRef(null);

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
        if (!currentModule && course.modules[0].content && course.modules[0].content.length > 0) {
          setCurrentModule(course.modules[0]);
          setCurrentContent(course.modules[0].content[0]);
          prevContentRef.current = course.modules[0].content[0];
          prevModuleRef.current = course.modules[0];
        }
      }
      await fetchProgress();
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

      const newProgress = {};
      if (data.completedContent) {
        data.completedContent.forEach(c => {
          const id = c._id || c;
          newProgress[id] = true;
        });
      }
      setProgress(newProgress);
    } catch (err) {
      console.error('[Frontend] Fetch Progress Error:', err);
    }
  };

  // Auto-marks content as complete when the user navigates away from it
  const autoMarkComplete = async (contentId, moduleId) => {
    if (!contentId || !moduleId) return;
    try {
      await apiClient.put(`/progress/${enrollmentId}/content/${contentId}`, { moduleId });
      setProgress(prev => ({ ...prev, [contentId]: true }));
      // Don't await fetchProgress here — keep navigation snappy
      fetchProgress();
    } catch (err) {
      console.error('[AutoComplete] Failed to mark:', err);
    }
  };

  const handleContentClick = (module, content) => {
    // Auto-mark previous content as complete when switching chapters
    if (prevContentRef.current && prevModuleRef.current) {
      const prevId = prevContentRef.current._id;
      const prevMid = prevModuleRef.current._id;
      if (prevId !== content._id) {
        autoMarkComplete(prevId, prevMid);
      }
    }
    prevContentRef.current = content;
    prevModuleRef.current = module;
    setCurrentModule(module);
    setCurrentContent(content);
  };

  // Also auto-mark when user clicks the manual "Mark Complete" button
  const markComplete = async () => {
    if (!currentContent || !currentModule) return;
    try {
      await apiClient.put(`/progress/${enrollmentId}/content/${currentContent._id}`, {
        moduleId: currentModule._id
      });
      setProgress(prev => ({ ...prev, [currentContent._id]: true }));
      await fetchProgress();
    } catch (error) {
      console.error('[Frontend] Failed to mark complete:', error);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (url.includes('watch?v=')) return `https://www.youtube.com/embed/${url.split('watch?v=')[1]?.split('&')[0]}`;
    if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`;
    if (url.includes('/embed/')) return url;
    return url;
  };

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Prepend API base if it's a relative path (GridFS upload)
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  // Count completed chapters for progress bar
  const totalContent = modules.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  const completedCount = Object.keys(progress).length;
  const completionPct = totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0;

  if (loading) return <div style={S.loading}>Loading course...</div>;
  if (!enrollment) return <div style={S.loading}>Enrollment not found</div>;

  return (
    <div style={S.container}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <button onClick={() => navigate('/my-learning')} style={S.backBtn}>
            <BackIcon size={14} />
            <span style={{ marginLeft: '4px' }}>Back to My Learning</span>
          </button>
          <h2 style={S.courseTitle}>{enrollment.course?.title || 'Course'}</h2>
          {/* Progress bar */}
          <div style={S.progressWrap}>
            <div style={S.progressBar}>
              <div style={{ ...S.progressFill, width: `${completionPct}%` }} />
            </div>
            <span style={S.progressLabel}>{completionPct}% Complete</span>
          </div>
        </div>

        <div style={S.modulesList}>
          {modules.map((module, mIdx) => (
            <div key={module._id} style={S.moduleGroup}>
              <div style={S.moduleHeader}>
                <span style={S.moduleNum}>Module {mIdx + 1}</span>
                <span style={S.moduleTitle}>{module.title}</span>
              </div>
              {module.content && module.content.map((content) => {
                const isActive = currentContent?._id === content._id;
                const isDone = !!progress[content._id];
                const isMedia = content.type === 'video' || content.type === 'video_upload';
                const isDoc = content.type === 'notes_upload' || content.type === 'pdf';
                return (
                  <div
                    key={content._id}
                    onClick={() => handleContentClick(module, content)}
                    style={isActive ? S.chapterActive : isDone ? S.chapterDone : S.chapter}
                  >
                    <span style={S.chapterIcon}>
                      {isDone
                        ? <CheckCircleIcon size={15} color={isActive ? '#fff' : '#10b981'} />
                        : isMedia
                          ? <VideoIcon size={14} color={isActive ? '#fff' : '#6366f1'} />
                          : isDoc
                            ? <DocumentIcon size={14} color={isActive ? '#fff' : '#94a3b8'} />
                            : <LinkIcon size={14} color={isActive ? '#fff' : '#94a3b8'} />}
                    </span>
                    <span style={S.chapterLabel}>{content.title}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={S.main}>
        {currentContent ? (
          <>
            <div style={S.contentHeader}>
              <div>
                <p style={S.breadcrumb}>{currentModule?.title}</p>
                <h1 style={S.contentTitle}>{currentContent.title}</h1>
              </div>
              <button
                onClick={markComplete}
                disabled={!!progress[currentContent._id]}
                style={progress[currentContent._id] ? S.completeBtnDone : S.completeBtn}
              >
                {progress[currentContent._id] ? 'Completed' : 'Mark Complete'}
              </button>
            </div>

            <div style={S.contentBody}>
              {currentContent.description && (
                <p style={S.description}>{currentContent.description}</p>
              )}

              {(currentContent.type === 'video' || currentContent.type === 'video_upload') && currentContent.data?.url && (() => {
                const url = resolveUrl(currentContent.data.url);
                const isYT = url.includes('youtube.com') || url.includes('youtu.be');
                return (
                  <div style={S.videoWrapper}>
                    {isYT ? (
                      <iframe
                        width="100%" height="500"
                        src={getYoutubeEmbedUrl(url)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={S.video}
                      />
                    ) : (
                      <video controls style={S.video} src={url} key={url} />
                    )}
                  </div>
                );
              })()}

              {currentContent.type === 'notes_upload' && currentContent.data?.url && (
                <div style={S.linkBox}>
                  <p style={S.linkLabel}>Resource Attachment</p>
                  <a href={resolveUrl(currentContent.data.url)} target="_blank" rel="noopener noreferrer" style={S.extLink}>
                    View File: {currentContent.data.filename || 'Download'}
                  </a>
                </div>
              )}

              {currentContent.type === 'text' && currentContent.data?.htmlContent && (
                <div style={S.textContent} dangerouslySetInnerHTML={{ __html: currentContent.data.htmlContent }} />
              )}

              {currentContent.type === 'link' && currentContent.data?.externalUrl && (
                <div style={S.linkBox}>
                  <p style={S.linkLabel}>External Resource</p>
                  <a href={currentContent.data.externalUrl} target="_blank" rel="noopener noreferrer" style={S.extLink}>
                    {currentContent.data.externalUrl}
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={S.empty}>
            <BookOpenIcon size={52} color='#334155' />
            <h3 style={{ color: '#475569', fontWeight: 600, margin: 0 }}>Select a chapter to start learning</h3>
          </div>
        )}
      </main>
    </div>
  );
}

const S = {
  container: { display: 'flex', height: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8', fontSize: '18px', background: '#0f172a' },

  // Sidebar
  sidebar: { width: '320px', minWidth: '320px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'hidden' },
  sidebarHeader: { padding: '1.5rem', borderBottom: '1px solid #334155', background: '#1e293b', flexShrink: 0 },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '0 0 1rem 0', display: 'block', letterSpacing: '0.01em' },
  courseTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9', lineHeight: '1.5', marginBottom: '1rem' },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  progressBar: { height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '3px', transition: 'width 0.4s ease' },
  progressLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600' },

  modulesList: { padding: '1rem', overflowY: 'auto', flex: 1 },
  moduleGroup: { marginBottom: '1.5rem' },
  moduleHeader: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.5rem', paddingLeft: '8px' },
  moduleNum: { fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' },
  moduleTitle: { fontSize: '13px', fontWeight: '600', color: '#94a3b8' },

  chapter: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', transition: 'background 0.15s' },
  chapterActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  chapterDone: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', background: 'rgba(16,185,129,0.12)' },
  chapterIcon: { fontSize: '12px', color: '#64748b', width: '16px', textAlign: 'center', flexShrink: 0 },
  chapterLabel: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.4', fontWeight: '500' },

  // Main
  main: { flex: 1, overflowY: 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column' },

  contentHeader: { background: '#1e293b', borderBottom: '1px solid #334155', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 },
  breadcrumb: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  contentTitle: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 },

  completeBtn: { padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 },
  completeBtnDone: { padding: '0.6rem 1.25rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'default', whiteSpace: 'nowrap', flexShrink: 0 },

  contentBody: { padding: '2rem', maxWidth: '900px', width: '100%', margin: '0 auto', flex: 1 },
  description: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '1.5rem', background: '#1e293b', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #334155' },

  videoWrapper: { position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 },

  textContent: { fontSize: '15px', lineHeight: '1.85', color: '#cbd5e1', background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' },

  linkBox: { textAlign: 'center', padding: '3rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' },
  linkLabel: { fontSize: '13px', color: '#64748b', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  extLink: { display: 'inline-flex', alignItems: 'center', padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', textDecoration: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600' },

  empty: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, color: '#475569', gap: '1rem' },
  emptyIcon: { fontSize: '48px' },
};
