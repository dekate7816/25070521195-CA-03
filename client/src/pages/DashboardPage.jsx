import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import { TaskRow } from '../components/TaskRow.jsx';
import { HabitCard } from '../components/HabitCard.jsx';
import { TaskFormModal } from '../components/TaskFormModal.jsx';
import { HabitFormModal } from '../components/HabitFormModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Delete dialogs
  const [deleteTaskDialog, setDeleteTaskDialog] = useState({ open: false, task: null });
  const [deleteHabitDialog, setDeleteHabitDialog] = useState({ open: false, habit: null });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashData, catData] = await Promise.all([
        api.getDashboardSummary(),
        api.getCategories(),
      ]);
      setData(dashData);
      setCategories(catData.categories || []);
    } catch (err) {
      toastError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Task actions
  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task._id, { status: newStatus });
      await loadDashboard();
      success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toastError(err.message || 'Failed to update task');
    }
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await api.updateTask(editingTask._id, taskData);
      success('Task updated successfully');
    } else {
      await api.createTask(taskData);
      success('Task created successfully');
    }
    await loadDashboard();
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteTaskDialog.task) return;
    try {
      await api.deleteTask(deleteTaskDialog.task._id);
      success('Task deleted');
      setDeleteTaskDialog({ open: false, task: null });
      await loadDashboard();
    } catch (err) {
      toastError(err.message || 'Failed to delete task');
    }
  };

  // Habit actions
  const handleToggleHabitDate = async (habit, dateStr, isCompleted) => {
    try {
      if (isCompleted) {
        await api.removeHabitCompletion(habit._id, dateStr);
        success('Check-in removed');
      } else {
        await api.recordHabitCompletion(habit._id, dateStr);
        success('Habit checked in!');
      }
      await loadDashboard();
    } catch (err) {
      toastError(err.message || 'Failed to update habit check-in');
    }
  };

  const handleSaveHabit = async (habitData) => {
    if (editingHabit) {
      await api.updateHabit(editingHabit._id, habitData);
      success('Habit updated successfully');
    } else {
      await api.createHabit(habitData);
      success('Habit created successfully');
    }
    await loadDashboard();
  };

  const handleConfirmDeleteHabit = async () => {
    if (!deleteHabitDialog.habit) return;
    try {
      await api.deleteHabit(deleteHabitDialog.habit._id);
      success('Habit deleted');
      setDeleteHabitDialog({ open: false, habit: null });
      await loadDashboard();
    } catch (err) {
      toastError(err.message || 'Failed to delete habit');
    }
  };

  // Determine greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading && !data) {
    return (
      <div className="content-container">
        <SkeletonLoader rows={4} height="60px" style={{ marginBottom: '24px' }} />
        <SkeletonLoader rows={3} height="80px" />
      </div>
    );
  }

  const summary = data?.summary || {
    dailyProgressPercent: 0,
    scheduledHabitsToday: 0,
    completedHabitsToday: 0,
    overdueTasksCount: 0,
  };

  const todayTasks = data?.todayTasks || [];
  const todayHabits = data?.todayHabits || [];

  return (
    <div className="content-container">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>
            {greeting}, {user?.name || 'Friend'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            {todayFormatted} — Here is your focus for today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
          >
            + Add Task
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditingHabit(null);
              setHabitModalOpen(true);
            }}
          >
            + Add Habit
          </button>
        </div>
      </div>

      {/* Progress & Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Daily Completion Rate */}
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            TODAY'S MOMENTUM
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 6px', color: 'var(--accent-mint-dark)' }}>
            {summary.dailyProgressPercent}%
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${summary.dailyProgressPercent}%` }} />
          </div>
        </div>

        {/* Habits Scheduled */}
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            HABITS TODAY
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 6px' }}>
            {summary.completedHabitsToday} / {summary.scheduledHabitsToday}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {summary.scheduledHabitsToday === 0
              ? 'No habits scheduled for today'
              : summary.completedHabitsToday === summary.scheduledHabitsToday
              ? '✨ All scheduled habits checked in!'
              : `${summary.scheduledHabitsToday - summary.completedHabitsToday} habit(s) remaining`}
          </div>
        </div>

        {/* Tasks Due Today */}
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            TODAY'S TASKS
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 6px' }}>
            {todayTasks.filter((t) => t.status === 'completed').length} / {todayTasks.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {todayTasks.length === 0 ? 'Clear agenda today' : 'Focus tasks scheduled for today'}
          </div>
        </div>

        {/* Overdue alert card if any */}
        {summary.overdueTasksCount > 0 && (
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-danger-subtle)',
              borderColor: 'var(--color-danger)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-danger)' }}>
              OVERDUE TASKS
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 6px', color: 'var(--color-danger)' }}>
              {summary.overdueTasksCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
              Require your immediate attention
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout: Tasks & Habits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* Today's Tasks Section */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              Today's Tasks ({todayTasks.length})
            </h2>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState
              icon="✓"
              title="No tasks scheduled for today"
              description="Your today view is clear. Add tasks due today to keep your daily momentum going."
              actionText="+ Add Today's First Task"
              onAction={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.map((task) => (
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

        {/* Today's Habits Section */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              Habits & Routines ({todayHabits.length})
            </h2>
          </div>

          {todayHabits.length === 0 ? (
            <EmptyState
              icon="🔥"
              title="No habits created yet"
              description="Habits are the foundation of consistency. Start tracking a daily reading, exercise, or focus routine."
              actionText="+ Create Your First Habit"
              onAction={() => {
                setEditingHabit(null);
                setHabitModalOpen(true);
              }}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {todayHabits.map((habit) => (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  categories={categories}
                  onToggleDate={handleToggleHabitDate}
                  onEdit={(h) => {
                    setEditingHabit(h);
                    setHabitModalOpen(true);
                  }}
                  onDelete={(h) => setDeleteHabitDialog({ open: true, habit: h })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        categories={categories}
      />

      <HabitFormModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSave={handleSaveHabit}
        habit={editingHabit}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={deleteTaskDialog.open}
        onClose={() => setDeleteTaskDialog({ open: false, task: null })}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTaskDialog.task?.title}"?`}
      />

      <ConfirmDialog
        isOpen={deleteHabitDialog.open}
        onClose={() => setDeleteHabitDialog({ open: false, habit: null })}
        onConfirm={handleConfirmDeleteHabit}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deleteHabitDialog.habit?.name}" and all of its check-in records?`}
      />
    </div>
  );
}
