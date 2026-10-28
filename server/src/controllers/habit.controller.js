import { getDb, ObjectId } from '../db/mongo.js';
import { validateHabitInput, validateDateString } from '../utils/validators.js';
import { calculateHabitStreak, formatDateString } from '../utils/streaks.js';

/**
 * List all habits with calculated streaks
 */
export async function getHabits(req, res) {
  const db = getDb();
  const ownerId = req.user._id;
  const { status, categoryId } = req.query || {};

  const filter = { ownerId };
  if (status && ['active', 'paused', 'archived'].includes(status)) {
    filter.status = status;
  } else if (!status) {
    // Default: active and paused habits (exclude archived unless requested)
    filter.status = { $in: ['active', 'paused'] };
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  const habits = await db.collection('habits')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  const habitIds = habits.map(h => h._id.toString());
  const todayStr = formatDateString(new Date());

  // Fetch all completions for these habits
  const completions = await db.collection('habit_completions')
    .find({ habitId: { $in: habitIds } })
    .toArray();

  // Group completions by habitId
  const completionsByHabit = new Map();
  for (const c of completions) {
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, []);
    }
    completionsByHabit.get(c.habitId).push(c.date);
  }

  const enriched = habits.map(habit => {
    const habitId = habit._id.toString();
    const dates = completionsByHabit.get(habitId) || [];
    const stats = calculateHabitStreak(habit, dates, todayStr);
    return {
      ...habit,
      _id: habitId,
      ...stats,
      recentDates: dates.slice(-14), // last 14 dates for UI mini-matrix
    };
  });

  return res.json(200, { habits: enriched });
}

/**
 * Create a new habit
 */
export async function createHabit(req, res) {
  const validation = validateHabitInput(req.body || {}, false);
  if (!validation.isValid) {
    return res.error(400, 'Invalid habit data', validation.errors);
  }

  const db = getDb();
  const now = new Date();
  const todayStr = formatDateString(now);

  const habitDoc = {
    ownerId: req.user._id,
    name: validation.data.name,
    description: validation.data.description || '',
    schedule: validation.data.schedule || { type: 'daily' },
    categoryId: validation.data.categoryId || null,
    startDate: validation.data.startDate || todayStr,
    endDate: validation.data.endDate || null,
    reminderTime: validation.data.reminderTime || null,
    status: validation.data.status || 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const result = await db.collection('habits').insertOne(habitDoc);
  const habitId = result.insertedId.toString();

  const stats = calculateHabitStreak(habitDoc, [], todayStr);

  return res.json(201, {
    habit: {
      ...habitDoc,
      _id: habitId,
      ...stats,
      recentDates: [],
    },
  });
}

/**
 * Get single habit by ID
 */
export async function getHabitById(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  const db = getDb();
  const habit = await db.collection('habits').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!habit) {
    return res.error(404, 'Habit not found');
  }

  const completions = await db.collection('habit_completions')
    .find({ habitId: id })
    .sort({ date: 1 })
    .toArray();

  const dates = completions.map(c => c.date);
  const todayStr = formatDateString(new Date());
  const stats = calculateHabitStreak(habit, dates, todayStr);

  return res.json(200, {
    habit: {
      ...habit,
      _id: habit._id.toString(),
      ...stats,
      completions: dates,
    },
  });
}

/**
 * Update habit
 */
export async function updateHabit(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  const validation = validateHabitInput(req.body || {}, true);
  if (!validation.isValid) {
    return res.error(400, 'Invalid habit update data', validation.errors);
  }

  const db = getDb();
  const existing = await db.collection('habits').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!existing) {
    return res.error(404, 'Habit not found');
  }

  const now = new Date();
  const updateDoc = {
    ...validation.data,
    updatedAt: now.toISOString(),
  };

  await db.collection('habits').updateOne(
    { _id: new ObjectId(id), ownerId: req.user._id },
    { $set: updateDoc }
  );

  const updated = await db.collection('habits').findOne({ _id: new ObjectId(id) });
  const completions = await db.collection('habit_completions')
    .find({ habitId: id })
    .toArray();
  const dates = completions.map(c => c.date);
  const todayStr = formatDateString(new Date());
  const stats = calculateHabitStreak(updated, dates, todayStr);

  return res.json(200, {
    habit: {
      ...updated,
      _id: updated._id.toString(),
      ...stats,
    },
  });
}

/**
 * Delete habit and its check-in records
 */
export async function deleteHabit(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  const db = getDb();
  const result = await db.collection('habits').deleteOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (result.deletedCount === 0) {
    return res.error(404, 'Habit not found');
  }

  // Delete all completions for this habit
  await db.collection('habit_completions').deleteMany({ habitId: id });

  return res.json(200, { message: 'Habit and completions deleted successfully' });
}

/**
 * Get completion dates for a habit
 */
export async function getHabitCompletions(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  const db = getDb();
  const habit = await db.collection('habits').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!habit) {
    return res.error(404, 'Habit not found');
  }

  const { startDate, endDate } = req.query || {};
  const filter = { habitId: id };
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.date = { $gte: startDate };
  } else if (endDate) {
    filter.date = { $lte: endDate };
  }

  const completions = await db.collection('habit_completions')
    .find(filter)
    .sort({ date: 1 })
    .toArray();

  return res.json(200, {
    completions: completions.map(c => c.date),
  });
}

/**
 * Idempotently record completion for a habit on a specific date (PUT)
 */
export async function recordCompletion(req, res) {
  const { id, date } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  if (!validateDateString(date)) {
    return res.error(400, 'Date must be formatted as YYYY-MM-DD');
  }

  const db = getDb();
  const habit = await db.collection('habits').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!habit) {
    return res.error(404, 'Habit not found');
  }

  // Idempotent upsert in habit_completions
  await db.collection('habit_completions').updateOne(
    { habitId: id, date },
    {
      $setOnInsert: {
        habitId: id,
        ownerId: req.user._id,
        date,
        completedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  // Recalculate streak
  const completions = await db.collection('habit_completions')
    .find({ habitId: id })
    .toArray();
  const dates = completions.map(c => c.date);
  const todayStr = formatDateString(new Date());
  const stats = calculateHabitStreak(habit, dates, todayStr);

  return res.json(200, {
    message: 'Check-in recorded',
    date,
    habitId: id,
    ...stats,
  });
}

/**
 * Remove check-in for a habit on a specific date (DELETE)
 */
export async function removeCompletion(req, res) {
  const { id, date } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid habit ID format');
  }

  if (!validateDateString(date)) {
    return res.error(400, 'Date must be formatted as YYYY-MM-DD');
  }

  const db = getDb();
  const habit = await db.collection('habits').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!habit) {
    return res.error(404, 'Habit not found');
  }

  await db.collection('habit_completions').deleteOne({
    habitId: id,
    ownerId: req.user._id,
    date,
  });

  // Recalculate streak
  const completions = await db.collection('habit_completions')
    .find({ habitId: id })
    .toArray();
  const dates = completions.map(c => c.date);
  const todayStr = formatDateString(new Date());
  const stats = calculateHabitStreak(habit, dates, todayStr);

  return res.json(200, {
    message: 'Check-in removed',
    date,
    habitId: id,
    ...stats,
  });
}
