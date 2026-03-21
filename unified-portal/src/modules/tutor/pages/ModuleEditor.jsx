import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { BackIcon, AddIcon, EditIcon, DeleteIcon, UploadIcon } from '../components/Icons';

export default function ModuleEditor() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  
  // Content Form State
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    type: 'video',
    data: { url: '', htmlContent: '', externalUrl: '', fileId: '', filename: '' }
  });
  const [uploading, setUploading] = useState(false);



  useEffect(() => {
    fetchModuleDetails();
  }, [moduleId]);

  const fetchModuleDetails = async () => {
    try {
       const moduleRes = await apiClient.get(`/courses/${courseId}/modules/${moduleId}`);
       setModule(moduleRes.data.data);
       
       if (moduleRes.data.data.content && moduleRes.data.data.content[0] && typeof moduleRes.data.data.content[0] === 'object') {
         setContents(moduleRes.data.data.content);
       } else {
         setContents([]);
       }
    } catch (error) {
      console.error('Failed to fetch module details:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetContentForm = () => {
    setContentData({ title: '', description: '', type: 'video', data: { url: '', htmlContent: '', externalUrl: '', fileId: '', filename: '' } });
    setEditingContent(null);
    setShowContentForm(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { fileId, filename, url } = response.data.data;
      setContentData({
        ...contentData,
        data: { ...contentData.data, fileId, filename, url }
      });
      alert('File uploaded successfully');
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (uploading) return alert('Please wait for file upload to complete');

    try {
      if (editingContent) {
        await apiClient.put(`/courses/content/${editingContent._id}`, contentData);
      } else {
        await apiClient.post(`/courses/${courseId}/modules/${moduleId}/content`, {
          ...contentData,
          order: contents.length + 1
        });
      }
      resetContentForm();
      fetchModuleDetails();
    } catch (error) {
      alert('Failed to save content');
    }
  };

  const handleEditContent = (content) => {
    setContentData({
      title: content.title,
      description: content.description || '',
      type: content.type,
      data: content.data
    });
    setEditingContent(content);
    setShowContentForm(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      await apiClient.delete(`/courses/content/${contentId}`);
      fetchModuleDetails();
    } catch (error) {
      alert('Failed to delete content');
    }
  };



  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!module) return <div style={styles.loading}>Module not found</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(`/tutor/course/${courseId}`)} style={styles.backBtn}>
        <BackIcon size={14} color='var(--text-secondary)' />
        <span style={{ marginLeft: '6px' }}>Back to Course</span>
      </button>
      
      <div style={styles.header}>
        <h1 style={styles.title}>{module.title}</h1>

      </div>


        <>
          <button onClick={() => setShowContentForm(true)} style={styles.addBtn}>
            <AddIcon size={16} color='white' />
            <span style={{ marginLeft: '6px' }}>Add New Chapter</span>
          </button>
          
          {showContentForm && (
            <div style={styles.formCard}>
              <h3>{editingContent ? 'Edit Chapter' : 'Add Chapter Content'}</h3>
              <form onSubmit={handleAddContent} style={styles.form}>
                <input 
                  placeholder="Chapter Title" 
                  value={contentData.title}
                  onChange={e => setContentData({...contentData, title: e.target.value})}
                  required
                  style={styles.input}
                />
                <textarea
                  placeholder="Chapter Description (optional)"
                  value={contentData.description}
                  onChange={e => setContentData({...contentData, description: e.target.value})}
                  style={styles.textarea}
                  rows={3}
                />
                <select 
                  value={contentData.type}
                  onChange={e => setContentData({...contentData, type: e.target.value})}
                  style={styles.select}
                >
                  <option value="video">Video (URL)</option>
                  <option value="video_upload">Video (Upload)</option>
                  <option value="text">Notes / Text</option>
                  <option value="notes_upload">Notes (PDF/Doc/Image Upload)</option>
                  <option value="link">Reference Link</option>
                </select>
                
                {contentData.type === 'video' && (
                  <input 
                    placeholder="Video URL" 
                    value={contentData.data.url}
                    onChange={e => setContentData({...contentData, data: {...contentData.data, url: e.target.value}})}
                    style={styles.input}
                  />
                )}

                {contentData.type === 'video_upload' && (
                  <div style={styles.uploadGroup}>
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={handleFileUpload} 
                      style={styles.fileInput}
                    />
                    {uploading && <p style={styles.uploadingText}>Uploading video...</p>}
                    {contentData.data.filename && <p style={styles.fileName}>Uploaded: {contentData.data.filename}</p>}
                  </div>
                )}
                
                {contentData.type === 'text' && (
                  <textarea 
                    placeholder="Content (Markdown/HTML)" 
                    value={contentData.data.htmlContent}
                    onChange={e => setContentData({...contentData, data: {...contentData.data, htmlContent: e.target.value}})}
                    style={styles.textarea}
                  />
                )}

                {contentData.type === 'notes_upload' && (
                  <div style={styles.uploadGroup}>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,image/*" 
                      onChange={handleFileUpload} 
                      style={styles.fileInput}
                    />
                    {uploading && <p style={styles.uploadingText}>Uploading file...</p>}
                    {contentData.data.filename && <p style={styles.fileName}>Uploaded: {contentData.data.filename}</p>}
                  </div>
                )}

                {contentData.type === 'link' && (
                  <input 
                    placeholder="Reference Link URL" 
                    value={contentData.data.externalUrl}
                    onChange={e => setContentData({...contentData, data: {...contentData.data, externalUrl: e.target.value}})}
                    style={styles.input}
                  />
                )}

                <div style={styles.formActions}>
                  <button type="submit" style={styles.submitBtn}>{editingContent ? 'Update' : 'Save'} Content</button>
                  <button type="button" onClick={resetContentForm} style={styles.cancelBtn}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={styles.list}>
            {contents.map((item, i) => (
              <div key={item._id} style={styles.itemCard}>
                 <span style={styles.order}>{i+1}</span>
                 <div style={styles.itemInfo}>
                   <h4>{item.title}</h4>
                   {item.description && <p style={styles.itemDesc}>{item.description}</p>}
                   <span style={styles.typeBadge}>{item.type}</span>
                 </div>
                 <div style={styles.itemActions}>
                   <button onClick={() => handleEditContent(item)} style={styles.editBtn}>
                     <EditIcon size={13} color='var(--text-secondary)' />
                     <span style={{ marginLeft: '5px' }}>Edit</span>
                   </button>
                   <button onClick={() => handleDeleteContent(item._id)} style={styles.deleteBtn}>
                     <DeleteIcon size={13} color='var(--error)' />
                     <span style={{ marginLeft: '5px' }}>Delete</span>
                   </button>
                 </div>
              </div>
            ))}
          </div>
        </>

    </div>
  );
}

const styles = {
  container: { padding: '3rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100%' },
  loading: { textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontSize: '16px' },
  backBtn: { 
    marginBottom: '2rem', 
    background: 'rgba(255, 255, 255, 0.03)', 
    border: '1px solid var(--border-dim)', 
    color: 'var(--text-secondary)', 
    padding: '0.75rem 1.5rem', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '700',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  header: { marginBottom: '3rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '2rem' },
  title: { fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.025em' },
  addBtn: { 
    padding: '1rem 2rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '800', 
    marginBottom: '3rem', 
    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  formCard: { 
    background: 'var(--bg-surface)', 
    padding: '2.5rem', 
    borderRadius: '20px', 
    marginBottom: '3rem', 
    border: '1px solid var(--border-dim)', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' },
  input: { 
    padding: '0.9rem 1.125rem', 
    background: 'var(--bg-base)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    width: '100%',
    transition: 'border-color 0.2s',
  },
  textarea: { 
    padding: '0.9rem 1.125rem', 
    background: 'var(--bg-base)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    width: '100%', 
    minHeight: '120px', 
    resize: 'vertical',
    transition: 'border-color 0.2s',
  },
  select: { 
    padding: '0.9rem 1.125rem', 
    background: 'var(--bg-base)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    color: 'var(--text-primary)', 
    outline: 'none', 
    width: '100%', 
    appearance: 'none' 
  },
  submitBtn: { 
    padding: '1rem 2rem', 
    background: 'var(--accent-gradient)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '800',
    transition: 'all 0.2s',
  },
  cancelBtn: { 
    padding: '1rem 2rem', 
    background: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '700',
    transition: 'all 0.2s',
  },
  formActions: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  itemCard: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '2rem', 
    background: 'var(--bg-surface)', 
    padding: '2rem', 
    borderRadius: '20px', 
    border: '1px solid var(--border-dim)', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  order: { 
    background: 'var(--bg-base)', 
    minWidth: '42px', 
    height: '42px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '900', 
    color: 'var(--accent-primary)', 
    fontSize: '15px', 
    border: '1px solid var(--border-dim)',
    boxShadow: 'var(--accent-glow)',
  },
  itemInfo: { display: 'flex', flexDirection: 'column', flex: 1, gap: '0.6rem' },
  itemTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  itemDesc: { fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' },
  typeBadge: { 
    fontSize: '11px', 
    color: 'var(--accent-primary)', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    background: 'rgba(99, 102, 241, 0.1)', 
    padding: '0.4rem 0.8rem', 
    borderRadius: '8px', 
    width: 'fit-content',
    letterSpacing: '0.05em',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  itemActions: { display: 'flex', gap: '0.75rem' },
  editBtn: { 
    padding: '0.75rem 1.25rem', 
    background: 'rgba(255, 255, 255, 0.03)', 
    color: 'var(--text-secondary)', 
    border: '1px solid var(--border-dim)', 
    borderRadius: '10px', 
    fontSize: '13px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  deleteBtn: { 
    padding: '0.75rem 1.25rem', 
    background: 'transparent', 
    color: 'var(--error)', 
    border: '1px solid rgba(239, 68, 68, 0.1)', 
    borderRadius: '10px', 
    fontSize: '13px', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  uploadGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem', 
    padding: '2rem', 
    background: 'var(--bg-base)', 
    borderRadius: '16px', 
    border: '2px dashed var(--border-dim)',
    transition: 'border-color 0.2s',
  },
  fileInput: { color: 'var(--text-secondary)', fontSize: '14px' },
  uploadingText: { color: 'var(--accent-primary)', fontSize: '14px', fontWeight: '700' },
  fileName: { color: 'var(--success)', fontSize: '14px', fontWeight: '600' },
};
