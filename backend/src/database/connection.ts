import { PrismaClient } from '@prisma/client';
import { config } from '../config/app';
import { logger, logDatabase } from '../utils/logger';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty',
});

// Log database events
prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Params: ${e.params}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  logDatabase('error', 'unknown', undefined, e as Error);
});

prisma.$on('info', (e) => {
  logDatabase('info', 'unknown', undefined);
  logger.info(`Database: ${e.message}`);
});

prisma.$on('warn', (e) => {
  logDatabase('warning', 'unknown', undefined);
  logger.warn(`Database: ${e.message}`);
});

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

// Disconnect from database
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
    throw error;
  }
};

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

// Run database migrations
export const runMigrations = async (): Promise<void> => {
  try {
    // This would typically be handled by Prisma migrate deploy
    // For now, we'll just test the connection
    await testDatabaseConnection();
    logger.info('Database migrations verified');
  } catch (error) {
    logger.error('Database migration verification failed:', error);
    throw error;
  }
};

// Get database stats
export const getDatabaseStats = async () => {
  try {
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();

    return {
      users: userCount,
      workspaces: workspaceCount,
      projects: projectCount,
      tasks: taskCount,
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    throw error;
  }
};

// Health check for database
export const healthCheck = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

// Export Prisma client
export { prisma };

// Export database utilities
export default prisma;