import { Router } from './router/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { bodyParserMiddleware } from './middleware/body-parser.js';
import { sessionMiddleware, requireAuth } from './middleware/session.js';
import { csrfMiddleware } from './middleware/csrf.js';
import { loginRateLimiter } from './middleware/rate-limiter.js';

import * as authController from './controllers/auth.controller.js';
import * as taskController from './controllers/task.controller.js';
import * as habitController from './controllers/habit.controller.js';
import * as categoryController from './controllers/category.controller.js';
import * as dashboardController from './controllers/dashboard.controller.js';
import * as insightsController from './controllers/insights.controller.js';
import * as profileController from './controllers/profile.controller.js';

export function createApp() {
  const router = new Router();

  // Global Middlewares
  router.use(corsMiddleware);
  router.use(bodyParserMiddleware);
  router.use(sessionMiddleware);
  router.use(csrfMiddleware);

  // Health check endpoint
  router.get('/api/health', (req, res) => {
    res.json(200, {
      status: 'ok',
      service: 'looply-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth Routes
  router.post('/api/auth/register', loginRateLimiter, authController.register);
  router.post('/api/auth/login', loginRateLimiter, authController.login);
  router.post('/api/auth/logout', authController.logout);
  router.get('/api/auth/me', authController.me);
  router.get('/api/auth/google', authController.googleAuth);
  router.get('/api/auth/google/callback', authController.googleCallback);

  // Dashboard & Insights
  router.get('/api/dashboard/summary', requireAuth, dashboardController.getDashboardSummary);
  router.get('/api/insights/tasks', requireAuth, insightsController.getTaskInsights);
  router.get('/api/insights/habits', requireAuth, insightsController.getHabitInsights);

  // Tasks Routes
  router.get('/api/tasks', requireAuth, taskController.getTasks);
  router.post('/api/tasks', requireAuth, taskController.createTask);
  router.get('/api/tasks/:id', requireAuth, taskController.getTaskById);
  router.patch('/api/tasks/:id', requireAuth, taskController.updateTask);
  router.delete('/api/tasks/:id', requireAuth, taskController.deleteTask);

  // Habits Routes
  router.get('/api/habits', requireAuth, habitController.getHabits);
  router.post('/api/habits', requireAuth, habitController.createHabit);
  router.get('/api/habits/:id', requireAuth, habitController.getHabitById);
  router.patch('/api/habits/:id', requireAuth, habitController.updateHabit);
  router.delete('/api/habits/:id', requireAuth, habitController.deleteHabit);
  router.get('/api/habits/:id/completions', requireAuth, habitController.getHabitCompletions);
  router.put('/api/habits/:id/completions/:date', requireAuth, habitController.recordCompletion);
  router.delete('/api/habits/:id/completions/:date', requireAuth, habitController.removeCompletion);

  // Categories Routes
  router.get('/api/categories', requireAuth, categoryController.getCategories);
  router.post('/api/categories', requireAuth, categoryController.createCategory);
  router.patch('/api/categories/:id', requireAuth, categoryController.updateCategory);
  router.delete('/api/categories/:id', requireAuth, categoryController.deleteCategory);

  // Profile Routes
  router.get('/api/profile', requireAuth, profileController.getProfile);
  router.patch('/api/profile', requireAuth, profileController.updateProfile);

  return {
    router,
    requestListener: (req, res) => router.handle(req, res),
  };
}
