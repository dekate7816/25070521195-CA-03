import { getDb, ObjectId } from '../db/mongo.js';

export async function getProfile(req, res) {
  const db = getDb();
  const user = await db.collection('users').findOne({
    _id: new ObjectId(req.user._id),
  });

  if (!user) {
    return res.error(404, 'User not found');
  }

  return res.json(200, {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      timezone: user.timezone || 'UTC',
      authProvider: user.authProvider || 'local',
      createdAt: user.createdAt,
    },
  });
}

export async function updateProfile(req, res) {
  const { name, timezone } = req.body || {};
  const updates = {};

  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim().slice(0, 100);
  }

  if (typeof timezone === 'string' && timezone.trim()) {
    updates.timezone = timezone.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.error(400, 'No valid fields provided to update');
  }

  updates.updatedAt = new Date();

  const db = getDb();
  await db.collection('users').updateOne(
    { _id: new ObjectId(req.user._id) },
    { $set: updates }
  );

  const updated = await db.collection('users').findOne({
    _id: new ObjectId(req.user._id),
  });

  return res.json(200, {
    user: {
      _id: updated._id.toString(),
      email: updated.email,
      name: updated.name,
      timezone: updated.timezone,
      authProvider: updated.authProvider || 'local',
      createdAt: updated.createdAt,
    },
  });
}
