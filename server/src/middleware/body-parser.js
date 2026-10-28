import { config } from '../config/index.js';

export function bodyParserMiddleware(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    req.body = {};
    return next();
  }

  let totalSize = 0;
  const chunks = [];

  req.on('data', chunk => {
    totalSize += chunk.length;
    if (totalSize > config.maxBodySizeBytes) {
      req.destroy();
      return res.error(413, 'Request payload too large (max 1MB)');
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (res.writableEnded) return;

    if (chunks.length === 0) {
      req.body = {};
      return next();
    }

    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) {
      req.body = {};
      return next();
    }

    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        req.body = JSON.parse(raw);
        next();
      } catch (err) {
        return res.error(400, 'Malformed JSON in request body');
      }
    } else {
      req.body = { raw };
      next();
    }
  });

  req.on('error', err => {
    console.error('Error reading request stream:', err);
    if (!res.writableEnded) {
      res.error(400, 'Error reading request stream');
    }
  });
}
