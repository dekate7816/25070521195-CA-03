import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/app/dashboard', label: 'Today', icon: '☀️' },
  { path: '/app/tasks', label: 'Tasks', icon: '✓' },
  { path: '/app/habits', label: 'Habits', icon: '🔥' },
  { path: '/app/planner', label: 'Planner', icon: '📅' },
  { path: '/app/insights', label: 'Insights', icon: '📈' },
  { path: '/app/categories', label: 'Categories', icon: '🏷️' },
  { path: '/app/profile', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ onNewTask, onNewHabit }) {
  return (
    <aside className="app-sidebar">
      {/* Quick Action Buttons */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onNewTask}
        >
          + New Task
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onNewHabit}
        >
          + New Habit
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '0 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--brand-indigo)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--brand-indigo-subtle)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            })}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom info */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-light)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Looply Personal Productivity
      </div>
    </aside>
  );
}
