import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './config/app';
import { logger } from './utils/logger';
import { connectDatabase } from './database/connection';
import { connectRedis } from './database/redis';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { setupSocketHandlers } from './socket/socketHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import workspaceRoutes from './routes/workspaces';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import attachmentRoutes from './routes/attachments';
import timeEntryRoutes from './routes/timeEntries';
import activityRoutes from './routes/activities';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import integrationRoutes from './routes/integrations';

// Import Swagger documentation
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.app.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    if (config.prod.enableHelmet) {
      this.app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }));
    }

    // CORS middleware
    if (config.prod.enableCors) {
      this.app.use(cors({
        origin: config.app.corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }));
    }

    // Compression middleware
    if (config.prod.enableCompression) {
      this.app.use(compression());
    }

    // Request logging
    if (config.prod.enableMorgan) {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    if (config.prod.enableRateLimiting) {
      this.app.use(rateLimiter);
    }

    // Health check endpoint (before auth middleware)
    this.app.get('/health', this.healthCheck.bind(this));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || this.generateRequestId();
      res.setHeader('x-request-id', req.headers['x-request-id']);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/workspaces', authMiddleware, workspaceRoutes);
    this.app.use('/api/projects', authMiddleware, projectRoutes);
    this.app.use('/api/tasks', authMiddleware, taskRoutes);
    this.app.use('/api/comments', authMiddleware, commentRoutes);
    this.app.use('/api/attachments', authMiddleware, attachmentRoutes);
    this.app.use('/api/time-entries', authMiddleware, timeEntryRoutes);
    this.app.use('/api/activities', authMiddleware, activityRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/search', authMiddleware, searchRoutes);
    this.app.use('/api/notifications', authMiddleware, notificationRoutes);
    this.app.use('/api/integrations', authMiddleware, integrationRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: `Welcome to ${config.app.name} API`,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeSwagger(): void {
    if (!config.dev.enableSwagger) return;

    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: config.app.name,
          version: '1.0.0',
          description: 'Real-time collaborative task manager API',
          contact: {
            name: 'API Support',
            email: 'support@taskmanager.com',
          },
        },
        servers: [
          {
            url: config.app.url,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: `${config.app.name} API Documentation`,
    }));
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeSocket(): void {
    setupSocketHandlers(this.io);
  }

  private healthCheck(req: express.Request, res: express.Response): void {
    const health = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        database: 'unknown' as const,
        redis: 'unknown' as const,
        socketio: this.io.engine.clientsCount > 0 ? 'running' : 'idle',
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100 * 100) / 100,
      },
    };

    // Check database connection
    this.checkDatabaseHealth()
      .then(isConnected => {
        health.services.database = isConnected ? 'connected' : 'disconnected';
      })
      .catch(() => {
        health.services.database = 'disconnected';
      });

    // Check Redis connection
    this.checkRedisHealth()
      .then(isConnected => {
        health.services.redis = isConnected ? 'connected' : 'disconnected';
      })
      .catch(() => {
        health.services.redis = 'disconnected';
      });

    // Determine overall health
    const isHealthy = Object.values(health.services).every(
      service => service === 'connected' || service === 'running' || service === 'idle'
    );

    if (!isHealthy) {
      health.status = 'unhealthy';
      return res.status(503).json(health);
    }

    res.status(200).json(health);
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // This would be implemented with your database client
      // For now, we'll just return true
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      // This would be implemented with your Redis client
      // For now, we'll just return true
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      this.validateConfiguration();

      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Connect to Redis
      await connectRedis();
      logger.info('Redis connected successfully');

      // Start server
      this.server.listen(config.app.port, config.app.host, () => {
        logger.info(`Server running on ${config.app.host}:${config.app.port}`);
        logger.info(`Environment: ${config.app.nodeEnv}`);
        
        if (config.dev.enableSwagger) {
          logger.info(`Swagger documentation available at http://${config.app.host}:${config.app.port}/api-docs`);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private validateConfiguration(): void {
    const requiredConfig = [
      'database.url',
      'jwt.secret',
      'jwt.refreshSecret',
    ];

    for (const configPath of requiredConfig) {
      const value = configPath.split('.').reduce((obj, key) => obj?.[key], config);
      if (!value) {
        throw new Error(`Missing required configuration: ${configPath}`);
      }
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      this.server.close(() => {
        logger.info('HTTP server closed');
        
        // Close Socket.IO
        this.io.close(() => {
          logger.info('Socket.IO server closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

export default App;