import React from 'react';

export function EmptyState({ icon = '📋', title, description, actionText, onAction }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-surface)',
        border: '1px dashed var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          fontSize: '36px',
          marginBottom: '16px',
          padding: '16px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-muted)',
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{title}</h3>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          maxWidth: '380px',
          lineHeight: 1.5,
          marginBottom: actionText ? '20px' : 0,
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
