import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 24px 60px',
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--brand-indigo-subtle)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--brand-indigo)',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          <span>✨</span> Thoughtful Productivity for Intentional Living
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            maxWidth: '800px',
          }}
        >
          Close the loop on what matters most.
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: '620px',
          }}
        >
          Looply connects day-to-day task execution with repeatable habit routines and honest momentum insights.
          No financial noise, no fake metrics—just genuine follow-through.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          {isAuthenticated ? (
            <Link to="/app/dashboard" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '16px' }}>
              Go to Your Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '16px' }}>
                Start Free with Looply
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '16px' }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* The 3-Step Loop Section */}
      <section style={{ backgroundColor: 'var(--bg-surface)', padding: '64px 24px', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              The Looply Execution Cycle
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Designed to help you plan with clarity, execute with focus, and reflect on real consistency.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="card">
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>🎯</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Plan Your Day</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                View tasks due today alongside scheduled daily routines. Filter out the noise and prioritize high-impact items.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>⚡</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Act & Check-In</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                One-click idempotent completion. Build streaks with schedule-aware frequency—weekdays-only habits never break on weekends!
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>📊</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Honest Insights</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Track completion rate trends, best streaks, and category distribution computed strictly from your actual historical logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ padding: '64px 24px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 4px' }}>Account Privacy & Security</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Strict owner scoping, scrypt salted password hashing, SHA-256 session tokens stored at rest, and CSRF protection.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '24px' }}>🗓️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 4px' }}>Smart Schedule Math</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Custom weekly targets, localized date models preventing off-by-one errors, and streak calculations that respect your schedule.
            </p>
          </div>

          <div>
            <span style={{ fontSize: '24px' }}>🏷️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 4px' }}>Safe Category Hierarchy</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
              Reassign categories on deletion so tasks and habits never become orphaned in the database.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div>© {new Date().getFullYear()} Looply. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms of Service</Link>
            <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
