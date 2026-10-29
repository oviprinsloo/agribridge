import app from './app';
import { ENV } from './config/env';
import prisma from './config/database';

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to AgriBridge Database successfully.');

    const server = app.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`🚀 AgriBridge Server running on http://0.0.0.0:${ENV.PORT}`);
      console.log(`🌐 Environment: ${ENV.NODE_ENV}`);
      console.log(`📦 Payment Provider: ${ENV.PAYMENT_PROVIDER}`);
      console.log(`🤖 AI Engine: ${ENV.GEMINI_API_KEY ? 'Google Gemini Live' : 'Deterministic Grounded Engine'}`);
    });

    const shutdown = async () => {
      console.log('Stopping server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Exited.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start AgriBridge server:', error);
    process.exit(1);
  }
}

startServer();
