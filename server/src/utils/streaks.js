/**
 * Habit Streak Calculation Engine
 * 
 * Accurately calculates current and best streaks taking into account:
 * 1. Daily frequency vs custom weekly days (e.g., weekdays only).
 * 2. Non-scheduled days DO NOT break streaks.
 * 3. Today in progress: if today is scheduled but not yet completed,
 *    an active streak from yesterday/previous scheduled day is not broken.
 * 4. Stored check-in dates formatted as YYYY-MM-DD avoid timezone off-by-one errors.
 */

/**
 * Format a Date object to YYYY-MM-DD in UTC or local context
 */
export function formatDateString(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add or subtract days from a YYYY-MM-DD date string
 */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Get day of week for a YYYY-MM-DD date string (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay();
}

/**
 * Check if a specific date is a scheduled day for the habit
 */
export function isDayScheduled(habit, dateStr) {
  if (!habit) return false;
  if (habit.startDate && dateStr < habit.startDate) return false;
  if (habit.endDate && dateStr > habit.endDate) return false;

  const schedule = habit.schedule || { type: 'daily' };
  if (schedule.type === 'daily') {
    return true;
  }
  if (schedule.type === 'weekly' && Array.isArray(schedule.days)) {
    const dow = getDayOfWeek(dateStr);
    return schedule.days.includes(dow);
  }
  return true;
}

/**
 * Calculate streak metrics for a habit given its completion dates
 * 
 * @param {Object} habit - Habit configuration
 * @param {Array<string>} completionDates - List of YYYY-MM-DD date strings
 * @param {string} [referenceDate] - YYYY-MM-DD date to evaluate from (default: today)
 * @returns {Object} { currentStreak, bestStreak, totalCompletions, completedToday, isScheduledToday }
 */
export function calculateHabitStreak(habit, completionDates = [], referenceDate = null) {
  const targetDate = referenceDate || formatDateString(new Date());
  const completionsSet = new Set(
    (completionDates || []).map(d => (typeof d === 'string' ? d.slice(0, 10) : formatDateString(d)))
  );

  const completedToday = completionsSet.has(targetDate);
  const isScheduledToday = isDayScheduled(habit, targetDate);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let cursorDate = targetDate;

  // Determine starting point for current streak check
  if (isScheduledToday) {
    if (completedToday) {
      currentStreak += 1;
      cursorDate = addDays(targetDate, -1);
    } else {
      // Today is scheduled but not checked in yet.
      // Streak is not broken if the previous scheduled day was completed.
      cursorDate = addDays(targetDate, -1);
    }
  } else {
    // Today is not a scheduled day for this habit.
    // Check backwards from yesterday.
    cursorDate = addDays(targetDate, -1);
  }

  // Walk backwards day by day to count consecutive completed scheduled days
  // Stop when habit start date is reached, or a scheduled day is missed, or max 365 days
  let daysWalked = 0;
  const maxDays = 730; // 2 years limit for safety
  const minDate = habit.startDate || '1970-01-01';

  while (cursorDate >= minDate && daysWalked < maxDays) {
    if (isDayScheduled(habit, cursorDate)) {
      if (completionsSet.has(cursorDate)) {
        currentStreak += 1;
      } else {
        // Found a scheduled day that was missed! Streak ends here.
        break;
      }
    }
    // If not scheduled, skip without breaking the streak
    cursorDate = addDays(cursorDate, -1);
    daysWalked += 1;
  }

  // 2. Calculate Best Streak across all completions
  let bestStreak = 0;
  if (completionsSet.size > 0) {
    const sortedDates = Array.from(completionsSet).sort();
    const firstCompletion = sortedDates[0];
    const startDate = habit.startDate && habit.startDate < firstCompletion ? habit.startDate : firstCompletion;

    let tempStreak = 0;
    let scanDate = startDate;

    while (scanDate <= targetDate) {
      if (isDayScheduled(habit, scanDate)) {
        if (completionsSet.has(scanDate)) {
          tempStreak += 1;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          // Missed scheduled day resets the streak
          tempStreak = 0;
        }
      }
      scanDate = addDays(scanDate, 1);
    }
  }

  // Best streak must be at least as large as current streak
  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return {
    currentStreak,
    bestStreak,
    totalCompletions: completionsSet.size,
    completedToday,
    isScheduledToday,
  };
}
