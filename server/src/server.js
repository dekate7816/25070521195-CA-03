import http from 'node:http';
import { config } from './config/index.js';
import { connectDb, closeDb, initIndexes } from './db/mongo.js';
import { createApp } from './app.js';

async function startServer() {
  console.log(`[Looply] Initializing backend server on port ${config.port}...`);
  console.log(`[Looply] Environment: ${config.nodeEnv}`);

  // Connect to MongoDB
  try {
    await connectDb();
    console.log('[Looply] MongoDB connected successfully.');
    await initIndexes();
    console.log('[Looply] Database indexes verified and initialized.');
  } catch (err) {
    console.error('[Looply] MongoDB connection failed:', err.message);
    console.error('[Looply] Please verify MONGODB_URI and IP whitelist in Atlas or local MongoDB service.');
  }

  const { requestListener } = createApp();
  const server = http.createServer(requestListener);

  server.listen(config.port, () => {
    console.log(`[Looply] Server running at http://localhost:${config.port}`);
    console.log(`[Looply] CORS enabled for ${config.clientUrl}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Looply] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Looply] HTTP server closed.');
      try {
        await closeDb();
        console.log('[Looply] MongoDB connection closed.');
      } catch (err) {
        console.error('[Looply] Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      console.error('[Looply] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('[Looply] Fatal error starting server:', err);
  process.exit(1);
});
