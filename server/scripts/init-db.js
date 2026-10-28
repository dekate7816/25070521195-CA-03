import { connectDb, closeDb, initIndexes } from '../src/db/mongo.js';

async function run() {
  console.log('[Looply] Running database index initialization...');
  try {
    const db = await connectDb();
    console.log(`[Looply] Connected to database: ${db.databaseName}`);
    await initIndexes(db);
    console.log('[Looply] All indexes created successfully:');
    console.log(' - users: email (unique)');
    console.log(' - sessions: tokenHash (unique), expiresAt (TTL)');
    console.log(' - tasks: ownerId+status, ownerId+dueDate, ownerId+createdAt');
    console.log(' - habits: ownerId+status');
    console.log(' - habit_completions: habitId+date (unique), ownerId+date');
    console.log(' - categories: ownerId+name (unique)');
  } catch (err) {
    console.error('[Looply] Index creation failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
    console.log('[Looply] Database connection closed.');
  }
}

run();
