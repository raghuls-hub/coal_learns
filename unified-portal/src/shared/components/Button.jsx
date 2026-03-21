import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, style = {} }) => {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variants = {
    primary: {
      background: 'var(--accent-gradient)',
      color: 'white',
      boxShadow: 'var(--accent-glow)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-dim)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--error)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    }
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
    >
      {children}
    </button>
  );
};

export default Button;
