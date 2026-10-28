import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
];

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ name: name.trim(), timezone });
      await refreshUser();
      success('Profile preferences updated successfully');
    } catch (err) {
      toastError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const createdFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="content-container" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Profile & Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
          Manage your account details and local preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Card */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
            Account Information
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-muted)', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Email addresses cannot be changed directly for security reasons.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-timezone">
                Local Timezone
              </label>
              <select
                id="profile-timezone"
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Ensures streak resets and date schedules align with your calendar day.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* Feature Limitations & Notification Delivery Notice */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            Reminders & Delivery Mechanism
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Looply stores your preferred reminder times as local configuration preferences.
            Push notifications and email delivery integrations are not currently enabled in this deployment.
          </p>
        </div>

        {/* Security Summary */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            Security & Authentication
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>• <strong>Authentication Provider:</strong> {user?.authProvider || 'Local Email/Password'}</div>
            <div>• <strong>Member Since:</strong> {createdFormatted}</div>
            <div>• <strong>Password Protection:</strong> Salted scrypt key derivation (N=16384, r=8, p=1).</div>
            <div>• <strong>Session Storage:</strong> SHA-256 hashed at rest in MongoDB with HttpOnly cookie.</div>
            <div>• <strong>CSRF Protection:</strong> Enforced on all state-changing endpoints.</div>
          </div>
        </div>

        {/* Danger Zone / Logout */}
        <div className="card" style={{ borderColor: 'var(--border-light)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Sign Out
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            End your current session on this device.
          </p>
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Log Out of Looply
          </button>
        </div>
      </div>
    </div>
  );
}
