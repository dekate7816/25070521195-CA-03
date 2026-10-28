import { sendJson, sendError } from '../utils/response.js';

/**
 * Lightweight, robust native router for node:http
 * Explicitly replaces Express without external dependencies.
 */
export class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  use(fn) {
    if (typeof fn === 'function') {
      this.middlewares.push(fn);
    }
    return this;
  }

  add(method, pattern, ...handlers) {
    const paramNames = [];
    // Convert /api/tasks/:id to regex and extract param names
    const regexPattern = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPattern}$`);
    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      regex,
      paramNames,
      handlers: handlers.flat(),
    });
    return this;
  }

  get(pattern, ...handlers) {
    return this.add('GET', pattern, ...handlers);
  }

  post(pattern, ...handlers) {
    return this.add('POST', pattern, ...handlers);
  }

  put(pattern, ...handlers) {
    return this.add('PUT', pattern, ...handlers);
  }

  patch(pattern, ...handlers) {
    return this.add('PATCH', pattern, ...handlers);
  }

  delete(pattern, ...handlers) {
    return this.add('DELETE', pattern, ...handlers);
  }

  options(pattern, ...handlers) {
    return this.add('OPTIONS', pattern, ...handlers);
  }

  parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
      rc.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const value = decodeURIComponent(parts.join('='));
        if (key) list[key] = value;
      });
    }
    return list;
  }

  match(method, pathname) {
    const normalizedMethod = method.toUpperCase();
    const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

    for (const route of this.routes) {
      if (route.method !== normalizedMethod) continue;
      const match = normalizedPath.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { route, params };
      }
    }
    return null;
  }

  async handle(req, res) {
    // Parse URL with standard WHATWG URL API
    const fullUrl = new URL(req.url, 'http://localhost');
    req.path = fullUrl.pathname || '/';
    
    // Parse query params into simple key-value object
    req.query = {};
    fullUrl.searchParams.forEach((val, key) => {
      req.query[key] = val;
    });

    req.params = {};
    req.cookies = this.parseCookies(req);

    // Decorate response object with convenience helpers
    res.json = (statusCode, data) => sendJson(res, statusCode, data);
    res.error = (statusCode, message, details = null) => sendError(res, statusCode, message, details);

    // Run global middlewares
    try {
      for (const middleware of this.middlewares) {
        let nextCalled = false;
        await middleware(req, res, () => {
          nextCalled = true;
        });
        if (res.writableEnded) return;
        if (!nextCalled) return; // Middleware halted execution
      }

      // Handle CORS preflight if not intercepted by middleware
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      // Match route
      const matched = this.match(req.method, req.path);
      if (!matched) {
        return res.error(404, `Route not found: ${req.method} ${req.path}`);
      }

      req.params = matched.params;

      // Run route handlers
      for (const handler of matched.route.handlers) {
        let nextCalled = false;
        await handler(req, res, () => {
          nextCalled = true;
        });
        if (res.writableEnded) return;
        if (!nextCalled) return;
      }
    } catch (err) {
      console.error('Unhandled request error:', err);
      if (!res.writableEnded) {
        res.error(500, 'Internal server error');
      }
    }
  }
}
