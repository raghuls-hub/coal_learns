import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function AssessmentResults() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const results = location.state?.results;

  if (!results) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>No results found</h2>
          <p>Please take the assessment first</p>
          <button onClick={() => navigate(-1)} style={styles.button}>Go Back</button>
        </div>
      </div>
    );
  }

  const { score, passed } = results;
  const percentage = score?.percentage || 0;

  return (
    <div style={styles.container}>
      <div style={styles.resultCard}>
        <div style={passed ? styles.headerSuccess : styles.headerFail}>
          <div style={styles.scoreCircle}>
            <div style={styles.scoreNumber}>{percentage}%</div>
            <div style={styles.scoreLabelHeader}>Score</div>
          </div>
          <h1 style={styles.resultText}>{passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}</h1>
          <p style={styles.resultSubtext}>
            {passed ? 'You passed the assessment!' : 'You can retake this assessment to improve your score'}
          </p>
        </div>

        <div style={styles.scoreDetails}>
          <div style={styles.scoreItem}>
            <span style={styles.scoreLabel}>Obtained</span>
            <span style={styles.scoreValue}>{score?.obtained || 0} pts</span>
          </div>
          <div style={styles.scoreItem}>
            <span style={styles.scoreLabel}>Total</span>
            <span style={styles.scoreValue}>{score?.total || 0} pts</span>
          </div>
          <div style={styles.scoreItem}>
            <span style={styles.scoreLabel}>Status</span>
            <span style={passed ? styles.passedBadge : styles.failedBadge}>
              {passed ? 'Passed' : 'Not Passed'}
            </span>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={() => navigate('/my-learning')} style={styles.primaryBtn}>
            Continue Learning
          </button>
          <button onClick={() => navigate(`/assessment/${assessmentId}/take`)} style={styles.secondaryBtn}>
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' },
  error: { background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center' },
  resultCard: { maxWidth: '600px', width: '100%', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  headerSuccess: { padding: '3rem 2rem', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', textAlign: 'center' },
  headerFail: { padding: '3rem 2rem', background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)', color: 'white', textAlign: 'center' },
  scoreCircle: { width: '120px', height: '120px', margin: '0 auto 2rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,0.3)' },
  scoreNumber: { fontSize: '32px', fontWeight: '700' },
  scoreLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  scoreLabelHeader: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  resultText: { fontSize: '28px', fontWeight: '700', marginBottom: '0.5rem' },
  resultSubtext: { fontSize: '16px', opacity: 0.9 },
  scoreDetails: { padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' },
  scoreItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  scoreValue: { fontSize: '20px', fontWeight: '700', color: '#2d3748' },
  passedBadge: { display: 'inline-block', padding: '0.5rem 1rem', background: '#C6F6D5', color: '#22543D', fontSize: '14px', fontWeight: '700', borderRadius: '6px' },
  failedBadge: { display: 'inline-block', padding: '0.5rem 1rem', background: '#FED7D7', color: '#C53030', fontSize: '14px', fontWeight: '700', borderRadius: '6px' },
  actions: { padding: '2rem', display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0' },
  primaryBtn: { flex: 1, padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { flex: 1, padding: '1rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  button: { marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
};
