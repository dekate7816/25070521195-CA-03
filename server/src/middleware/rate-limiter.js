import { config } from '../config/index.js';

const attempts = new Map();

/**
 * Clean up old rate limit entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now - record.startTime > config.rateLimitWindowMs) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function loginRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const key = `login:${ip}`;
  const now = Date.now();

  let record = attempts.get(key);
  if (!record || now - record.startTime > config.rateLimitWindowMs) {
    record = { count: 1, startTime: now };
    attempts.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > config.rateLimitMaxAttempts) {
    const retryAfterSec = Math.ceil((record.startTime + config.rateLimitWindowMs - now) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    return res.error(429, 'Too many login attempts. Please try again later.');
  }

  next();
}
