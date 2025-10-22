import dotenv from 'dotenv';
import { AppConfig, DatabaseConfig, RedisConfig, JwtConfig, AwsConfig, EmailConfig, LoggingConfig } from '../types/common';

// Load environment variables
dotenv.config();

// App configuration
export const appConfig: AppConfig = {
  name: process.env.APP_NAME || 'TaskManager',
  url: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip').split(','),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
};

// Database configuration
export const databaseConfig: DatabaseConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'taskmanager',
  username: process.env.DATABASE_USER || 'username',
  password: process.env.DATABASE_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production',
  url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/taskmanager',
};

// Redis configuration
export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// JWT configuration
export const jwtConfig: JwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// AWS configuration
export const awsConfig: AwsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || 'us-east-1',
  s3Bucket: process.env.AWS_S3_BUCKET || 'taskmanager-files',
};

// Email configuration
export const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.EMAIL_FROM || 'noreply@taskmanager.com',
  fromName: process.env.EMAIL_FROM_NAME || 'TaskManager',
};

// Logging configuration
export const loggingConfig: LoggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  filePath: process.env.LOG_FILE_PATH || 'logs',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
};

// External API configuration
export const externalApiConfig = {
  toggl: {
    apiKey: process.env.TOGGL_API_KEY || '',
    baseUrl: 'https://api.track.toggl.com/api/v8',
  },
  harvest: {
    accessToken: process.env.HARVEST_ACCESS_TOKEN || '',
    accountId: process.env.HARVEST_ACCOUNT_ID || '',
    baseUrl: 'https://api.harvestapp.com/v2',
  },
};

// Development configuration
export const devConfig = {
  debug: process.env.DEBUG || 'taskmanager:*',
  enableSwagger: appConfig.swaggerEnabled,
  enableHealthCheck: true,
  enableMetrics: process.env.NODE_ENV === 'production',
};

// Production configuration
export const prodConfig = {
  enableRateLimiting: true,
  enableCompression: true,
  enableHelmet: true,
  enableCors: true,
  enableMorgan: true,
  enableSentry: !!process.env.SENTRY_DSN,
  sentryDsn: process.env.SENTRY_DSN || '',
};

// Configuration validation
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Validate JWT secrets
  if (jwtConfig.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (jwtConfig.refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  // Validate AWS configuration for production
  if (appConfig.nodeEnv === 'production') {
    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      throw new Error('AWS credentials are required in production');
    }

    if (!awsConfig.s3Bucket) {
      throw new Error('AWS S3 bucket name is required in production');
    }
  }
};

// Export all configurations
export const config = {
  app: appConfig,
  database: databaseConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  aws: awsConfig,
  email: emailConfig,
  logging: loggingConfig,
  externalApi: externalApiConfig,
  dev: devConfig,
  prod: prodConfig,
};

export default config;