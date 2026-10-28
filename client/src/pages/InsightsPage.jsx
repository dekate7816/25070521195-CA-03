import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

export function InsightsPage() {
  const { error: toastError } = useToast();

  const [taskInsights, setTaskInsights] = useState(null);
  const [habitInsights, setHabitInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      const [tData, hData] = await Promise.all([
        api.getTaskInsights(),
        api.getHabitInsights(),
      ]);
      setTaskInsights(tData);
      setHabitInsights(hData);
    } catch (err) {
      toastError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <div className="content-container">
        <SkeletonLoader rows={4} height="80px" style={{ marginBottom: '24px' }} />
        <SkeletonLoader rows={3} height="120px" />
      </div>
    );
  }

  const hasTasks = taskInsights && taskInsights.totalTasks > 0;
  const hasHabits = habitInsights && habitInsights.activeHabitsCount > 0;

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Insights & Momentum</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
          Historical trends, completion rates, and streak records calculated strictly from your real logs.
        </p>
      </div>

      {!hasTasks && !hasHabits ? (
        <EmptyState
          icon="📈"
          title="No productivity data logged yet"
          description="Insights are dynamically computed from your actual task and habit completion history. Create your first task or habit to begin building momentum trends."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Top High-Level Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                OVERALL TASK COMPLETION
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', color: 'var(--brand-indigo)' }}>
                {taskInsights?.completionRate || 0}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {taskInsights?.byStatus?.completed || 0} of {taskInsights?.totalTasks || 0} tasks finished
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                TOTAL HABIT CHECK-INS
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', color: 'var(--accent-mint-dark)' }}>
                {habitInsights?.totalCompletionsAllTime || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Logged across {habitInsights?.activeHabitsCount || 0} active routine(s)
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                LONGEST STREAK OVERALL
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', color: '#ea580c' }}>
                🔥 {habitInsights?.longestStreakOverall || 0}d
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Highest consecutive scheduled check-ins
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                AVG CURRENT STREAK
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', color: '#16a34a' }}>
                {habitInsights?.averageCurrentStreak || 0}d
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Average active consistency score
              </div>
            </div>
          </div>

          {/* Task Performance Breakdown */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Task Distribution & Status Breakdown
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Status Bars */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  By Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Completed', count: taskInsights?.byStatus?.completed || 0, color: 'var(--accent-mint)' },
                    { label: 'In Progress', count: taskInsights?.byStatus?.in_progress || 0, color: 'var(--brand-indigo)' },
                    { label: 'To Do', count: taskInsights?.byStatus?.todo || 0, color: 'var(--border-light)' },
                  ].map((s) => {
                    const pct = taskInsights?.totalTasks > 0
                      ? Math.round((s.count / taskInsights.totalTasks) * 100)
                      : 0;
                    return (
                      <div key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span>{s.label}</span>
                          <span><strong>{s.count}</strong> ({pct}%)</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Bars */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  By Priority
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'High Priority', count: taskInsights?.byPriority?.high || 0, color: 'var(--priority-high)' },
                    { label: 'Medium Priority', count: taskInsights?.byPriority?.medium || 0, color: 'var(--priority-medium)' },
                    { label: 'Low Priority', count: taskInsights?.byPriority?.low || 0, color: 'var(--priority-low)' },
                  ].map((p) => {
                    const pct = taskInsights?.totalTasks > 0
                      ? Math.round((p.count / taskInsights.totalTasks) * 100)
                      : 0;
                    return (
                      <div key={p.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span>{p.label}</span>
                          <span><strong>{p.count}</strong> ({pct}%)</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 7-Day Task Completion Trend */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              7-Day Task Completion Trend
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Tasks finished each day over the past week.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
                alignItems: 'flex-end',
                height: '140px',
                paddingTop: '20px',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              {(taskInsights?.last7DaysTrend || []).map((day) => {
                const max = Math.max(...(taskInsights?.last7DaysTrend || []).map((d) => d.completedCount), 1);
                const heightPct = Math.round((day.completedCount / max) * 100);
                const shortDate = day.date.slice(5); // MM-DD

                return (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{day.completedCount}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '36px',
                        height: `${Math.max(heightPct, 6)}%`,
                        backgroundColor: day.completedCount > 0 ? 'var(--brand-indigo)' : 'var(--bg-muted)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 300ms ease',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{shortDate}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Habit Streaks Leaderboard */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Habit Streaks Leaderboard
            </h2>

            {(habitInsights?.habitLeaderboard || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No active habits to rank.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(habitInsights?.habitLeaderboard || []).map((h, index) => (
                  <div
                    key={h._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: index === 0 ? '#fef3c7' : 'var(--bg-surface)',
                          color: index === 0 ? '#b45309' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{h.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                      <span className="badge badge-streak">
                        🔥 Current: {h.currentStreak}d
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Best: <strong>{h.bestStreak}d</strong>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Total: <strong>{h.totalCompletions}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
