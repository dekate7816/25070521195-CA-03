import React from 'react';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function HabitCard({
  habit,
  categories = [],
  onToggleDate,
  onEdit,
  onDelete,
}) {
  const category = categories.find((c) => c._id === habit.categoryId) || habit.category;

  // Generate last 7 days (including today)
  const today = new Date();
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const dayLabel = DAY_NAMES[dayOfWeek];

    // Check if scheduled
    let isScheduled = true;
    if (habit.schedule?.type === 'weekly' && Array.isArray(habit.schedule?.days)) {
      isScheduled = habit.schedule.days.includes(dayOfWeek);
    }
    const isCompleted = (habit.recentDates || []).includes(dateStr) || (habit.completions || []).includes(dateStr);

    past7Days.push({
      dateStr,
      dayLabel,
      isScheduled,
      isCompleted,
      isToday: i === 0,
    });
  }

  const scheduleLabel =
    habit.schedule?.type === 'daily'
      ? 'Daily'
      : habit.schedule?.days?.length === 5 &&
        habit.schedule.days.every((d) => [1, 2, 3, 4, 5].includes(d))
      ? 'Weekdays'
      : `Weekly (${habit.schedule?.days?.map((d) => DAY_NAMES[d]).join(', ') || 'Custom'})`;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{habit.name}</h3>
            {category && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: category.color || '#4f46e5',
                  }}
                />
                {category.name}
              </span>
            )}
          </div>
          {habit.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {habit.description}
            </p>
          )}
        </div>

        {/* Streak Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span className="badge badge-streak" title="Current streak">
            🔥 {habit.currentStreak || 0}d
          </span>
          <span
            className="badge"
            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            title="Best streak"
          >
            Best: {habit.bestStreak || 0}d
          </span>
        </div>
      </div>

      {/* Schedule Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <span>Schedule: <strong>{scheduleLabel}</strong></span>
        {habit.reminderTime && <span>Reminder: {habit.reminderTime}</span>}
      </div>

      {/* 7-Day Interactive Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {past7Days.map((day) => (
          <div
            key={day.dateStr}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: day.isToday ? 700 : 500,
                color: day.isToday ? 'var(--brand-indigo)' : 'var(--text-muted)',
              }}
            >
              {day.dayLabel}
            </span>
            <button
              type="button"
              onClick={() => onToggleDate(habit, day.dateStr, day.isCompleted)}
              disabled={!day.isScheduled}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: day.isCompleted
                  ? 'none'
                  : day.isScheduled
                  ? '2px solid var(--border-light)'
                  : '1px dashed var(--border-light)',
                backgroundColor: day.isCompleted
                  ? 'var(--accent-mint)'
                  : day.isScheduled
                  ? 'var(--bg-surface)'
                  : 'transparent',
                color: day.isCompleted ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: day.isScheduled ? 'pointer' : 'default',
                opacity: day.isScheduled ? 1 : 0.4,
                transition: 'all var(--transition-fast)',
              }}
              title={`${day.dateStr}${
                !day.isScheduled
                  ? ' (Not scheduled)'
                  : day.isCompleted
                  ? ' (Completed - click to undo)'
                  : ' (Click to check in)'
              }`}
            >
              {day.isCompleted ? '✓' : day.isScheduled ? '·' : '—'}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Total completions: <strong>{habit.totalCompletions || 0}</strong>
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(habit)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-danger)' }}
            onClick={() => onDelete(habit)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
