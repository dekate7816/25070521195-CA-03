import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';

const PRESET_COLORS = [
  '#2563eb', // blue
  '#059669', // green
  '#7c3aed', // purple
  '#ea580c', // orange
  '#db2777', // pink
  '#0891b2', // cyan
  '#4f46e5', // indigo
  '#eab308', // yellow
];

export function CategoryModal({ isOpen, onClose, onSave, category = null }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setColor(category.color || '#2563eb');
    } else {
      setName('');
      setColor('#2563eb');
    }
    setError('');
  }, [category, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({ name: name.trim(), color });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="category-name">
            Category Name *
          </label>
          <input
            id="category-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Deep Work, Wellness"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: c,
                  border: color === c ? '3px solid var(--text-primary)' : 'none',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast)',
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CategoryDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  category,
  otherCategories = [],
  taskCount = 0,
  habitCount = 0,
}) {
  const [reassignTo, setReassignTo] = useState('none');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !category) return null;

  const totalReferenced = taskCount + habitCount;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(reassignTo);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category" maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
          Are you sure you want to delete the category <strong>{category.name}</strong>?
        </p>

        {totalReferenced > 0 ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-warning-subtle)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: '#92400e',
            }}
          >
            <strong>Note:</strong> This category is currently assigned to{' '}
            <strong>{taskCount}</strong> task(s) and <strong>{habitCount}</strong> habit(s).
            Please choose how to handle these records:
            <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
              <select
                className="form-select"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
              >
                <option value="none">Remove category (leave unassigned)</option>
                {otherCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    Reassign to: {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            No tasks or habits currently use this category. It will be removed immediately.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
