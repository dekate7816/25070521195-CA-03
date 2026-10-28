import React from 'react';

export function TaskRow({ task, categories = [], onToggleStatus, onEdit, onDelete }) {
  const isCompleted = task.status === 'completed';
  const category = categories.find((c) => c._id === task.categoryId) || task.category;

  // Check overdue
  const nowIso = new Date().toISOString();
  const isOverdue = !isCompleted && task.dueDate && task.dueDate < nowIso;

  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        onClick={() => onToggleStatus(task)}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          border: isCompleted ? 'none' : '2px solid var(--border-light)',
          backgroundColor: isCompleted ? 'var(--accent-mint)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all var(--transition-fast)',
        }}
        aria-label={isCompleted ? 'Mark task as todo' : 'Mark task as completed'}
      >
        {isCompleted && '✓'}
      </button>

      {/* Title & Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </span>

          {/* Priority Badge */}
          {task.priority && (
            <span className={`badge badge-${task.priority}`} style={{ textTransform: 'capitalize' }}>
              {task.priority}
            </span>
          )}

          {/* Category Pill */}
          {category && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
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

        {task.description && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Due date tag */}
      {task.dueDate && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          {isOverdue && '⚠️ '}
          {formatDue(task.dueDate)}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          title="Edit task"
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
          title="Delete task"
          style={{ color: 'var(--color-danger)' }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
