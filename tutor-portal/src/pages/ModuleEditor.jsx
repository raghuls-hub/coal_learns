import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

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
    data: { url: '', htmlContent: '', externalUrl: '' }
  });

  // Assessment Form State
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState({
    title: '',
    type: 'module_assessment',
    questions: [],
    settings: {
      timeLimit: 0,
      proctoring: { enabled: false }
    }
  });

  useEffect(() => {
    fetchModuleDetails();
  }, [moduleId]);

  const fetchModuleDetails = async () => {
    try {
       const moduleRes = await apiClient.get(`/api/courses/${courseId}/modules/${moduleId}`);
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
    setContentData({ title: '', description: '', type: 'video', data: { url: '', htmlContent: '', externalUrl: '' } });
    setEditingContent(null);
    setShowContentForm(false);
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    try {
      if (editingContent) {
        await apiClient.put(`/api/courses/content/${editingContent._id}`, contentData);
      } else {
        await apiClient.post(`/api/courses/${courseId}/modules/${moduleId}/content`, {
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
      await apiClient.delete(`/api/courses/content/${contentId}`);
      fetchModuleDetails();
    } catch (error) {
      alert('Failed to delete content');
    }
  };

  const resetAssessmentForm = () => {
    setAssessmentData({ 
        title: '', 
        type: 'module_assessment', 
        questions: [],
        settings: { timeLimit: 0, proctoring: { enabled: false } }
    });
    setEditingAssessment(false);
    setShowAssessmentForm(false);
  };

  const handleEditAssessment = () => {
    const assessment = module.assessment;
    setAssessmentData({
      title: assessment.title,
      type: assessment.type,
      questions: assessment.questions.map(q => {
        if (q.type === 'mcq') {
          // Find the index of the correct answer in options
          const correctIndex = q.options.findIndex(opt => opt === q.correctAnswer);
          return {
            ...q,
            correctAnswer: correctIndex >= 0 ? correctIndex : 0
          };
        }
        return { ...q };
      }),
      settings: {
        timeLimit: assessment.settings?.timeLimit || 0,
        proctoring: { 
            enabled: assessment.settings?.proctoring?.enabled || false 
        }
      }
    });
    setEditingAssessment(true);
    setShowAssessmentForm(true);
  };

  const handleDeleteAssessment = async () => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      await apiClient.delete(`/api/courses/assessments/${module.assessment._id}`);
      fetchModuleDetails();
    } catch (error) {
      alert('Failed to delete assessment');
    }
  };

  const handleAddQuestion = () => {
    setAssessmentData({
      ...assessmentData,
      questions: [
        ...assessmentData.questions,
        { type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0 }
      ]
    });
  };

  const handleRemoveQuestion = (qIndex) => {
    const updatedQuestions = assessmentData.questions.filter((_, i) => i !== qIndex);
    setAssessmentData({ ...assessmentData, questions: updatedQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...assessmentData.questions];
    updatedQuestions[index][field] = value;
    setAssessmentData({ ...assessmentData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
     const updatedQuestions = [...assessmentData.questions];
     updatedQuestions[qIndex].options[oIndex] = value;
     setAssessmentData({ ...assessmentData, questions: updatedQuestions });
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...assessmentData.questions];
    updatedQuestions[qIndex].options.push('');
    setAssessmentData({ ...assessmentData, questions: updatedQuestions });
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...assessmentData,
        questions: assessmentData.questions.map(q => ({
          ...q,
          correctAnswer: q.type === 'mcq' ? q.options[q.correctAnswer] : q.correctAnswer
        }))
      };
      
      if (editingAssessment) {
        await apiClient.put(`/api/courses/assessments/${module.assessment._id}`, processedData);
      } else {
        await apiClient.post(`/api/courses/${courseId}/modules/${moduleId}/assessment`, processedData);
      }
      
      resetAssessmentForm();
      fetchModuleDetails();
    } catch (error) {
      alert('Failed to save assessment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!module) return <div>Module not found</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(`/course/${courseId}`)} style={styles.backBtn}>← Back to Course</button>
      
      <div style={styles.header}>
        <h1 style={styles.title}>{module.title}</h1>
        <div style={styles.tabs}>
           <button 
             style={activeTab === 'content' ? styles.activeTab : styles.tab}
             onClick={() => setActiveTab('content')}
           >
             Chapter Content
           </button>
           <button 
             style={activeTab === 'assessment' ? styles.activeTab : styles.tab}
             onClick={() => setActiveTab('assessment')}
           >
             Assessment
           </button>
        </div>
      </div>

      {activeTab === 'content' && (
        <>
          <button onClick={() => setShowContentForm(true)} style={styles.addBtn}>+ Add New Chapter</button>
          
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
                  <option value="text">Notes / Text</option>
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
                
                {contentData.type === 'text' && (
                  <textarea 
                    placeholder="Content (Markdown/HTML)" 
                    value={contentData.data.htmlContent}
                    onChange={e => setContentData({...contentData, data: {...contentData.data, htmlContent: e.target.value}})}
                    style={styles.textarea}
                  />
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
                   <button onClick={() => handleEditContent(item)} style={styles.editBtn}>Edit</button>
                   <button onClick={() => handleDeleteContent(item._id)} style={styles.deleteBtn}>Delete</button>
                 </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'assessment' && (
        <>
           {!module.assessment || showAssessmentForm ? (
             <>
               {!module.assessment && !showAssessmentForm && (
                 <button onClick={() => setShowAssessmentForm(true)} style={styles.addBtn}>+ Create Assessment</button>
               )}
               
               {showAssessmentForm && (
                 <div style={styles.formCard}>
                   <h3>{editingAssessment ? 'Edit Assessment' : 'Assessment Builder'}</h3>
                   <form onSubmit={handleCreateAssessment} style={styles.form}>
                   <input 
                      placeholder="Assessment Title" 
                      value={assessmentData.title}
                      onChange={e => setAssessmentData({...assessmentData, title: e.target.value})}
                      style={styles.input}
                      required
                   />
                   
                   <div style={styles.settingsRow}>
                       <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14}}>
                           <input 
                               type="checkbox"
                               checked={assessmentData.settings?.proctoring?.enabled || false}
                               onChange={e => setAssessmentData({
                                   ...assessmentData,
                                   settings: {
                                       ...assessmentData.settings,
                                       proctoring: { ...assessmentData.settings?.proctoring, enabled: e.target.checked }
                                   }
                               })}
                           />
                           Enable Strict Proctoring
                       </label>
                       
                       <label style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 14}}>
                           Time Limit (Minutes):
                           <input 
                               type="number"
                               value={assessmentData.settings?.timeLimit || 0}
                               onChange={e => setAssessmentData({
                                   ...assessmentData,
                                   settings: {
                                       ...assessmentData.settings,
                                       timeLimit: parseInt(e.target.value) || 0
                                   }
                               })}
                               style={{...styles.inputSmall, width: 80}}
                           />
                           (0 = No Limit)
                       </label>
                   </div>
                   
                   {assessmentData.questions.map((q, qIndex) => (
                     <div key={qIndex} style={styles.questionCard}>
                       <div style={styles.qHeader}>
                         <span>Question {qIndex + 1}</span>
                         <div style={{display: 'flex', gap: '0.5rem'}}>
                           <select 
                             value={q.type}
                             onChange={e => {
                               const updatedQ = {...q, type: e.target.value};
                               if (e.target.value === 'fill_in_the_blank') {
                                 updatedQ.options = [];
                                 updatedQ.correctAnswer = '';
                               } else if (e.target.value === 'mcq' && q.options.length === 0) {
                                 updatedQ.options = ['', '', '', ''];
                                 updatedQ.correctAnswer = 0;
                               }
                               const updated = [...assessmentData.questions];
                               updated[qIndex] = updatedQ;
                               setAssessmentData({ ...assessmentData, questions: updated });
                             }}
                             style={styles.select}
                           >
                             <option value="mcq">Multiple Choice</option>
                             <option value="fill_in_the_blank">Fill in the Blank</option>
                           </select>
                           <button 
                             type="button" 
                             onClick={() => handleRemoveQuestion(qIndex)} 
                             style={styles.removeBtn}
                           >
                             cancel
                           </button>
                         </div>
                       </div>
                       
                       <input 
                         placeholder="Question Text"
                         value={q.question}
                         onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)}
                         style={styles.input}
                         required
                       />
                       
                       {q.type === 'mcq' && (
                         <>
                           <div style={styles.optionsList}>
                             {q.options.map((opt, oIndex) => (
                               <div key={oIndex} style={styles.optionRow}>
                                 <input
                                   type="radio"
                                   name={`q${qIndex}_correct`}
                                   checked={q.correctAnswer === oIndex}
                                   onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                 />
                                 <input 
                                   placeholder={`Option ${oIndex+1}`}
                                   value={opt}
                                   onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                   style={styles.inputSmall}
                                   required
                                 />
                               </div>
                             ))}
                           </div>
                           <button type="button" onClick={() => handleAddOption(qIndex)} style={styles.secondaryBtn}>+ Add Option</button>
                         </>
                       )}
                       
                       {q.type === 'fill_in_the_blank' && (
                         <input 
                           placeholder="Correct Answer"
                           value={q.correctAnswer}
                           onChange={e => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                           style={styles.input}
                           required
                         />
                       )}
                     </div>
                   ))}

                   <button type="button" onClick={handleAddQuestion} style={styles.secondaryBtn}>+ Add Question</button>
                   <div style={styles.formActions}>
                     <button type="submit" style={styles.submitBtn}>{editingAssessment ? 'Update' : 'Save'} Assessment</button>
                     <button type="button" onClick={resetAssessmentForm} style={styles.cancelBtn}>Cancel</button>
                   </div>
                   </form>
                 </div>
               )}
             </>
           ) : (
             <div style={styles.assessmentView}>
               <div style={styles.assessmentHeader}>
                 <h3>{module.assessment.title}</h3>
                 <div style={{display: 'flex', gap: '0.5rem'}}>
                   <button type="button" onClick={handleEditAssessment} style={styles.editBtn}>Edit</button>
                   <button type="button" onClick={handleDeleteAssessment} style={styles.deleteBtn}>Delete</button>
                 </div>
               </div>
               
               <div style={styles.questionsList}>
                 {module.assessment.questions.map((q, i) => (
                   <div key={i} style={styles.questionViewCard}>
                     <div style={styles.questionHeader}>
                       <strong>Question {i + 1}</strong>
                       <span style={styles.typeBadge}>{q.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}</span>
                     </div>
                     <p style={styles.questionText}>{q.question}</p>
                     
                     {q.type === 'mcq' && (
                       <div style={styles.optionsView}>
                         {q.options.map((opt, oi) => (
                           <div key={oi} style={styles.optionViewRow}>
                             <span style={opt === q.correctAnswer ? styles.correctOption : styles.option}>
                               {opt === q.correctAnswer && '✓ '}{opt}
                             </span>
                           </div>
                         ))}
                       </div>
                     )}
                     
                     {q.type === 'fill_in_the_blank' && (
                       <div style={styles.answerView}>
                         <strong>Answer:</strong> {q.correctAnswer}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100%' },
  backBtn: { marginBottom: '1rem', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  header: { marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' },
  tabs: { display: 'flex', gap: '1rem' },
  tab: { padding: '0.5rem 1rem', background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '16px', fontWeight: '500' },
  activeTab: { padding: '0.5rem 1rem', background: '#ebf4ff', color: '#2b6cb0', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
  addBtn: { padding: '0.75rem 1.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginBottom: '2rem' },
  formCard: { background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' },
  input: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%' },
  textarea: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%', minHeight: '80px' },
  select: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%' },
  submitBtn: { padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  secondaryBtn: { padding: '0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '0.5rem' },
  cancelBtn: { padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  removeBtn: { padding: '0.5rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  formActions: { display: 'flex', gap: '0.5rem', marginTop: '1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  itemCard: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
  order: { background: '#edf2f7', minWidth: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4a5568' },
  itemInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
  itemDesc: { fontSize: '13px', color: '#718096', marginTop: '0.25rem' },
  typeBadge: { fontSize: '12px', color: '#718096', textTransform: 'uppercase', background: '#f7fafc', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '0.25rem' },
  itemActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { padding: '0.5rem 1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  deleteBtn: { padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  questionCard: { background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  inputSmall: { padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', flex: 1 },
  assessmentView: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  assessmentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  questionsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  questionViewCard: { background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  questionText: { fontSize: '15px', color: '#2d3748', marginBottom: '0.75rem', fontWeight: '500' },
  optionsView: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' },
  optionViewRow: { display: 'flex', alignItems: 'center' },
  option: { padding: '0.5rem', fontSize: '14px', color: '#4a5568' },
  correctOption: { padding: '0.5rem', fontSize: '14px', color: '#48bb78', fontWeight: '600' },
  answerView: { padding: '0.75rem', background: '#f0fff4', borderRadius: '6px', color: '#276749', fontSize: '14px' },
  settingsRow: { display: 'flex', gap: '2rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' },
  badgeProctor: { background: '#fed7d7', color: '#c53030', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  badgeTime: { background: '#bee3f8', color: '#2b6cb0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
};
