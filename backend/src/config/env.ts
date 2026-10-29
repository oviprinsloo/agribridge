import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Production safety check: warn or throw if insecure default JWT secret is used in production
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev'))) {
  console.warn('⚠️ WARNING: Using a development or default JWT_SECRET in production is insecure. Set a high-entropy JWT_SECRET in production environment variables.');
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'agribridge_super_secure_jwt_secret_key_2026_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'MOCK',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
};
