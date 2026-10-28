import { getDb, ObjectId } from '../db/mongo.js';
import { validateTaskInput } from '../utils/validators.js';

/**
 * List tasks with pagination, filtering, searching, and sorting
 */
export async function getTasks(req, res) {
  const db = getDb();
  const ownerId = req.user._id;

  const {
    status,
    priority,
    categoryId,
    search,
    overdue,
    date,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '50',
  } = req.query || {};

  const filter = { ownerId };

  if (status && ['todo', 'in_progress', 'completed'].includes(status)) {
    filter.status = status;
  }

  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    filter.priority = priority;
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (date) {
    // Due on specific YYYY-MM-DD
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    filter.dueDate = { $gte: start.toISOString(), $lte: end.toISOString() };
  }

  if (overdue === 'true') {
    const nowIso = new Date().toISOString();
    filter.status = { $ne: 'completed' };
    filter.dueDate = { $ne: null, $lt: nowIso };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
      { tags: { $regex: escaped, $options: 'i' } },
    ];
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions = {};
  if (['dueDate', 'priority', 'createdAt', 'title'].includes(sortBy)) {
    sortOptions[sortBy] = sortDirection;
  } else {
    sortOptions.createdAt = -1;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    db.collection('tasks')
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .toArray(),
    db.collection('tasks').countDocuments(filter),
  ]);

  return res.json(200, {
    tasks: tasks.map(t => ({ ...t, _id: t._id.toString() })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

/**
 * Create a new task
 */
export async function createTask(req, res) {
  const validation = validateTaskInput(req.body || {}, false);
  if (!validation.isValid) {
    return res.error(400, 'Invalid task data', validation.errors);
  }

  const db = getDb();
  const now = new Date();
  const taskDoc = {
    ownerId: req.user._id,
    title: validation.data.title,
    description: validation.data.description || '',
    status: validation.data.status || 'todo',
    priority: validation.data.priority || 'medium',
    dueDate: validation.data.dueDate || null,
    categoryId: validation.data.categoryId || null,
    tags: validation.data.tags || [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: validation.data.status === 'completed' ? now.toISOString() : null,
  };

  const result = await db.collection('tasks').insertOne(taskDoc);
  return res.json(201, {
    task: { ...taskDoc, _id: result.insertedId.toString() },
  });
}

/**
 * Get single task by ID
 */
export async function getTaskById(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid task ID format');
  }

  const db = getDb();
  const task = await db.collection('tasks').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!task) {
    return res.error(404, 'Task not found');
  }

  return res.json(200, {
    task: { ...task, _id: task._id.toString() },
  });
}

/**
 * Update task by ID (patch)
 */
export async function updateTask(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid task ID format');
  }

  const validation = validateTaskInput(req.body || {}, true);
  if (!validation.isValid) {
    return res.error(400, 'Invalid task update data', validation.errors);
  }

  const db = getDb();
  const existing = await db.collection('tasks').findOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (!existing) {
    return res.error(404, 'Task not found');
  }

  const now = new Date();
  const updateFields = {
    ...validation.data,
    updatedAt: now.toISOString(),
  };

  // Idempotent completion logic
  if (validation.data.status) {
    if (validation.data.status === 'completed' && existing.status !== 'completed') {
      updateFields.completedAt = now.toISOString();
    } else if (validation.data.status !== 'completed') {
      updateFields.completedAt = null;
    }
  }

  await db.collection('tasks').updateOne(
    { _id: new ObjectId(id), ownerId: req.user._id },
    { $set: updateFields }
  );

  const updated = await db.collection('tasks').findOne({ _id: new ObjectId(id) });
  return res.json(200, {
    task: { ...updated, _id: updated._id.toString() },
  });
}

/**
 * Delete task by ID
 */
export async function deleteTask(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid task ID format');
  }

  const db = getDb();
  const result = await db.collection('tasks').deleteOne({
    _id: new ObjectId(id),
    ownerId: req.user._id,
  });

  if (result.deletedCount === 0) {
    return res.error(404, 'Task not found');
  }

  return res.json(200, { message: 'Task deleted successfully' });
}
