import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

export default function TakeAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startAssessment();
  }, [assessmentId]);

  const startAssessment = async () => {
    try {
      const res = await apiClient.get(`/assessments/${assessmentId}/start`);
      setAssessment(res.data.data);
      setQuestions(res.data.data.questions || []);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    console.log('[TakeAssessment] Answer changed:', { questionId, answer, type: typeof answer });
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(answers).length < questions.length) {
      if (!confirm('You haven\'t answered all questions. Submit anyway?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q._id,
        answer: answers[q._id] ?? ''  // Use ?? instead of || to preserve 0
      }));

      console.log('[TakeAssessment] Submitting answers:', formattedAnswers);
      console.log('[TakeAssessment] Raw answers state:', answers);

      const res = await apiClient.post(`/assessments/${assessmentId}/submit`, {
        answers: formattedAnswers,
        enrollmentId: location.state?.enrollmentId // Explicitly pass context
      });

      // Navigate to results (store in state or pass via URL)
      navigate(`/assessment/${assessmentId}/results`, { 
          state: { 
              results: res.data.data,
              enrollmentId: location.state?.enrollmentId // Pass it forward
          } 
      });
    } catch (error) {
      alert('Failed to submit assessment');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading assessment...</div>;
  if (!assessment) return <div style={styles.loading}>Assessment not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{assessment.title}</h1>
        <p style={styles.subtitle}>{questions.length} Questions</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {questions.map((question, index) => (
          <div key={question._id} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>Question {index + 1}</span>
              <span style={styles.questionType}>
                {question.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
              </span>
            </div>
            
            <p style={styles.questionText}>{question.question}</p>

            {question.type === 'mcq' && (
              <div style={styles.optionsList}>
                  {question.options.map((option, optIdx) => (
                  <label key={optIdx} style={styles.optionLabel}>
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={optIdx}
                      checked={answers[question._id] === optIdx}
                      onChange={() => handleAnswerChange(question._id, optIdx)}
                      style={styles.radio}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'fill_in_the_blank' && (
              <input
                type="text"
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder="Your answer"
                style={styles.textInput}
              />
            )}
          </div>
        ))}

        <div style={styles.actions}>
          <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '18px', color: '#64748b' },
  header: { background: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  title: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.025em' },
  subtitle: { fontSize: '14px', color: '#64748b', fontWeight: '500' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  questionCard: { background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f1f5f9' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  questionNumber: { fontSize: '14px', fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' },
  questionType: { fontSize: '12px', padding: '0.375rem 0.75rem', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontWeight: '600' },
  questionText: { fontSize: '18px', color: '#334155', marginBottom: '2rem', lineHeight: '1.6', fontWeight: '600' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  optionLabel: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', background: '#fff' },
  radio: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#4f46e5' },
  textInput: { width: '100%', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', color: '#1e293b' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' },
  cancelBtn: { padding: '1rem 2rem', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  submitBtn: { padding: '1rem 3rem', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)', transition: 'transform 0.2s' },
};
