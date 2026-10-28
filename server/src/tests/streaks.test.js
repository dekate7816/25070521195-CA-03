import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHabitStreak,
  isDayScheduled,
  addDays,
  getDayOfWeek,
} from '../utils/streaks.js';

describe('Streak Engine Tests', () => {
  it('correctly calculates daily habit streak with consecutive days', () => {
    const habit = {
      schedule: { type: 'daily' },
      startDate: '2026-10-01',
    };
    const referenceDate = '2026-10-10';
    const completions = [
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    assert.equal(result.currentStreak, 4);
    assert.equal(result.bestStreak, 4);
    assert.equal(result.totalCompletions, 4);
    assert.equal(result.completedToday, true);
  });

  it('preserves streak when today is scheduled but not yet completed (in progress)', () => {
    const habit = {
      schedule: { type: 'daily' },
      startDate: '2026-10-01',
    };
    const referenceDate = '2026-10-10';
    // Completed up to yesterday (2026-10-09)
    const completions = [
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
    ];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    assert.equal(result.currentStreak, 3);
    assert.equal(result.completedToday, false);
    assert.equal(result.isScheduledToday, true);
  });

  it('resets current streak when a previous scheduled day was missed', () => {
    const habit = {
      schedule: { type: 'daily' },
      startDate: '2026-10-01',
    };
    const referenceDate = '2026-10-10';
    // Missed 2026-10-09, today not completed
    const completions = [
      '2026-10-07',
      '2026-10-08',
    ];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    assert.equal(result.currentStreak, 0);
    assert.equal(result.bestStreak, 2);
  });

  it('does NOT break streak on non-scheduled days (weekdays only schedule)', () => {
    // 2026-10-09 is Friday (DOW 5), 2026-10-10 is Saturday (DOW 6), 2026-10-11 is Sunday (DOW 0), 2026-10-12 is Monday (DOW 1)
    const habit = {
      schedule: { type: 'weekly', days: [1, 2, 3, 4, 5] }, // Mon - Fri
      startDate: '2026-10-01',
    };

    // Reference date is Monday 2026-10-12
    const referenceDate = '2026-10-12';
    // Completed Thursday (10-08), Friday (10-09), and Monday (10-12).
    // Weekend (10-10, 10-11) was NOT scheduled.
    const completions = [
      '2026-10-08',
      '2026-10-09',
      '2026-10-12',
    ];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    // Streak across weekend must remain unbroken: 3 scheduled days completed
    assert.equal(result.currentStreak, 3);
    assert.equal(result.bestStreak, 3);
  });

  it('evaluates best streak across disjoint completion intervals', () => {
    const habit = {
      schedule: { type: 'daily' },
      startDate: '2026-09-01',
    };
    const referenceDate = '2026-09-30';
    // Streak 1: 5 days (Sept 1-5)
    // Gap: Sept 6 missed
    // Streak 2: 2 days (Sept 29-30)
    const completions = [
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-29',
      '2026-09-30',
    ];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    assert.equal(result.currentStreak, 2);
    assert.equal(result.bestStreak, 5);
  });

  it('respects habit startDate boundary', () => {
    const habit = {
      schedule: { type: 'daily' },
      startDate: '2026-10-05',
    };
    const referenceDate = '2026-10-06';
    const completions = ['2026-10-05', '2026-10-06'];

    const result = calculateHabitStreak(habit, completions, referenceDate);
    assert.equal(result.currentStreak, 2);
  });
});
