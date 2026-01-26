import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function FinalAssessmentEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  
  // Assessment Form State
  const [assessmentData, setAssessmentData] = useState({
    title: 'Final Exam',
    type: 'final_exam',
    questions: [],
    settings: {
      passingPercentage: 70
    }
  });

  useEffect(() => {
    fetchAssessment();
  }, [courseId]);

  const fetchAssessment = async () => {
    try {
       const res = await apiClient.get(`/api/courses/${courseId}/final-assessment`);
       if (res.data.data) {
         setAssessment(res.data.data);
         setAssessmentData({
           title: res.data.data.title,
           type: 'final_exam',
           questions: res.data.data.questions.map(q => {
             // Remap MCQ correct answer index
             if (q.type === 'mcq') {
               const correctIndex = q.options.findIndex(opt => opt === q.correctAnswer);
               return {
                 ...q,
                 correctAnswer: correctIndex >= 0 ? correctIndex : 0
               };
             }
             return { ...q };
           }),
           settings: res.data.data.settings || { passingPercentage: 70 }
         });
       }
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setAssessmentData({
      ...assessmentData,
      questions: [
        ...assessmentData.questions,
        { type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 5 }
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

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...assessmentData,
        questions: assessmentData.questions.map(q => ({
          ...q,
          correctAnswer: q.type === 'mcq' ? q.options[q.correctAnswer] : q.correctAnswer
        }))
      };
      
      if (assessment) {
        await apiClient.put(`/api/courses/assessments/${assessment._id}`, processedData);
      } else {
        await apiClient.post(`/api/courses/${courseId}/assessment`, processedData);
      }
      
      alert('Final Assessment Saved Successfully');
      navigate(`/course/${courseId}`);
    } catch (error) {
      alert('Failed to save assessment');
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(`/course/${courseId}`)} style={styles.backBtn}>← Back to Course</button>
      
      <div style={styles.header}>
        <h1 style={styles.title}>Final Exam Editor</h1>
        <p style={styles.subtitle}>Create the mandatory final assessment for this course.</p>
      </div>

      <div style={styles.formCard}>
        <form onSubmit={handleSaveAssessment} style={styles.form}>
          <div style={styles.settingsRow}>
             <div style={{flex: 1}}>
                <label style={styles.label}>Assessment Title</label>
                <input 
                  value={assessmentData.title}
                  onChange={e => setAssessmentData({...assessmentData, title: e.target.value})}
                  style={styles.input}
                  required
                />
             </div>
             <div style={{width: '200px'}}>
                <label style={styles.label}>Passing Score (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={assessmentData.settings.passingPercentage}
                  onChange={e => setAssessmentData({
                    ...assessmentData, 
                    settings: { ...assessmentData.settings, passingPercentage: parseInt(e.target.value) }
                  })}
                  style={styles.input}
                  required
                />
             </div>
          </div>
          
          <h3 style={styles.sectionTitle}>Questions</h3>
          
          <div style={styles.questionsList}>
          {assessmentData.questions.map((q, qIndex) => (
            <div key={qIndex} style={styles.questionCard}>
              <div style={styles.qHeader}>
                <span>Question {qIndex + 1}</span>
                <div style={styles.controls}>
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
                  <input 
                    type="number"
                    placeholder="Points"
                    value={q.points || 5}
                    onChange={e => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                    style={styles.pointInput}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuestion(qIndex)} 
                    style={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <textarea 
                placeholder="Question Text"
                value={q.question}
                onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)}
                style={styles.textarea}
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
                  <button type="button" onClick={() => handleAddOption(qIndex)} style={styles.textBtn}>+ Add Option</button>
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
          </div>

          <button type="button" onClick={handleAddQuestion} style={styles.addBtn}>+ Add Question</button>
          
          <div style={styles.formActions}>
            <button type="submit" style={styles.submitBtn}>Save Final Exam</button>
            <button type="button" onClick={() => navigate(`/course/${courseId}`)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1000px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  backBtn: { marginBottom: '1rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  formCard: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  settingsRow: { display: 'flex', gap: '1.5rem', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' },
  input: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', fontSize: '15px' },
  textarea: { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', fontSize: '15px', minHeight: '80px', fontFamily: 'inherit' },
  select: { padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' },
  pointInput: { width: '80px', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' },
  questionsList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  questionCard: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', fontWeight: '600', color: '#475569' },
  controls: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  removeBtn: { padding: '0.5rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  inputSmall: { padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', flex: 1 },
  textBtn: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '0.5rem' },
  addBtn: { padding: '1rem', background: 'white', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '1rem', transition: 'all 0.2s' },
  formActions: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  submitBtn: { padding: '0.875rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.875rem 2rem', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
};
