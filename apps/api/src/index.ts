import 'dotenv/config';
import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDatabase();
    logger.info('✅ Database connected');

    await connectRedis();
    try {
      await connectRedis();
      logger.info('✅ Redis connected');
    } catch {
      logger.warn('⚠️ Redis not available — queues disabled (install Redis to enable)');
    }

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`✅ Frely API running → http://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down`);
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
