import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/common';
import { config } from '../config/app';
import { logger } from '../utils/logger';

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode || 500;
    errorCode = error.code || 'APP_ERROR';
    message = error.message || 'An application error occurred';
    details = error.details;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = (error as any).details || error.message;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'Resource already exists';
        details = {
          field: prismaError.meta?.target,
          value: prismaError.meta?.target,
        };
        break;
      case 'P2025':
        statusCode = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 400;
        errorCode = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Foreign key constraint violation';
        details = {
          field: prismaError.meta?.field_name,
        };
        break;
      default:
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }
  // Handle Multer errors
  else if (error.name === 'MulterError') {
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413;
        errorCode = 'FILE_TOO_LARGE';
        message = 'File size exceeds maximum allowed size';
        break;
      case 'LIMIT_FILE_COUNT':
        statusCode = 400;
        errorCode = 'TOO_MANY_FILES';
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400;
        errorCode = 'UNEXPECTED_FILE';
        message = 'Unexpected file field';
        break;
      default:
        statusCode = 400;
        errorCode = 'FILE_UPLOAD_ERROR';
        message = 'File upload failed';
    }
  }
  // Handle network errors
  else if (error.name === 'FetchError' || error.name === 'RequestError') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'External service unavailable';
  }

  // Log error details
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.get('X-Request-ID'),
    },
    response: {
      statusCode,
      errorCode,
      message,
    },
  };

  if (statusCode >= 500) {
    logger.error('Server error:', logData);
  } else {
    logger.warn('Client error:', logData);
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      ...(config.app.nodeEnv === 'development' && {
        stack: error.stack,
      }),
    },
    timestamp: new Date().toISOString(),
  };

  // Include request ID in response headers
  if (req.get('X-Request-ID')) {
    res.set('X-Request-ID', req.get('X-Request-ID'));
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class creator
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = 'CUSTOM_ERROR',
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
};

// Common error creators
export const badRequest = (message: string = 'Bad request', details?: any): AppError => {
  return createError(message, 400, 'BAD_REQUEST', details);
};

export const unauthorized = (message: string = 'Unauthorized', details?: any): AppError => {
  return createError(message, 401, 'UNAUTHORIZED', details);
};

export const forbidden = (message: string = 'Forbidden', details?: any): AppError => {
  return createError(message, 403, 'FORBIDDEN', details);
};

export const notFound = (message: string = 'Resource not found', details?: any): AppError => {
  return createError(message, 404, 'NOT_FOUND', details);
};

export const conflict = (message: string = 'Conflict', details?: any): AppError => {
  return createError(message, 409, 'CONFLICT', details);
};

export const tooManyRequests = (message: string = 'Too many requests', details?: any): AppError => {
  return createError(message, 429, 'TOO_MANY_REQUESTS', details);
};

export const internalServerError = (message: string = 'Internal server error', details?: any): AppError => {
  return createError(message, 500, 'INTERNAL_SERVER_ERROR', details);
};

export const serviceUnavailable = (message: string = 'Service unavailable', details?: any): AppError => {
  return createError(message, 503, 'SERVICE_UNAVAILABLE', details);
};

// Validation error creator
export const validationError = (message: string = 'Validation failed', details?: any): AppError => {
  return createError(message, 400, 'VALIDATION_ERROR', details);
};

// Authentication error creators
export const authenticationError = (message: string = 'Authentication failed', details?: any): AppError => {
  return createError(message, 401, 'AUTHENTICATION_ERROR', details);
};

export const tokenExpiredError = (message: string = 'Token expired', details?: any): AppError => {
  return createError(message, 401, 'TOKEN_EXPIRED', details);
};

export const invalidTokenError = (message: string = 'Invalid token', details?: any): AppError => {
  return createError(message, 401, 'INVALID_TOKEN', details);
};

// Authorization error creator
export const authorizationError = (message: string = 'Access denied', details?: any): AppError => {
  return createError(message, 403, 'AUTHORIZATION_ERROR', details);
};

// Resource error creators
export const resourceNotFoundError = (resourceType: string, details?: any): AppError => {
  return createError(`${resourceType} not found`, 404, 'RESOURCE_NOT_FOUND', details);
};

export const resourceExistsError = (resourceType: string, details?: any): AppError => {
  return createError(`${resourceType} already exists`, 409, 'RESOURCE_EXISTS', details);
};

// File upload error creators
export const fileUploadError = (message: string = 'File upload failed', details?: any): AppError => {
  return createError(message, 400, 'FILE_UPLOAD_ERROR', details);
};

export const fileTooLargeError = (maxSize: string): AppError => {
  return createError(`File size exceeds maximum allowed size of ${maxSize}`, 413, 'FILE_TOO_LARGE');
};

export const invalidFileTypeError = (allowedTypes: string[]): AppError => {
  return createError(
    `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    400,
    'INVALID_FILE_TYPE'
  );
};

// Database error creators
export const databaseError = (message: string = 'Database operation failed', details?: any): AppError => {
  return createError(message, 500, 'DATABASE_ERROR', details);
};

export const foreignKeyConstraintError = (field: string, details?: any): AppError => {
  return createError(
    `Foreign key constraint violation on field: ${field}`,
    400,
    'FOREIGN_KEY_CONSTRAINT',
    details
  );
};

// External service error creators
export const externalServiceError = (
  serviceName: string,
  message: string = 'External service error',
  details?: any
): AppError => {
  return createError(`${serviceName}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
};

export const externalServiceUnavailableError = (
  serviceName: string,
  details?: any
): AppError => {
  return createError(
    `${serviceName} service is unavailable`,
    503,
    'EXTERNAL_SERVICE_UNAVAILABLE',
    details
  );
};

// Rate limit error creator
export const rateLimitExceededError = (retryAfter?: number): AppError => {
  const error = createError(
    'Rate limit exceeded. Please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
  
  if (retryAfter) {
    error.details = { retryAfter };
  }
  
  return error;
};

// Business logic error creators
export const businessLogicError = (message: string, details?: any): AppError => {
  return createError(message, 400, 'BUSINESS_LOGIC_ERROR', details);
};

export const invalidStateError = (message: string = 'Invalid operation state', details?: any): AppError => {
  return createError(message, 400, 'INVALID_STATE', details);
};

export default errorHandler;