import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { HabitCard } from '../components/HabitCard.jsx';
import { HabitFormModal } from '../components/HabitFormModal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

export function HabitsPage() {
  const { success, error: toastError } = useToast();

  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals state
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, habit: null });

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.categoryId = categoryFilter;

      const [habitRes, catRes] = await Promise.all([
        api.getHabits(params),
        api.getCategories(),
      ]);

      setHabits(habitRes.habits || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      toastError(err.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, toastError]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleToggleDate = async (habit, dateStr, isCompleted) => {
    try {
      if (isCompleted) {
        await api.removeHabitCompletion(habit._id, dateStr);
        success('Check-in removed');
      } else {
        await api.recordHabitCompletion(habit._id, dateStr);
        success('Habit checked in!');
      }
      await loadHabits();
    } catch (err) {
      toastError(err.message || 'Failed to update check-in');
    }
  };

  const handleSaveHabit = async (habitData) => {
    if (editingHabit) {
      await api.updateHabit(editingHabit._id, habitData);
      success('Habit updated');
    } else {
      await api.createHabit(habitData);
      success('Habit created');
    }
    await loadHabits();
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.habit) return;
    try {
      await api.deleteHabit(deleteDialog.habit._id);
      success('Habit and all completion records deleted');
      setDeleteDialog({ open: false, habit: null });
      await loadHabits();
    } catch (err) {
      toastError(err.message || 'Failed to delete habit');
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
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Habits & Routines</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            Build consistency with schedule-aware streak tracking.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingHabit(null);
            setHabitModalOpen(true);
          }}
        >
          + New Habit
        </button>
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '300px' }}>
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
      </div>

      {/* Habit Cards Grid */}
      {loading ? (
        <SkeletonLoader rows={3} height="140px" />
      ) : habits.length === 0 ? (
        <EmptyState
          icon="🔥"
          title="No habits found"
          description={
            categoryFilter
              ? 'No habits match the selected category.'
              : 'You have not added any habits yet. Habits help you build consistent momentum day after day.'
          }
          actionText="+ Create Habit"
          onAction={() => {
            setEditingHabit(null);
            setHabitModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit._id}
              habit={habit}
              categories={categories}
              onToggleDate={handleToggleDate}
              onEdit={(h) => {
                setEditingHabit(h);
                setHabitModalOpen(true);
              }}
              onDelete={(h) => setDeleteDialog({ open: true, habit: h })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <HabitFormModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        onSave={handleSaveHabit}
        habit={editingHabit}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, habit: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deleteDialog.habit?.name}"? All check-in history for this habit will be removed.`}
      />
    </div>
  );
}
