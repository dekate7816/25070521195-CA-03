import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env or fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Database
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/looply_app',
  dbName: process.env.DB_NAME || 'looply_app',
  
  // Client URL for CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Session Configuration
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'looply_session',
  sessionMaxAgeMs: parseInt(process.env.SESSION_MAX_AGE_DAYS || '14', 10) * 24 * 60 * 60 * 1000,
  
  // Google OAuth 2.0 / OpenID Connect
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  
  // Security limits
  maxBodySizeBytes: 1024 * 1024, // 1MB
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxAttempts: 10, // 10 login attempts per window
};
