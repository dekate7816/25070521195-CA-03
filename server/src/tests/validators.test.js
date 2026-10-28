import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateTaskInput,
  validateHabitInput,
  validateCategoryInput,
} from '../utils/validators.js';

describe('Validators & Sanitization Tests', () => {
  it('normalizes email addresses correctly', () => {
    assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com');
    assert.equal(normalizeEmail('alex.turner+looply@domain.co.uk'), 'alex.turner+looply@domain.co.uk');
  });

  it('validates email format', () => {
    assert.equal(validateEmail('test@looply.app'), true);
    assert.equal(validateEmail('user.name@sub.domain.org'), true);
    assert.equal(validateEmail('invalid-email'), false);
    assert.equal(validateEmail('user@'), false);
    assert.equal(validateEmail('@domain.com'), false);
    assert.equal(validateEmail(''), false);
  });

  it('validates password requirements', () => {
    assert.equal(validatePassword('12345678'), true);
    assert.equal(validatePassword('Short1!'), false); // < 8
    assert.equal(validatePassword('a'.repeat(129)), false); // > 128
    assert.equal(validatePassword(null), false);
  });

  it('validates task creation and update rules', () => {
    // Valid task
    const valid = validateTaskInput({
      title: 'Design database schema',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-11-01T12:00:00.000Z',
      tags: ['db', 'mongo'],
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.data.title, 'Design database schema');
    assert.equal(valid.data.priority, 'high');

    // Missing title on creation
    const missingTitle = validateTaskInput({ description: 'No title' });
    assert.equal(missingTitle.isValid, false);
    assert.ok(missingTitle.errors.some(e => e.includes('Title is required')));

    // Invalid status enum
    const badStatus = validateTaskInput({ title: 'Task', status: 'invalid_status' });
    assert.equal(badStatus.isValid, false);
  });

  it('validates habit schedules (daily and weekly)', () => {
    // Daily schedule
    const dailyHabit = validateHabitInput({
      name: 'Drink 2L water',
      schedule: { type: 'daily' },
      reminderTime: '08:00',
    });
    assert.equal(dailyHabit.isValid, true);
    assert.equal(dailyHabit.data.schedule.type, 'daily');

    // Weekly schedule with valid days
    const weeklyHabit = validateHabitInput({
      name: 'Go to gym',
      schedule: { type: 'weekly', days: [1, 3, 5] },
    });
    assert.equal(weeklyHabit.isValid, true);
    assert.deepEqual(weeklyHabit.data.schedule.days, [1, 3, 5]);

    // Invalid weekly schedule with empty days
    const invalidWeekly = validateHabitInput({
      name: 'Read book',
      schedule: { type: 'weekly', days: [] },
    });
    assert.equal(invalidWeekly.isValid, false);
  });

  it('validates category input', () => {
    const validCat = validateCategoryInput({ name: 'Work', color: '#3b82f6' });
    assert.equal(validCat.isValid, true);
    assert.equal(validCat.data.color, '#3b82f6');

    const emptyCat = validateCategoryInput({ name: '   ' });
    assert.equal(emptyCat.isValid, false);
  });
});
