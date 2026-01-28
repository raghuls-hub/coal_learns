import { useState, useEffect, useRef } from 'react';

export default function AssessmentTimer({ durationMinutes, onTimeUp }) {
    // Convert minutes to seconds
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const hasEndedRef = useRef(false);

    useEffect(() => {
        if (!durationMinutes || durationMinutes <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!hasEndedRef.current) {
                        hasEndedRef.current = true;
                        onTimeUp();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [durationMinutes, onTimeUp]);

    if (!durationMinutes || durationMinutes <= 0) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Urgency colors
    const getBackgroundColor = () => {
        if (timeLeft < 60) return '#fed7d7'; // Red (Last minute)
        if (timeLeft < 300) return '#feebc8'; // Orange (Last 5 mins)
        return '#f0fff4'; // Green
    };

    const getTextColor = () => {
        if (timeLeft < 60) return '#c53030';
        if (timeLeft < 300) return '#c05621';
        return '#276749';
    };

    return (
        <div style={{
            ...styles.container, 
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            borderColor: getTextColor()
        }}>
            <span style={styles.icon}>⏱️</span>
            <span style={styles.time}>{formatTime(timeLeft)}</span>
            <span style={styles.label}>Time Remaining</span>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.5rem 1.5rem',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: 10000,
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderWidth: '1px',
        borderStyle: 'solid',
        transition: 'all 0.3s ease'
    },
    icon: {
        fontSize: '18px'
    },
    time: {
        fontSize: '20px',
        fontFamily: 'monospace'
    },
    label: {
        fontSize: '12px',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: '1px'
    }
};
