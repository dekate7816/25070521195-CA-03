/**
 * Uniform response and cookie helpers for native node:http
 */

export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

export function sendJson(res, statusCode, data) {
  setSecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function sendError(res, statusCode, message, details = null) {
  const payload = {
    error: {
      status: statusCode,
      message,
    },
  };
  if (details) {
    payload.error.details = details;
  }
  sendJson(res, statusCode, payload);
}

export function setCookie(res, name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  
  if (options.maxAge != null) {
    parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  }
  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  if (options.secure) {
    parts.push('Secure');
  }
  
  const sameSite = options.sameSite || 'Lax';
  parts.push(`SameSite=${sameSite}`);
  
  const path = options.path || '/';
  parts.push(`Path=${path}`);

  const cookieHeader = parts.join('; ');
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieHeader);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieHeader]);
  } else {
    res.setHeader('Set-Cookie', [existing, cookieHeader]);
  }
}

export function clearCookie(res, name, options = {}) {
  setCookie(res, name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}
