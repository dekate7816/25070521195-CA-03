/**
 * DEVELOPMENT-ONLY SEED SCRIPT
 * 
 * Notice: This script is exclusively for manual local testing.
 * Normal application startup NEVER runs this script and NEVER inserts dummy data.
 * All real application analytics and insights are computed strictly from real authenticated user data.
 */

import { connectDb, closeDb } from '../src/db/mongo.js';
import { hashPassword } from '../src/utils/crypto.js';
import { formatDateString, addDays } from '../src/utils/streaks.js';

async function seed() {
  console.log('[Looply Seed] Starting development-only seed process...');

  try {
    const db = await connectDb();
    console.log(`[Looply Seed] Connected to database: ${db.databaseName}`);

    const demoEmail = 'demo@looply.test';
    const demoPassword = 'LooplyDemo2026!';

    // Remove existing demo user if present
    const existing = await db.collection('users').findOne({ email: demoEmail });
    if (existing) {
      console.log('[Looply Seed] Cleaning up previous demo user records...');
      const uid = existing._id.toString();
      await db.collection('users').deleteOne({ _id: existing._id });
      await db.collection('tasks').deleteMany({ ownerId: uid });
      await db.collection('habits').deleteMany({ ownerId: uid });
      await db.collection('habit_completions').deleteMany({ ownerId: uid });
      await db.collection('categories').deleteMany({ ownerId: uid });
      await db.collection('sessions').deleteMany({ userId: existing._id });
    }

    const passwordHash = await hashPassword(demoPassword);
    const now = new Date();
    const userRes = await db.collection('users').insertOne({
      email: demoEmail,
      passwordHash,
      name: 'Alex Turner',
      timezone: 'UTC',
      authProvider: 'local',
      createdAt: now,
      updatedAt: now,
    });

    const ownerId = userRes.insertedId.toString();
    console.log(`[Looply Seed] Created demo user: ${demoEmail} (Password: ${demoPassword})`);

    // 1. Categories
    const categories = [
      { name: 'Engineering', color: '#2563eb' },
      { name: 'Wellness', color: '#059669' },
      { name: 'Mindfulness', color: '#7c3aed' },
      { name: 'Home & Life', color: '#ea580c' },
    ];
    const catInsert = await db.collection('categories').insertMany(
      categories.map(c => ({ ...c, ownerId, createdAt: now.toISOString() }))
    );
    const catMap = {};
    Object.keys(catInsert.insertedIds).forEach((idx, i) => {
      catMap[categories[i].name] = catInsert.insertedIds[idx].toString();
    });

    const todayStr = formatDateString(now);

    // 2. Tasks
    const tasks = [
      {
        ownerId,
        title: 'Review production pull requests',
        description: 'Verify router test coverage and security headers.',
        status: 'in_progress',
        priority: 'high',
        dueDate: `${todayStr}T15:00:00.000Z`,
        categoryId: catMap['Engineering'],
        tags: ['code-review', 'security'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: null,
      },
      {
        ownerId,
        title: 'Complete 30-minute morning run',
        description: 'Zone 2 cardio in the park.',
        status: 'completed',
        priority: 'medium',
        dueDate: `${todayStr}T08:00:00.000Z`,
        categoryId: catMap['Wellness'],
        tags: ['fitness', 'cardio'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: `${todayStr}T08:35:00.000Z`,
      },
      {
        ownerId,
        title: 'Quarterly system architecture refactor',
        description: 'Draft ADR for zero-dependency native router.',
        status: 'todo',
        priority: 'high',
        dueDate: `${addDays(todayStr, 2)}T18:00:00.000Z`,
        categoryId: catMap['Engineering'],
        tags: ['architecture'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: null,
      },
      {
        ownerId,
        title: 'Schedule dentist appointment',
        description: 'Routine checkup for next month.',
        status: 'todo',
        priority: 'low',
        dueDate: null,
        categoryId: catMap['Home & Life'],
        tags: ['health'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: null,
      },
      {
        ownerId,
        title: 'Weekly grocery restock',
        description: 'Fresh vegetables, oats, and Greek yogurt.',
        status: 'todo',
        priority: 'medium',
        dueDate: `${addDays(todayStr, -1)}T19:00:00.000Z`, // Overdue task demo
        categoryId: catMap['Home & Life'],
        tags: ['groceries'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: null,
      },
    ];

    await db.collection('tasks').insertMany(tasks);
    console.log(`[Looply Seed] Inserted ${tasks.length} demo tasks.`);

    // 3. Habits
    const habits = [
      {
        ownerId,
        name: 'Morning Hydration & Sunlight',
        description: 'Drink 500ml water and get 10 minutes of outdoor sunlight.',
        schedule: { type: 'daily' },
        categoryId: catMap['Wellness'],
        startDate: addDays(todayStr, -20),
        endDate: null,
        reminderTime: '07:30',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        ownerId,
        name: 'Deep Work Session (90 min)',
        description: 'Focus without phone or notifications on core project priorities.',
        schedule: { type: 'weekly', days: [1, 2, 3, 4, 5] }, // Mon - Fri
        categoryId: catMap['Engineering'],
        startDate: addDays(todayStr, -14),
        endDate: null,
        reminderTime: '09:30',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        ownerId,
        name: 'Evening Reading (20 pages)',
        description: 'Non-fiction or technical literature before sleep.',
        schedule: { type: 'daily' },
        categoryId: catMap['Mindfulness'],
        startDate: addDays(todayStr, -10),
        endDate: null,
        reminderTime: '22:00',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    const habitInsert = await db.collection('habits').insertMany(habits);
    console.log(`[Looply Seed] Inserted ${habits.length} demo habits.`);

    // 4. Completions for habits to demonstrate real streak calculation
    const h1Id = habitInsert.insertedIds[0].toString();
    const h2Id = habitInsert.insertedIds[1].toString();
    const h3Id = habitInsert.insertedIds[2].toString();

    const completions = [];
    // Habit 1: checked in for the last 7 consecutive days including today
    for (let i = 0; i <= 6; i++) {
      completions.push({
        habitId: h1Id,
        ownerId,
        date: addDays(todayStr, -i),
        completedAt: new Date().toISOString(),
      });
    }

    // Habit 2: checked in for 4 weekdays
    for (let i = 1; i <= 4; i++) {
      completions.push({
        habitId: h2Id,
        ownerId,
        date: addDays(todayStr, -i),
        completedAt: new Date().toISOString(),
      });
    }

    // Habit 3: checked in today
    completions.push({
      habitId: h3Id,
      ownerId,
      date: todayStr,
      completedAt: new Date().toISOString(),
    });

    await db.collection('habit_completions').insertMany(completions);
    console.log(`[Looply Seed] Inserted ${completions.length} completion check-in records.`);
    console.log('[Looply Seed] Demo seed completed successfully!');
  } catch (err) {
    console.error('[Looply Seed] Seed error:', err);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

seed();
