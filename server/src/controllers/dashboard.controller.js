import { getDb } from '../db/mongo.js';
import { calculateHabitStreak, formatDateString, isDayScheduled } from '../utils/streaks.js';

/**
 * Get aggregated Today summary for the dashboard
 */
export async function getDashboardSummary(req, res) {
  const db = getDb();
  const ownerId = req.user._id;

  const todayStr = req.query.date || formatDateString(new Date());
  const nowIso = new Date().toISOString();

  // 1. Fetch Tasks
  const allTasks = await db.collection('tasks').find({ ownerId }).toArray();
  const categories = await db.collection('categories').find({ ownerId }).toArray();
  const categoryMap = new Map(categories.map(c => [c._id.toString(), c]));

  // Today's tasks: due today OR completed today OR high priority pending
  const todayStart = `${todayStr}T00:00:00.000Z`;
  const todayEnd = `${todayStr}T23:59:59.999Z`;

  const todayTasks = [];
  let overdueCount = 0;
  let totalTasks = allTasks.length;
  let completedTasksCount = 0;

  for (const t of allTasks) {
    if (t.status === 'completed') {
      completedTasksCount += 1;
      // If completed today or due today, show in today view
      if (t.completedAt && t.completedAt.slice(0, 10) === todayStr) {
        todayTasks.push(t);
      } else if (t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd) {
        todayTasks.push(t);
      }
    } else {
      // Pending tasks
      if (t.dueDate && t.dueDate < nowIso) {
        overdueCount += 1;
      }
      if (t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd) {
        todayTasks.push(t);
      } else if (!t.dueDate && (t.status === 'in_progress' || t.priority === 'high')) {
        todayTasks.push(t);
      }
    }
  }

  // 2. Fetch Habits and today's completions
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

  const todayHabits = [];
  let scheduledHabitsToday = 0;
  let completedHabitsToday = 0;

  for (const habit of habits) {
    const habitId = habit._id.toString();
    const dates = completionsByHabit.get(habitId) || [];
    const stats = calculateHabitStreak(habit, dates, todayStr);
    const scheduled = isDayScheduled(habit, todayStr);

    if (scheduled) {
      scheduledHabitsToday += 1;
      if (stats.completedToday) {
        completedHabitsToday += 1;
      }
    }

    // Attach category
    const cat = habit.categoryId ? categoryMap.get(habit.categoryId) : null;

    todayHabits.push({
      ...habit,
      _id: habitId,
      category: cat ? { name: cat.name, color: cat.color } : null,
      ...stats,
      isScheduledToday: scheduled,
    });
  }

  // Compute daily completion percentage
  const totalDailyItems = todayTasks.length + scheduledHabitsToday;
  const completedDailyItems =
    todayTasks.filter(t => t.status === 'completed').length + completedHabitsToday;
  const dailyProgressPercent = totalDailyItems > 0
    ? Math.round((completedDailyItems / totalDailyItems) * 100)
    : 0;

  return res.json(200, {
    date: todayStr,
    summary: {
      totalTasks,
      completedTasksCount,
      overdueTasksCount: overdueCount,
      scheduledHabitsToday,
      completedHabitsToday,
      dailyProgressPercent,
    },
    todayTasks: todayTasks.slice(0, 10).map(t => ({
      ...t,
      _id: t._id.toString(),
      category: t.categoryId && categoryMap.has(t.categoryId)
        ? { name: categoryMap.get(t.categoryId).name, color: categoryMap.get(t.categoryId).color }
        : null,
    })),
    todayHabits,
  });
}
