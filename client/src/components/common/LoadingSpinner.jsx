import React from 'react';

export const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '14px',
      }}
    >
      <div className="loading-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{text}</span>
    </div>
  );
};
