import { MongoClient, ObjectId } from 'mongodb';
import { config } from '../config/index.js';

let client = null;
let db = null;

export { ObjectId };

/**
 * Connect to MongoDB using the official driver
 */
export async function connectDb(uri = config.mongoUri, dbName = config.dbName) {
  if (db && client) {
    return db;
  }

  client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  db = client.db(dbName);
  return db;
}

/**
 * Get active database instance
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() first.');
  }
  return db;
}

/**
 * Get active MongoClient instance
 */
export function getClient() {
  return client;
}

/**
 * Close database connection gracefully
 */
export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

/**
 * Initialize all required indexes idempotently
 */
export async function initIndexes(targetDb = null) {
  const database = targetDb || getDb();

  // Users collection: unique normalized email
  await database.collection('users').createIndex(
    { email: 1 },
    { unique: true, name: 'uniq_user_email' }
  );

  // Sessions collection: unique token hash, TTL on expiresAt
  await database.collection('sessions').createIndex(
    { tokenHash: 1 },
    { unique: true, name: 'uniq_session_token_hash' }
  );
  await database.collection('sessions').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_session_expiry' }
  );
  await database.collection('sessions').createIndex(
    { userId: 1 },
    { name: 'idx_session_user_id' }
  );

  // Tasks collection: owner + status, owner + dueDate, owner + createdAt
  await database.collection('tasks').createIndex(
    { ownerId: 1, status: 1 },
    { name: 'idx_tasks_owner_status' }
  );
  await database.collection('tasks').createIndex(
    { ownerId: 1, dueDate: 1 },
    { name: 'idx_tasks_owner_due_date' }
  );
  await database.collection('tasks').createIndex(
    { ownerId: 1, categoryId: 1 },
    { name: 'idx_tasks_owner_category' }
  );
  await database.collection('tasks').createIndex(
    { ownerId: 1, createdAt: -1 },
    { name: 'idx_tasks_owner_created' }
  );

  // Habits collection: owner + status
  await database.collection('habits').createIndex(
    { ownerId: 1, status: 1 },
    { name: 'idx_habits_owner_status' }
  );
  await database.collection('habits').createIndex(
    { ownerId: 1, categoryId: 1 },
    { name: 'idx_habits_owner_category' }
  );

  // Habit Completions: unique per habitId + date, index on ownerId + date
  await database.collection('habit_completions').createIndex(
    { habitId: 1, date: 1 },
    { unique: true, name: 'uniq_habit_completion_per_date' }
  );
  await database.collection('habit_completions').createIndex(
    { ownerId: 1, date: 1 },
    { name: 'idx_completions_owner_date' }
  );

  // Categories collection: owner + name
  await database.collection('categories').createIndex(
    { ownerId: 1, name: 1 },
    { unique: true, name: 'uniq_category_owner_name' }
  );
}
