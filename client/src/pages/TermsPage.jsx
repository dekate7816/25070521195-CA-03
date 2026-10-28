import React from 'react';
import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="content-container" style={{ maxWidth: '800px', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
        Last updated: October 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>1. Purpose of Looply</h2>
          <p>
            Looply is a personal productivity platform designed for managing individual task workflows, recurring routines, and habit streaks. By creating an account or accessing the service, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>2. Account Security & Ownership</h2>
          <p>
            You are responsible for safeguarding your login credentials. Looply encrypts passwords with cryptographic scrypt hashing and protects active sessions with hashed tokens. All tasks, habits, check-in records, and categories created in your account remain strictly scoped to your profile.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>3. Acceptable Use</h2>
          <p>
            You agree not to misuse Looply’s APIs, attempt unauthorized access to other accounts, bypass rate limiters, or inject malicious payloads.
          </p>
        </section>

        <div style={{ marginTop: '24px' }}>
          <Link to="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
