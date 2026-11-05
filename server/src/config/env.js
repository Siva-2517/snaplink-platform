/**
 * Environment configuration validator for SnapLink backend.
 * Validates critical environment variables on startup and enforces production security.
 */

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];

  if (!process.env.MONGODB_URI) {
    if (isProduction) {
      missing.push('MONGODB_URI');
    } else {
      console.warn('⚠️  MONGODB_URI not provided. Defaulting to local mongodb://127.0.0.1:27017/url_shortener');
    }
  }

  const jwtSecret = process.env.JWT_SECRET;
  const INSECURE_FALLBACKS = [
    'developer-glowing-secret-key-for-local-use',
    'secret',
    'changeme',
    'your_jwt_secret_here'
  ];

  if (!jwtSecret) {
    if (isProduction) {
      missing.push('JWT_SECRET');
    } else {
      console.warn('⚠️  JWT_SECRET not set. Using local development fallback key.');
    }
  } else if (isProduction && INSECURE_FALLBACKS.includes(jwtSecret)) {
    throw new Error('❌ FATAL: JWT_SECRET must be set to a secure, unpredictable key in production.');
  }

  if (isProduction && !process.env.CLIENT_URL) {
    missing.push('CLIENT_URL');
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ FATAL: Missing required production environment variables: ${missing.join(', ')}`
    );
  }

  return {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener',
    JWT_SECRET: process.env.JWT_SECRET || 'developer-glowing-secret-key-for-local-use',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  };
};

module.exports = { validateEnv };

