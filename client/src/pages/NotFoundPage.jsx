import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          fontSize: '72px',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--brand-indigo)',
          lineHeight: 1,
          marginBottom: '16px',
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        Loop Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px', lineHeight: 1.6 }}>
        The page you are looking for doesn't exist, has been moved, or you may need to sign in to access it.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
}
