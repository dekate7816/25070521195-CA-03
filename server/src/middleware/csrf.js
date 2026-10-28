const EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/google/callback',
]);

export function csrfMiddleware(req, res, next) {
  // Only check state-changing requests
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isStateChanging) {
    return next();
  }

  // Exempt public auth paths
  if (EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  // If request is authenticated via session cookie, enforce CSRF
  if (req.user && req.session) {
    const clientCsrfToken = req.headers['x-csrf-token'];
    if (!clientCsrfToken || clientCsrfToken !== req.session.csrfToken) {
      return res.error(403, 'Invalid or missing CSRF token');
    }
  }

  next();
}
