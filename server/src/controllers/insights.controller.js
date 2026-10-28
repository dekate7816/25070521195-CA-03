import { getDb } from '../db/mongo.js';
import { calculateHabitStreak, formatDateString, addDays, isDayScheduled } from '../utils/streaks.js';

/**
 * Task Analytics & Trends
 */
export async function getTaskInsights(req, res) {
  const db = getDb();
  const ownerId = req.user._id;

  const tasks = await db.collection('tasks').find({ ownerId }).toArray();
  const categories = await db.collection('categories').find({ ownerId }).toArray();
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c.name]));

  const byStatus = { todo: 0, in_progress: 0, completed: 0 };
  const byPriority = { low: 0, medium: 0, high: 0 };
  const byCategory = {};

  const nowIso = new Date().toISOString();
  let overdueCount = 0;

  for (const t of tasks) {
    if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
    if (byPriority[t.priority] !== undefined) byPriority[t.priority] += 1;

    const catName = (t.categoryId && categoryMap.get(t.categoryId)) || 'Uncategorized';
    byCategory[catName] = (byCategory[catName] || 0) + 1;

    if (t.status !== 'completed' && t.dueDate && t.dueDate < nowIso) {
      overdueCount += 1;
    }
  }

  // 7-day completion trend
  const todayStr = formatDateString(new Date());
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(todayStr, -i);
    const count = tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === d).length;
    last7Days.push({ date: d, completedCount: count });
  }

  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((byStatus.completed / total) * 100) : 0;

  return res.json(200, {
    totalTasks: total,
    completionRate,
    overdueCount,
    byStatus,
    byPriority,
    byCategory,
    last7DaysTrend: last7Days,
  });
}

/**
 * Habit Consistency & Streak Insights
 */
export async function getHabitInsights(req, res) {
  const db = getDb();
  const ownerId = req.user._id;

  const habits = await db.collection('habits')
    .find({ ownerId, status: { $ne: 'archived' } })
    .toArray();

  const habitIds = habits.map(h => h._id.toString());
  const completions = await db.collection('habit_completions')
    .find({ habitId: { $in: habitIds } })
    .toArray();

  const completionsByHabit = new Map();
  for (const c of completions) {
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, []);
    }
    completionsByHabit.get(c.habitId).push(c.date);
  }

  const todayStr = formatDateString(new Date());

  let totalCompletionsAllTime = completions.length;
  let activeHabitsCount = habits.length;
  let longestStreakOverall = 0;
  let totalCurrentStreakSum = 0;

  const habitLeaderboard = [];

  for (const habit of habits) {
    const habitId = habit._id.toString();
    const dates = completionsByHabit.get(habitId) || [];
    const stats = calculateHabitStreak(habit, dates, todayStr);

    if (stats.bestStreak > longestStreakOverall) {
      longestStreakOverall = stats.bestStreak;
    }
    totalCurrentStreakSum += stats.currentStreak;

    habitLeaderboard.push({
      _id: habitId,
      name: habit.name,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      totalCompletions: stats.totalCompletions,
    });
  }

  // 14-day consistency grid (calendar heatmap data)
  const last14Days = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(todayStr, -i);
    let scheduledCount = 0;
    let completedCount = 0;

    for (const habit of habits) {
      if (isDayScheduled(habit, d)) {
        scheduledCount += 1;
        const dates = completionsByHabit.get(habit._id.toString()) || [];
        if (dates.includes(d)) {
          completedCount += 1;
        }
      }
    }

    const rate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;
    last14Days.push({
      date: d,
      scheduled: scheduledCount,
      completed: completedCount,
      rate,
    });
  }

  const avgStreak = activeHabitsCount > 0
    ? Math.round(totalCurrentStreakSum / activeHabitsCount)
    : 0;

  return res.json(200, {
    activeHabitsCount,
    totalCompletionsAllTime,
    longestStreakOverall,
    averageCurrentStreak: avgStreak,
    habitLeaderboard: habitLeaderboard.sort((a, b) => b.currentStreak - a.currentStreak),
    recentConsistency: last14Days,
  });
}
