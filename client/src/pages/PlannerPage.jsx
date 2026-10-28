import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { TaskRow } from '../components/TaskRow.jsx';
import { TaskFormModal } from '../components/TaskFormModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

export function PlannerPage() {
  const { success, error: toastError } = useToast();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskDialog, setDeleteTaskDialog] = useState({ open: false, task: null });

  const loadPlannerData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskRes, habitRes, catRes] = await Promise.all([
        api.getTasks({ date: selectedDate }),
        api.getHabits(),
        api.getCategories(),
      ]);

      setTasks(taskRes.tasks || []);
      setCategories(catRes.categories || []);

      // Filter habits scheduled for selectedDate
      const dayOfWeek = new Date(`${selectedDate}T12:00:00Z`).getUTCDay();
      const scheduledHabits = (habitRes.habits || []).filter((h) => {
        if (h.status === 'archived') return false;
        if (h.startDate && selectedDate < h.startDate) return false;
        if (h.endDate && selectedDate > h.endDate) return false;
        if (h.schedule?.type === 'daily') return true;
        if (h.schedule?.type === 'weekly' && Array.isArray(h.schedule?.days)) {
          return h.schedule.days.includes(dayOfWeek);
        }
        return true;
      });

      setHabits(scheduledHabits);
    } catch (err) {
      toastError(err.message || 'Failed to load planner data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, toastError]);

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  const changeDateByDays = (delta) => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task._id, { status: newStatus });
      success(newStatus === 'completed' ? 'Task marked completed' : 'Task reopened');
      await loadPlannerData();
    } catch (err) {
      toastError(err.message || 'Failed to update task');
    }
  };

  const handleToggleHabitCheckIn = async (habit) => {
    const isCompleted = (habit.recentDates || []).includes(selectedDate) || (habit.completions || []).includes(selectedDate);
    try {
      if (isCompleted) {
        await api.removeHabitCompletion(habit._id, selectedDate);
        success('Check-in undone');
      } else {
        await api.recordHabitCompletion(habit._id, selectedDate);
        success('Habit checked in!');
      }
      await loadPlannerData();
    } catch (err) {
      toastError(err.message || 'Failed to update check-in');
    }
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await api.updateTask(editingTask._id, taskData);
      success('Task updated');
    } else {
      await api.createTask({
        ...taskData,
        dueDate: `${selectedDate}T12:00:00.000Z`,
      });
      success('Task created for this date');
    }
    await loadPlannerData();
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteTaskDialog.task) return;
    try {
      await api.deleteTask(deleteTaskDialog.task._id);
      success('Task deleted');
      setDeleteTaskDialog({ open: false, task: null });
      await loadPlannerData();
    } catch (err) {
      toastError(err.message || 'Failed to delete task');
    }
  };

  const dateHeading = new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="content-container">
      {/* Header with Date Navigator */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Planner</h1>
            {isToday && (
              <span className="badge badge-completed" style={{ fontSize: '11px' }}>
                Today
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            {dateHeading}
          </p>
        </div>

        {/* Date Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => changeDateByDays(-1)}
            title="Previous Day"
          >
            ← Prev
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => changeDateByDays(1)}
            title="Next Day"
          >
            Next →
          </button>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Honest Note */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>💡</span>
        <span>
          Planner items are mapped directly from your stored task due dates and habit schedules.
          No third-party calendar provider connected.
        </span>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} height="60px" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Scheduled Tasks for Date */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                Tasks Due on This Date ({tasks.length})
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
              >
                + Add Task for Date
              </button>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No tasks due on this date"
                description={`You have no deadlines scheduled for ${dateHeading}.`}
                actionText="+ Schedule Task"
                onAction={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    categories={categories}
                    onToggleStatus={handleToggleTask}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setTaskModalOpen(true);
                    }}
                    onDelete={(t) => setDeleteTaskDialog({ open: true, task: t })}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Scheduled Habits for Date */}
          <section>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                Habits Scheduled for This Day ({habits.length})
              </h2>
            </div>

            {habits.length === 0 ? (
              <EmptyState
                icon="🌿"
                title="No habits scheduled for this day"
                description="None of your active habits are configured to run on this day of the week."
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {habits.map((habit) => {
                  const isChecked = (habit.recentDates || []).includes(selectedDate) || (habit.completions || []).includes(selectedDate);
                  return (
                    <div
                      key={habit._id}
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{habit.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Streak: 🔥 {habit.currentStreak || 0}d
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleHabitCheckIn(habit)}
                        className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          backgroundColor: isChecked ? 'var(--accent-mint)' : undefined,
                          borderColor: isChecked ? 'var(--accent-mint)' : undefined,
                        }}
                      >
                        {isChecked ? '✓ Completed' : 'Check In'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={deleteTaskDialog.open}
        onClose={() => setDeleteTaskDialog({ open: false, task: null })}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTaskDialog.task?.title}"?`}
      />
    </div>
  );
}
