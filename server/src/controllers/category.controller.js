import { getDb, ObjectId } from '../db/mongo.js';
import { validateCategoryInput } from '../utils/validators.js';

/**
 * List all categories for the authenticated user with usage counts
 */
export async function getCategories(req, res) {
  const db = getDb();
  const ownerId = req.user._id;

  const categories = await db.collection('categories')
    .find({ ownerId })
    .sort({ name: 1 })
    .toArray();

  const categoryIds = categories.map(c => c._id.toString());

  // Count tasks per category
  const taskCounts = await db.collection('tasks').aggregate([
    { $match: { ownerId, categoryId: { $in: categoryIds } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]).toArray();

  // Count habits per category
  const habitCounts = await db.collection('habits').aggregate([
    { $match: { ownerId, categoryId: { $in: categoryIds } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]).toArray();

  const taskCountMap = new Map(taskCounts.map(t => [t._id, t.count]));
  const habitCountMap = new Map(habitCounts.map(h => [h._id, h.count]));

  const enriched = categories.map(c => {
    const id = c._id.toString();
    return {
      ...c,
      _id: id,
      taskCount: taskCountMap.get(id) || 0,
      habitCount: habitCountMap.get(id) || 0,
    };
  });

  return res.json(200, { categories: enriched });
}

/**
 * Create a new category
 */
export async function createCategory(req, res) {
  const validation = validateCategoryInput(req.body || {}, false);
  if (!validation.isValid) {
    return res.error(400, 'Invalid category data', validation.errors);
  }

  const db = getDb();
  const ownerId = req.user._id;

  // Check if name already exists for this user
  const existing = await db.collection('categories').findOne({
    ownerId,
    name: { $regex: `^${validation.data.name}$`, $options: 'i' },
  });

  if (existing) {
    return res.error(409, 'A category with this name already exists');
  }

  const categoryDoc = {
    ownerId,
    name: validation.data.name,
    color: validation.data.color || '#4f46e5',
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection('categories').insertOne(categoryDoc);
  return res.json(201, {
    category: {
      ...categoryDoc,
      _id: result.insertedId.toString(),
      taskCount: 0,
      habitCount: 0,
    },
  });
}

/**
 * Update category
 */
export async function updateCategory(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid category ID format');
  }

  const validation = validateCategoryInput(req.body || {}, true);
  if (!validation.isValid) {
    return res.error(400, 'Invalid category update data', validation.errors);
  }

  const db = getDb();
  const ownerId = req.user._id;

  const existing = await db.collection('categories').findOne({
    _id: new ObjectId(id),
    ownerId,
  });

  if (!existing) {
    return res.error(404, 'Category not found');
  }

  if (validation.data.name) {
    const duplicate = await db.collection('categories').findOne({
      _id: { $ne: new ObjectId(id) },
      ownerId,
      name: { $regex: `^${validation.data.name}$`, $options: 'i' },
    });
    if (duplicate) {
      return res.error(409, 'Another category with this name already exists');
    }
  }

  await db.collection('categories').updateOne(
    { _id: new ObjectId(id), ownerId },
    { $set: validation.data }
  );

  const updated = await db.collection('categories').findOne({ _id: new ObjectId(id) });
  return res.json(200, {
    category: { ...updated, _id: updated._id.toString() },
  });
}

/**
 * Delete category safely (safeguards against orphaned records)
 */
export async function deleteCategory(req, res) {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.error(400, 'Invalid category ID format');
  }

  const db = getDb();
  const ownerId = req.user._id;

  const category = await db.collection('categories').findOne({
    _id: new ObjectId(id),
    ownerId,
  });

  if (!category) {
    return res.error(404, 'Category not found');
  }

  // Check how many tasks and habits reference this category
  const [taskCount, habitCount] = await Promise.all([
    db.collection('tasks').countDocuments({ ownerId, categoryId: id }),
    db.collection('habits').countDocuments({ ownerId, categoryId: id }),
  ]);

  const { reassignTo } = req.query || {};

  if (taskCount > 0 || habitCount > 0) {
    if (!reassignTo) {
      return res.error(409, 'Category is in use and cannot be deleted directly without reassignment', {
        taskCount,
        habitCount,
        requiresReassignment: true,
      });
    }

    // Validate reassignment target
    if (reassignTo !== 'none') {
      if (!ObjectId.isValid(reassignTo)) {
        return res.error(400, 'Invalid reassignment target category ID');
      }
      const targetCategory = await db.collection('categories').findOne({
        _id: new ObjectId(reassignTo),
        ownerId,
      });
      if (!targetCategory) {
        return res.error(404, 'Reassignment target category not found');
      }
    }

    const newCategoryId = reassignTo === 'none' ? null : reassignTo;

    // Safely reassign tasks and habits
    await Promise.all([
      db.collection('tasks').updateMany(
        { ownerId, categoryId: id },
        { $set: { categoryId: newCategoryId } }
      ),
      db.collection('habits').updateMany(
        { ownerId, categoryId: id },
        { $set: { categoryId: newCategoryId } }
      ),
    ]);
  }

  await db.collection('categories').deleteOne({ _id: new ObjectId(id), ownerId });

  return res.json(200, {
    message: 'Category deleted successfully',
    reassignedTasks: taskCount,
    reassignedHabits: habitCount,
  });
}
