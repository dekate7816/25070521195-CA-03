import { config } from '../config/index.js';
import { getDb, ObjectId } from '../db/mongo.js';
import { hashToken } from '../utils/crypto.js';

export async function sessionMiddleware(req, res, next) {
  req.user = null;
  req.session = null;

  const rawToken = req.cookies[config.sessionCookieName];
  if (!rawToken) {
    return next();
  }

  try {
    const db = getDb();
    const tokenHash = hashToken(rawToken);

    const session = await db.collection('sessions').findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return next();
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(session.userId),
    });

    if (user) {
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        name: user.name || user.email.split('@')[0],
        timezone: user.timezone || 'UTC',
        createdAt: user.createdAt,
      };
      req.session = {
        _id: session._id.toString(),
        userId: session.userId.toString(),
        csrfToken: session.csrfToken,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      };
    }
  } catch (err) {
    // If DB is offline or error occurs, proceed as unauthenticated without crashing
    console.error('Session lookup error:', err.message);
  }

  next();
}

/**
 * Route guard requiring authenticated user
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.error(401, 'Authentication required');
  }
  next();
}
