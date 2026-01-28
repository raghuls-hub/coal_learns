import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api';

const MAX_WARNINGS = 2; // Lock on 3rd violation (0, 1, 2 = 3 strikes)

export function useExamProctor(assessmentId, isProctoringEnabled = false) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [isChrome, setIsChrome] = useState(true);
  
  // Track warnings locally to debounce/prevent spam
  const warningCountRef = useRef(0);
  
  // --- 1. Browser Check ---
  useEffect(() => {
    if (!isProctoringEnabled) return;

    const isChromeBrowser = (() => {
      const ua = navigator.userAgent;
      const vendor = navigator.vendor;
      
      // Basic check
      const isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor);
      
      // Exclude Edge (Edg), Opera (OPR), Brave (difficult, but check typical signals)
      const isEdge = /Edg/.test(ua);
      const isOpera = /OPR/.test(ua) || /Opr/.test(ua);
      
      return isChrome && !isEdge && !isOpera;
    })();
    
    setIsChrome(isChromeBrowser);
    
    // Initial Status Check
    checkProctorStatus();
  }, [assessmentId, isProctoringEnabled]);

  const checkProctorStatus = async () => {
    try {
      const res = await apiClient.get(`/assessments/${assessmentId}/proctor/status`);
      setWarnings(res.data.warningsCount);
      warningCountRef.current = res.data.warningsCount;
      setIsLocked(res.data.isLocked);
      setLockReason(res.data.lockReason);
    } catch (err) {
      console.error('[Proctor] Status check failed', err);
    }
  };

  // --- 2. Full Screen Management ---
  const enterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      }
      setIsFullScreen(true);
    } catch (err) {
      console.error('[Proctor] Fullscreen failed', err);
    }
  };

  // --- 3. Violation Logging ---
  const logViolation = useCallback(async (reason) => {
    if (isLocked) return;
    
    console.warn(`[Proctor] Violation: ${reason}`);
    
    // Optimistic Update
    const newCount = warningCountRef.current + 1;
    warningCountRef.current = newCount;
    setWarnings(newCount);

    try {
      if (newCount > MAX_WARNINGS) {
        // LOCK
        setIsLocked(true);
        setLockReason(reason);
        await apiClient.post(`/assessments/${assessmentId}/proctor/lock`, { reason });
      } else {
        // WARNING
        await apiClient.post(`/assessments/${assessmentId}/proctor/warning`, { reason });
      }
    } catch (err) {
      console.error('[Proctor] Log failed', err);
    }
  }, [assessmentId, isLocked]);

  // --- 4. Event Listeners ---
  useEffect(() => {
    if (!isProctoringEnabled || isLocked) return;

    // Full Screen Exit Detection
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        logViolation('Exited Full Screen Mode');
      }
    };

    // Tab Switching (Visibility)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('Tab Switched / Minimized');
      }
    };

    // Window Blur (Alt-Tab, Overlay)
    const handleBlur = () => {
      // Only log if not already handling visibility change (minimize triggers both sometimes)
      if (!document.hidden) { 
        logViolation('Window Focus Lost (Alt-Tab/Overlay)');
      }
    };

    // Copy/Cut/Paste/RightClick
    const preventDefault = (e) => {
      e.preventDefault();
      // Only log sometimes to avoid spamming if user holds key
      // For now, just block silently or log critical ones
    };

    const handleCopyPaste = (e) => {
        e.preventDefault();
        logViolation('Attempted Copy/Paste');
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [isProctoringEnabled, isLocked, logViolation]);

  return {
    isChrome,
    isFullScreen,
    enterFullScreen,
    warnings,
    isLocked,
    lockReason,
    checkProctorStatus
  };
}
