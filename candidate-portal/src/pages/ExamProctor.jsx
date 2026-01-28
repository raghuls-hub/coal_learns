import React, { useState } from 'react';
import { useExamProctor } from '../hooks/useExamProctor';
import { useLocation } from 'react-router-dom';

export default function ExamProctor({ assessmentId, isProctoringEnabled = false, children, onExit }) {
  const location = useLocation();
  const { 
    isChrome, 
    isFullScreen, 
    enterFullScreen, 
    warnings, 
    isLocked, 
    lockReason 
  } = useExamProctor(assessmentId, isProctoringEnabled);

  const [copied, setCopied] = useState(false);

  // Helper to generate the copy link
  const getCopyLink = () => {
    const currentUrl = window.location.href;
    // Add token if not present and available (handled by authOrToken on backend, but here just copy URL)
    // If we need to pass local auth state, we might need a token in query param. 
    // For now assuming user can login or token is in URL.
    return currentUrl;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getCopyLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If proctoring disabled, just render children
  if (!isProctoringEnabled) return children;

  // 1. Browser Blocking
  if (!isChrome) {
    return (
      <div style={styles.glassContainer}>
        <div style={styles.glassCard}>
          <div style={styles.iconWrapper}>🚫</div>
          <h2 style={{...styles.title, color: '#e53e3e'}}>Browser Not Supported</h2>
          <p style={styles.text}>
             This assessment requires <strong>Google Chrome</strong> to ensure integrity.
             Please switch to Chrome to continue.
          </p>
          
          <div style={styles.copyBox}>
              <input 
                readOnly 
                value={getCopyLink()} 
                style={styles.copyInput} 
              />
              <button onClick={handleCopyLink} style={styles.copyBtn}>
                  {copied ? 'Copied!' : 'Copy Link'}
              </button>
          </div>
          <p style={{fontSize: 12, color: '#4a5568', marginTop: 10}}>* Copy this link and paste it into Google Chrome</p>

          <button onClick={onExit} style={styles.glassBtnSecondary}>Return to Course</button>
        </div>
      </div>
    );
  }

  // 2. Locked Screen
  if (isLocked) {
      return (
          <div style={styles.glassContainer}>
            <div style={{...styles.glassCard, borderColor: '#e53e3e', borderWidth: 2}}>
              <div style={styles.iconWrapper}>🔒</div>
              <h2 style={{...styles.title, color: '#e53e3e'}}>Assessment Locked</h2>
              <p style={styles.text}>
                  This assessment has been locked due to proctoring violations.
              </p>
              <div style={styles.reasonBox}>
                  <strong>Reason:</strong> {lockReason}
              </div>
              <p style={{...styles.text, fontSize: 14, color: '#2d3748'}}>
                  A notification has been sent to your specific tutor. 
                  You cannot continue until they manually unlock your session.
              </p>
              <button onClick={onExit} style={styles.glassBtnSecondary}>Return to Course</button>
            </div>
          </div>
        );
  }

  // 3. Instruction Modal (Gate to Full Screen)
  if (!isFullScreen) {
      return (
          <div style={styles.glassContainer}>
            <div style={{...styles.glassCard, maxWidth: 650}}>
              <div style={styles.iconWrapper}>🛡️</div>
              <h2 style={styles.title}>Proctored Assessment</h2>
              <p style={styles.text}>
                  You are about to start a monitored exam session. 
                  Efficiency and integrity are paramount.
              </p>
              
              <div style={styles.rulesGrid}>
                  <div style={styles.ruleItem}>
                      <span style={styles.ruleIcon}>🖥️</span>
                      <div>
                          <strong>Full Screen</strong>
                          <p style={styles.ruleDesc}>Must stay in full screen mode.</p>
                      </div>
                  </div>
                  <div style={styles.ruleItem}>
                      <span style={styles.ruleIcon}>🖱️</span>
                      <div>
                          <strong>No Tab Switching</strong>
                          <p style={styles.ruleDesc}>Leaving the tab triggers a warning.</p>
                      </div>
                  </div>
                  <div style={styles.ruleItem}>
                      <span style={styles.ruleIcon}>📋</span>
                      <div>
                          <strong>No Clipboard</strong>
                          <p style={styles.ruleDesc}>Copy/Paste is disabled.</p>
                      </div>
                  </div>
                  <div style={styles.ruleItem}>
                      <span style={styles.ruleIcon}>⚠️</span>
                      <div>
                          <strong>3 Strikes Rule</strong>
                          <p style={styles.ruleDesc}>3 warnings = Immediate Lock.</p>
                      </div>
                  </div>
              </div>

              <div style={styles.warningBox}>
                  <strong>Consequences:</strong> Locking requires Tutor intervention to resume.
              </div>

              <div style={styles.actions}>
                  <button onClick={onExit} style={styles.glassBtnSecondary}>Cancel</button>
                  <button onClick={enterFullScreen} style={styles.glassBtnPrimary}>
                      I Agree & Start Assessment
                  </button>
              </div>
            </div>
          </div>
      );
  }

  // 4. Render Exam with Warnings
  return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Warning Overlay */}
          {warnings > 0 && (
              <div style={styles.warningOverlay}>
                  ⚠️ Warning {warnings}/3
              </div>
          )}
          
          {children}
      </div>
  );
}

const styles = {
  glassContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f3f4f6', // Fallback
      backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
  },
  glassCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '40px',
      borderRadius: '20px',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      maxWidth: '600px',
      width: '90%',
      textAlign: 'center',
      color: '#1a202c',
  },
  title: {
      fontSize: '28px',
      fontWeight: '800',
      marginBottom: '10px',
      color: '#2d3748',
      letterSpacing: '-0.5px',
  },
  text: {
      fontSize: '16px',
      color: '#4a5568',
      marginBottom: '30px',
      lineHeight: 1.6,
  },
  iconWrapper: {
      fontSize: '40px',
      marginBottom: '20px',
      background: 'white',
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  rulesGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '30px',
      textAlign: 'left',
  },
  ruleItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '15px',
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.5)',
  },
  ruleIcon: {
      fontSize: '20px',
  },
  ruleDesc: {
      fontSize: '13px',
      color: '#718096',
      margin: 0,
      marginTop: '4px',
  },
  warningBox: {
      backgroundColor: '#fff5f5',
      color: '#c53030',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '30px',
      fontSize: '14px',
      border: '1px solid #fed7d7',
  },
  actions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
  },
  glassBtnPrimary: {
      padding: '12px 30px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: '#3182ce',
      backgroundImage: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
      color: 'white',
      boxShadow: '0 4px 6px rgba(50, 130, 206, 0.3)',
      transition: 'transform 0.2s',
  },
  glassBtnSecondary: {
      padding: '12px 30px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      backgroundColor: 'white',
      color: '#4a5568',
      border: '1px solid #e2e8f0',
      transition: 'background 0.2s',
  },
  
  // Copy Link Styles
  copyBox: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
  },
  copyInput: {
      flex: 1,
      padding: '10px 15px',
      borderRadius: '8px',
      border: '1px solid #cbd5e0',
      backgroundColor: '#f7fafc',
      color: '#4a5568',
      outline: 'none',
  },
  copyBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      backgroundColor: '#4a5568',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
  },

  reasonBox: {
      backgroundColor: '#fff5f5',
      color: '#c53030',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      fontWeight: 'bold',
  },
  
  warningOverlay: {
      position: 'fixed',
      top: 20,
      right: 20,
      backgroundColor: '#e53e3e',
      color: 'white',
      padding: '10px 20px',
      borderRadius: 30,
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      animation: 'pulse 2s infinite',
  }
};
