import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="content-container" style={{ maxWidth: '800px', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
        Last updated: October 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>1. Data Scoping & Privacy</h2>
          <p>
            Looply operates under a strict privacy-by-design architecture. Your tasks, daily routines, habit check-in history, and category names are strictly scoped to your authenticated account ID. We do not sell, track, or share your productivity data.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>2. Data Stored</h2>
          <p>
            When you register, we store your email address, a cryptographic hash of your password (or your Google user ID if using OAuth), your display name, and your preferred timezone. When you manage productivity data, we store your tasks, habits, and check-in timestamps.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>3. Cookies & Session Management</h2>
          <p>
            Looply uses an HttpOnly, SameSite=Lax cookie strictly for maintaining your authenticated session. We do not use third-party tracking or advertising cookies.
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
