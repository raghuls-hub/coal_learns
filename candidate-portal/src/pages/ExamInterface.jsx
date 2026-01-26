import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function ExamInterface() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const [examStarted, setExamStarted] = useState(false);
    const [module, setModule] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes default
    const [violations, setViolations] = useState(0);

    // Prevention Flags
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        fetchExamData();
    }, []);

    const fetchExamData = async () => {
        try {
            const response = await apiClient.get(`/api/courses/${courseId}/modules/${moduleId}`);
            const moduleData = response.data.data;
            setModule(moduleData);

            if (moduleData.assessment && moduleData.assessment.questions) {
                setQuestions(moduleData.assessment.questions);
            }
        } catch (error) {
            alert('Failed to load exam data');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Security Measures
    useEffect(() => {
        if (!examStarted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(v => v + 1);
                alert(`WARNING: Tab switching detected! This is violation #${violations + 1}.`);
            }
        };

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setViolations(v => v + 1);
                alert(`WARNING: You exited full screen! This is violation #${violations + 1}.`);
            }
        };

        const handleContextMenu = (e) => e.preventDefault();
        const handleCopyPaste = (e) => e.preventDefault();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
        };
    }, [examStarted, violations]);

    const startExam = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullScreen(true);
            setExamStarted(true);
        } catch (error) {
            alert('Full screen mode is required to start this exam.');
        }
    };

    const submitExam = async () => {
        if (!confirm('Are you sure you want to submit?')) return;

        // Calculate score locally for demo (Server validation recommended in production)
        // Here we just send what we have
        // Real implementation: POST /api/exam/submit

        // Cleanup security
        if (document.exitFullscreen) {
            await document.exitFullscreen().catch(err => console.log(err));
        }

        alert(`Exam Submitted! Violations recorded: ${violations}`);
        navigate(`/course/${courseId}`);
    };

    const handleAnswerSelect = (answer) => {
        setAnswers({
            ...answers,
            [currentQuestionIndex]: answer
        });
    };

    if (loading) return <div>Loading exam...</div>;

    if (!examStarted) {
        return (
            <div style={styles.startScreen}>
                <div style={styles.card}>
                    <h1>🛡️ Secure Assessment Environment</h1>
                    <h3>{module?.title} - Assessment</h3>

                    <div style={styles.rules}>
                        <h4>⚠️ Exam Rules:</h4>
                        <ul>
                            <li>Full screen mode is mandatory.</li>
                            <li>Tab switching is monitored and recorded.</li>
                            <li>Copy/Paste and Right-click are disabled.</li>
                            <li>Multiple violations may result in disqualification.</li>
                        </ul>
                    </div>

                    <button onClick={startExam} style={styles.startBtn}>
                        I Agree & Start Exam
                    </button>
                    <button onClick={() => navigate(`/course/${courseId}`)} style={styles.cancelBtn}>
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div style={styles.examContainer}>
            <div style={styles.examHeader}>
                <div>
                    <h3>{module?.title} Assessment</h3>
                    <span style={{ color: violations > 0 ? 'red' : 'green' }}>
                        Violations: {violations}
                    </span>
                </div>
                <div style={styles.timer}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={submitExam} style={styles.submitTopBtn}>Submit Exam</button>
            </div>

            <div style={styles.questionArea}>
                <div style={styles.progress}>Question {currentQuestionIndex + 1} of {questions.length}</div>

                <h2 style={styles.questionText}>{currentQuestion.question}</h2>

                {currentQuestion.type === 'mcq' ? (
                    <div style={styles.options}>
                        {currentQuestion.options.map((opt, idx) => (
                            <label key={idx} style={{
                                ...styles.optionLabel,
                                backgroundColor: answers[currentQuestionIndex] === opt ? '#ebf4ff' : 'white',
                                borderColor: answers[currentQuestionIndex] === opt ? '#4299e1' : '#e2e8f0'
                            }}>
                                <input
                                    type="radio"
                                    name="answer"
                                    value={opt}
                                    checked={answers[currentQuestionIndex] === opt}
                                    onChange={() => handleAnswerSelect(opt)}
                                    style={{ marginRight: '1rem' }}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                ) : (
                    <input
                        type="text"
                        placeholder="Type your answer here..."
                        value={answers[currentQuestionIndex] || ''}
                        onChange={(e) => handleAnswerSelect(e.target.value)}
                        style={styles.textInput}
                    />
                )}

                <div style={styles.navigation}>
                    <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(c => c - 1)}
                        style={styles.navBtn}
                    >
                        Previous
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(c => c + 1)}
                            style={styles.nextBtn}
                        >
                            Next Option
                        </button>
                    ) : (
                        <button onClick={submitExam} style={styles.finishBtn}>
                            Finish & Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    startScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f7fafc' },
    card: { padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '500px', textAlign: 'center' },
    rules: { textAlign: 'left', background: '#fff5f5', padding: '1.5rem', borderRadius: '8px', margin: '2rem 0', color: '#c53030' },
    startBtn: { width: '100%', padding: '1rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem' },
    cancelBtn: { width: '100%', padding: '1rem', background: 'white', color: '#4a5568', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },

    examContainer: { height: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column' },
    examHeader: { padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    timer: { fontSize: '20px', fontWeight: 'bold', color: '#2b6cb0', padding: '0.5rem 1rem', background: '#ebf4ff', borderRadius: '20px' },
    submitTopBtn: { padding: '0.5rem 1rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },

    questionArea: { flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    progress: { textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px', color: '#718096', marginBottom: '1rem' },
    questionText: { fontSize: '24px', color: '#2d3748', marginBottom: '2rem' },
    options: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    optionLabel: { padding: '1.5rem', border: '2px solid', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
    textInput: { padding: '1.5rem', fontSize: '18px', borderRadius: '8px', border: '2px solid #e2e8f0', width: '100%' },

    navigation: { display: 'flex', justifyContent: 'space-between', marginTop: '3rem' },
    navBtn: { padding: '0.75rem 1.5rem', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
    nextBtn: { padding: '0.75rem 1.5rem', background: '#4299e1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
    finishBtn: { padding: '0.75rem 1.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
};
