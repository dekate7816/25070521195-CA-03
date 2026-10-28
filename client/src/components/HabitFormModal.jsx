import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';

const DAYS = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
];

export function HabitFormModal({ isOpen, onClose, onSave, habit = null, categories = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('daily');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // default Mon-Fri
  const [categoryId, setCategoryId] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habit) {
      setName(habit.name || '');
      setDescription(habit.description || '');
      setScheduleType(habit.schedule?.type || 'daily');
      setSelectedDays(habit.schedule?.days || [1, 2, 3, 4, 5]);
      setCategoryId(habit.categoryId || '');
      setReminderTime(habit.reminderTime || '');
    } else {
      setName('');
      setDescription('');
      setScheduleType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setCategoryId('');
      setReminderTime('');
    }
    setError('');
  }, [habit, isOpen]);

  const toggleDay = (dayVal) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal].sort()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    if (scheduleType === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day for weekly habit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const schedule =
        scheduleType === 'daily'
          ? { type: 'daily' }
          : { type: 'weekly', days: selectedDays };

      await onSave({
        name: name.trim(),
        description: description.trim(),
        schedule,
        categoryId: categoryId || null,
        reminderTime: reminderTime || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? 'Edit Habit' : 'Create New Habit'}
      maxWidth="520px"
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
          <label className="form-label" htmlFor="habit-name">
            Habit Name *
          </label>
          <input
            id="habit-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Meditation"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="habit-description">
            Description
          </label>
          <textarea
            id="habit-description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why is this habit important? Any specific cues or routines?"
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Frequency</label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="scheduleType"
                value="daily"
                checked={scheduleType === 'daily'}
                onChange={() => setScheduleType('daily')}
              />
              Every Day
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="scheduleType"
                value="weekly"
                checked={scheduleType === 'weekly'}
                onChange={() => setScheduleType('weekly')}
              />
              Specific Days of Week
            </label>
          </div>

          {scheduleType === 'weekly' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {DAYS.map((d) => {
                const active = selectedDays.includes(d.val);
                return (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => toggleDay(d.val)}
                    style={{
                      width: '42px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      backgroundColor: active ? 'var(--brand-indigo)' : 'var(--bg-surface)',
                      color: active ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="habit-category">
              Category
            </label>
            <select
              id="habit-category"
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-reminder">
              Preferred Reminder Time
            </label>
            <input
              id="habit-reminder"
              type="time"
              className="form-input"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
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
            {loading ? 'Saving...' : habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
