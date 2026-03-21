import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, disabled = false, error = '', style = {} }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', ...style }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          padding: '0.8rem 1rem',
          background: 'var(--bg-base)',
          border: error ? '1px solid var(--error)' : '1px solid var(--border-dim)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '15px',
          outline: 'none',
          transition: 'border-color 0.2s',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {error && <small style={{ color: 'var(--error)', fontSize: '12px' }}>{error}</small>}
    </div>
  );
};

export default Input;
