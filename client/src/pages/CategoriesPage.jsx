import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CategoryModal, CategoryDeleteModal } from '../components/CategoryModal.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { SkeletonLoader } from '../components/SkeletonLoader.jsx';

export function CategoriesPage() {
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({
    open: false,
    category: null,
    taskCount: 0,
    habitCount: 0,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      toastError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSaveCategory = async (catData) => {
    if (editingCategory) {
      await api.updateCategory(editingCategory._id, catData);
      success('Category updated successfully');
    } else {
      await api.createCategory(catData);
      success('Category created successfully');
    }
    await loadCategories();
  };

  const handleInitiateDelete = (cat) => {
    setDeleteModalState({
      open: true,
      category: cat,
      taskCount: cat.taskCount || 0,
      habitCount: cat.habitCount || 0,
    });
  };

  const handleConfirmDelete = async (reassignTo) => {
    if (!deleteModalState.category) return;
    try {
      await api.deleteCategory(deleteModalState.category._id, reassignTo);
      success('Category removed successfully');
      setDeleteModalState({ open: false, category: null, taskCount: 0, habitCount: 0 });
      await loadCategories();
    } catch (err) {
      toastError(err.message || 'Failed to delete category');
    }
  };

  const otherCategories = deleteModalState.category
    ? categories.filter((c) => c._id !== deleteModalState.category._id)
    : [];

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
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Categories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            Group your tasks and habits by project, life area, or focus theme.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
        >
          + New Category
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={3} height="100px" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No categories found"
          description="Categories help keep your focus organized across work, wellness, and personal projects."
          actionText="+ Add Your First Category"
          onAction={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: cat.color || '#4f46e5',
                    flexShrink: 0,
                  }}
                />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{cat.name}</h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                }}
              >
                <span>
                  <strong>{cat.taskCount || 0}</strong> tasks · <strong>{cat.habitCount || 0}</strong> habits
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingCategory(cat);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleInitiateDelete(cat)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <CategoryDeleteModal
        isOpen={deleteModalState.open}
        onClose={() => setDeleteModalState({ open: false, category: null, taskCount: 0, habitCount: 0 })}
        onConfirm={handleConfirmDelete}
        category={deleteModalState.category}
        otherCategories={otherCategories}
        taskCount={deleteModalState.taskCount}
        habitCount={deleteModalState.habitCount}
      />
    </div>
  );
}
