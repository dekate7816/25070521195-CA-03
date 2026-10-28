import { config } from '../config/index.js';
import { getDb, ObjectId } from '../db/mongo.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
} from '../utils/crypto.js';
import {
  validateEmail,
  validatePassword,
  normalizeEmail,
} from '../utils/validators.js';
import { setCookie, clearCookie } from '../utils/response.js';

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#3b82f6' },
  { name: 'Health & Fitness', color: '#10b981' },
  { name: 'Personal Growth', color: '#8b5cf6' },
  { name: 'Daily Routine', color: '#f59e0b' },
];

/**
 * Register new user with email and password
 */
export async function register(req, res) {
  const { email, password, name, timezone } = req.body || {};

  if (!validateEmail(email)) {
    return res.error(400, 'Please provide a valid email address');
  }

  if (!validatePassword(password)) {
    return res.error(400, 'Password must be between 8 and 128 characters long');
  }

  const normalized = normalizeEmail(email);
  const db = getDb();

  // Check if email already in use
  const existing = await db.collection('users').findOne({ email: normalized });
  if (existing) {
    return res.error(409, 'An account with this email address already exists');
  }

  const passwordHash = await hashPassword(password);
  const displayName = typeof name === 'string' && name.trim().length > 0
    ? name.trim().slice(0, 100)
    : normalized.split('@')[0];
  const userTimezone = typeof timezone === 'string' && timezone.trim()
    ? timezone.trim()
    : 'UTC';

  const now = new Date();
  const insertResult = await db.collection('users').insertOne({
    email: normalized,
    passwordHash,
    name: displayName,
    timezone: userTimezone,
    authProvider: 'local',
    createdAt: now,
    updatedAt: now,
  });

  const userId = insertResult.insertedId;

  // Create default starter categories for user
  const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
    ownerId: userId.toString(),
    name: cat.name,
    color: cat.color,
    createdAt: now,
  }));
  await db.collection('categories').insertMany(categoriesToInsert);

  // Create session
  const rawToken = generateToken(32);
  const csrfToken = generateToken(16);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.sessionMaxAgeMs);

  await db.collection('sessions').insertOne({
    userId,
    tokenHash,
    csrfToken,
    createdAt: now,
    expiresAt,
  });

  setCookie(res, config.sessionCookieName, rawToken, {
    maxAge: config.sessionMaxAgeMs,
    secure: config.isProduction,
    httpOnly: true,
    sameSite: 'Lax',
  });

  return res.json(201, {
    user: {
      _id: userId.toString(),
      email: normalized,
      name: displayName,
      timezone: userTimezone,
      createdAt: now,
    },
    csrfToken,
  });
}

/**
 * Login user with email and password
 */
export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.error(400, 'Email and password are required');
  }

  const normalized = normalizeEmail(email);
  const db = getDb();

  const user = await db.collection('users').findOne({ email: normalized });
  if (!user || !user.passwordHash) {
    // Avoid account enumeration with generic error
    return res.error(401, 'Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return res.error(401, 'Invalid email or password');
  }

  // Create session
  const rawToken = generateToken(32);
  const csrfToken = generateToken(16);
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(Date.now() + config.sessionMaxAgeMs);

  await db.collection('sessions').insertOne({
    userId: user._id,
    tokenHash,
    csrfToken,
    createdAt: now,
    expiresAt,
  });

  setCookie(res, config.sessionCookieName, rawToken, {
    maxAge: config.sessionMaxAgeMs,
    secure: config.isProduction,
    httpOnly: true,
    sameSite: 'Lax',
  });

  return res.json(200, {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      timezone: user.timezone || 'UTC',
      createdAt: user.createdAt,
    },
    csrfToken,
  });
}

/**
 * Logout authenticated user
 */
export async function logout(req, res) {
  if (req.session) {
    try {
      const db = getDb();
      await db.collection('sessions').deleteOne({
        _id: new ObjectId(req.session._id),
      });
    } catch (err) {
      console.error('Logout error removing session:', err.message);
    }
  }

  clearCookie(res, config.sessionCookieName, {
    secure: config.isProduction,
    sameSite: 'Lax',
  });

  return res.json(200, { message: 'Logged out successfully' });
}

/**
 * Get current session user info and CSRF token
 */
export async function me(req, res) {
  if (!req.user || !req.session) {
    return res.json(200, { user: null, csrfToken: null });
  }

  return res.json(200, {
    user: req.user,
    csrfToken: req.session.csrfToken,
  });
}

/**
 * Google OAuth 2.0 / OpenID Connect authorization endpoint
 */
export async function googleAuth(req, res) {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.error(501, 'Google OAuth 2.0 is not configured. Please supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.');
  }

  const state = generateToken(16);
  const nonce = generateToken(16);

  // Store state and nonce in temporary cookie for validation in callback
  setCookie(res, 'oauth_state', state, { maxAge: 10 * 60 * 1000, httpOnly: true });

  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    access_type: 'online',
    prompt: 'select_account',
  });

  res.statusCode = 302;
  res.setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.end();
}

/**
 * Google OAuth callback endpoint
 */
export async function googleCallback(req, res) {
  const { code, state, error } = req.query || {};

  if (error) {
    return res.error(400, `Google authentication failed: ${error}`);
  }

  if (!code) {
    return res.error(400, 'Authorization code missing from Google callback');
  }

  // Validate state cookie
  const storedState = req.cookies.oauth_state;
  if (!storedState || storedState !== state) {
    return res.error(400, 'Invalid OAuth state parameter');
  }
  clearCookie(res, 'oauth_state');

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange error:', errBody);
      return res.error(400, 'Failed to exchange authorization code with Google');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile info
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoRes.ok) {
      return res.error(400, 'Failed to fetch user profile from Google');
    }

    const profile = await userinfoRes.json();
    if (!profile.email || !profile.email_verified) {
      return res.error(400, 'Google account must have a verified email address');
    }

    const normalizedEmail = normalizeEmail(profile.email);
    const db = getDb();
    const now = new Date();

    let user = await db.collection('users').findOne({ email: normalizedEmail });
    if (!user) {
      const insertResult = await db.collection('users').insertOne({
        email: normalizedEmail,
        name: profile.name || normalizedEmail.split('@')[0],
        googleId: profile.sub,
        avatar: profile.picture,
        timezone: 'UTC',
        authProvider: 'google',
        createdAt: now,
        updatedAt: now,
      });

      user = {
        _id: insertResult.insertedId,
        email: normalizedEmail,
        name: profile.name || normalizedEmail.split('@')[0],
      };

      // Add default categories
      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        ownerId: user._id.toString(),
        name: cat.name,
        color: cat.color,
        createdAt: now,
      }));
      await db.collection('categories').insertMany(categoriesToInsert);
    }

    // Create session
    const rawToken = generateToken(32);
    const csrfToken = generateToken(16);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + config.sessionMaxAgeMs);

    await db.collection('sessions').insertOne({
      userId: user._id,
      tokenHash,
      csrfToken,
      createdAt: now,
      expiresAt,
    });

    setCookie(res, config.sessionCookieName, rawToken, {
      maxAge: config.sessionMaxAgeMs,
      secure: config.isProduction,
      httpOnly: true,
      sameSite: 'Lax',
    });

    // Redirect to frontend dashboard
    res.statusCode = 302;
    res.setHeader('Location', `${config.clientUrl}/app/dashboard`);
    res.end();
  } catch (err) {
    console.error('Google callback error:', err);
    return res.error(500, 'Internal error during Google authentication');
  }
}
