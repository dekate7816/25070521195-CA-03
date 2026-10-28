import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { TaskRow } from '../components/TaskRow.jsx';
import { TaskFormModal } from '../components/TaskFormModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

const STATUS_TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
];

export function TasksPage() {
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, task: null });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        priority: priorityFilter,
        categoryId: categoryFilter,
        sortBy,
        sortOrder,
      };

      if (statusFilter === 'overdue') {
        params.overdue = 'true';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const [taskRes, catRes] = await Promise.all([
        api.getTasks(params),
        api.getCategories(),
      ]);

      setTasks(taskRes.tasks || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      toastError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, priorityFilter, categoryFilter, sortBy, sortOrder, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 200); // Debounce search
    return () => clearTimeout(timer);
  }, [loadTasks]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task._id, { status: newStatus });
      success(newStatus === 'completed' ? 'Task marked as completed' : 'Task reopened');
      await loadTasks();
    } catch (err) {
      toastError(err.message || 'Failed to toggle task');
    }
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await api.updateTask(editingTask._id, taskData);
      success('Task updated');
    } else {
      await api.createTask(taskData);
      success('Task created');
    }
    await loadTasks();
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.task) return;
    try {
      await api.deleteTask(deleteDialog.task._id);
      success('Task deleted successfully');
      setDeleteDialog({ open: false, task: null });
      await loadTasks();
    } catch (err) {
      toastError(err.message || 'Failed to delete task');
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            Organize, prioritize, and check off your everyday work.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
        >
          + New Task
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--brand-indigo)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--brand-indigo)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="form-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [b, o] = e.target.value.split(':');
            setSortBy(b);
            setSortOrder(o);
          }}
        >
          <option value="createdAt:desc">Newest Created</option>
          <option value="createdAt:asc">Oldest Created</option>
          <option value="dueDate:asc">Due Date (Earliest)</option>
          <option value="dueDate:desc">Due Date (Latest)</option>
          <option value="priority:desc">Priority (Highest)</option>
          <option value="title:asc">Title (A-Z)</option>
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <SkeletonLoader rows={5} height="52px" />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No tasks found"
          description={
            searchQuery || priorityFilter || categoryFilter || statusFilter !== 'all'
              ? 'No tasks matched your current filter criteria. Try resetting filters or search terms.'
              : 'You have not created any tasks yet. Stay organized by adding your first task.'
          }
          actionText="+ Create Task"
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
              onToggleStatus={handleToggleStatus}
              onEdit={(t) => {
                setEditingTask(t);
                setTaskModalOpen(true);
              }}
              onDelete={(t) => setDeleteDialog({ open: true, task: t })}
            />
          ))}
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
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, task: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteDialog.task?.title}"?`}
      />
    </div>
  );
}
