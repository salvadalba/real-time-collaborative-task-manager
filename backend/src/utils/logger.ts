import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/app';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports only in production
if (config.app.nodeEnv === 'production') {
  // Daily rotate file transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.filePath}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );

  // Daily rotate file transport for error logs
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.filePath}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

const logError = (message: string, error?: Error | any) => {
  if (error instanceof Error) {
    logger.error(message, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    logger.error(message, error);
  }
};

const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

// Request logging helper
const logRequest = (req: any, res: any, responseTime?: number) => {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;
  
  const logData = {
    method,
    url,
    statusCode,
    ip,
    userAgent: headers['user-agent'],
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    contentLength: res.get('content-length'),
  };

  if (statusCode >= 400) {
    logError(`HTTP ${method} ${url} ${statusCode}`, logData);
  } else {
    logHttp(`HTTP ${method} ${url} ${statusCode}`, logData);
  }
};

// Database logging helper
const logDatabase = (operation: string, table: string, duration?: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
  };

  if (error) {
    logError(`Database ${operation} on ${table} failed`, { ...logData, error: error.message });
  } else {
    logInfo(`Database ${operation} on ${table} completed`, logData);
  }
};

// Socket.io logging helper
const logSocket = (event: string, socketId: string, userId?: string, data?: any) => {
  const logData = {
    event,
    socketId,
    userId,
    data: data ? JSON.stringify(data) : undefined,
  };

  logInfo(`Socket event: ${event}`, logData);
};

// External API logging helper
const logExternalApi = (service: string, operation: string, duration?: number, error?: Error) => {
  const logData = {
    service,
    operation,
    duration: duration ? `${duration}ms` : undefined,
  };

  if (error) {
    logError(`External API ${service} ${operation} failed`, { ...logData, error: error.message });
  } else {
    logInfo(`External API ${service} ${operation} completed`, logData);
  }
};

// Security logging helper
const logSecurity = (event: string, details: any) => {
  logWarn(`Security event: ${event}`, details);
};

// Performance logging helper
const logPerformance = (operation: string, duration: number, details?: any) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...details,
  };

  if (duration > 1000) {
    logWarn(`Slow operation: ${operation}`, logData);
  } else {
    logDebug(`Performance: ${operation}`, logData);
  }
};

// Business logic logging helper
const logBusiness = (event: string, entityType: string, entityId: string, userId?: string, details?: any) => {
  const logData = {
    event,
    entityType,
    entityId,
    userId,
    ...details,
  };

  logInfo(`Business event: ${event} on ${entityType} ${entityId}`, logData);
};

// Export the logger and helper methods
export {
  logger,
  stream,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
  logRequest,
  logDatabase,
  logSocket,
  logExternalApi,
  logSecurity,
  logPerformance,
  logBusiness,
};

export default logger;