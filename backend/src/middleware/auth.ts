import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, AppError } from '../types/common';
import { verifyAccessToken, extractTokenFromHeader, logout } from '../utils/auth';
import { logger } from '../utils/logger';

// Authentication middleware
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      const error = new AppError('Access token is required') as Error;
      (error as AppError).statusCode = 401;
      (error as AppError).code = 'MISSING_TOKEN';
      throw error;
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Continue to next middleware
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        const appError = new AppError('Access token expired') as Error;
        (appError as AppError).statusCode = 401;
        (appError as AppError).code = 'TOKEN_EXPIRED';
        return next(appError);
      }
      
      if (error.name === 'JsonWebTokenError') {
        const appError = new AppError('Invalid access token') as Error;
        (appError as AppError).statusCode = 401;
        (appError as AppError).code = 'INVALID_TOKEN';
        return next(appError);
      }
    }
    
    next(error);
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      // Verify token
      const decoded = verifyAccessToken(token);
      
      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    // Continue to next middleware
    next();
  } catch (error) {
    // Log error but don't block the request
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

// Role-based authorization middleware factory
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        const error = new AppError('Authentication required') as Error;
        (error as AppError).statusCode = 401;
        (error as AppError).code = 'AUTHENTICATION_REQUIRED';
        return next(error);
      }

      // Convert single role to array
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Check if user has any of the required roles
      const hasRequiredRole = roles.some(role => req.user?.role === role);
      
      if (!hasRequiredRole) {
        const error = new AppError('Insufficient permissions') as Error;
        (error as AppError).statusCode = 403;
        (error as AppError).code = 'INSUFFICIENT_PERMISSIONS';
        return next(error);
      }

      // User has required role
      next();
    } catch (error) {
      logger.error('Role authorization failed:', error);
      next(error);
    }
  };
};

// Admin-only middleware
export const requireAdmin = requireRole('admin');

// Manager or admin middleware
export const requireManager = requireRole(['manager', 'admin']);

// Member or higher middleware
export const requireMember = requireRole(['member', 'manager', 'admin']);

// Resource owner or admin middleware
export const requireOwnerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        const error = new AppError('Authentication required') as Error;
        (error as AppError).statusCode = 401;
        (error as AppError).code = 'AUTHENTICATION_REQUIRED';
        return next(error);
      }

      // Check if user is admin (admin can access any resource)
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user is the owner of the resource
      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField] || req.query[resourceUserIdField];
      
      if (req.user.id !== resourceUserId) {
        const error = new AppError('Access denied: You can only access your own resources') as Error;
        (error as AppError).statusCode = 403;
        (error as AppError).code = 'ACCESS_DENIED';
        return next(error);
      }

      // User is the owner of the resource
      next();
    } catch (error) {
      logger.error('Owner authorization failed:', error);
      next(error);
    }
  };
};

// Workspace member middleware
export const requireWorkspaceMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      const error = new AppError('Authentication required') as Error;
      (error as AppError).statusCode = 401;
      (error as AppError).code = 'AUTHENTICATION_REQUIRED';
      return next(error);
    }

    // Check if user is admin (admin can access any workspace)
    if (req.user.role === 'admin') {
      return next();
    }

    // Get workspace ID from request
    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
    
    if (!workspaceId) {
      const error = new AppError('Workspace ID is required') as Error;
      (error as AppError).statusCode = 400;
      (error as AppError).code = 'WORKSPACE_ID_REQUIRED';
      return next(error);
    }

    // Check if user is a member of the workspace
    // This would typically involve a database query
    // For now, we'll assume the check passes
    // const isMember = await checkWorkspaceMembership(req.user.id, workspaceId);
    // if (!isMember) {
    //   const error = new AppError('Access denied: You are not a member of this workspace') as Error;
    //   (error as AppError).statusCode = 403;
    //   (error as AppError).code = 'NOT_WORKSPACE_MEMBER';
    //   return next(error);
    // }

    // User is a member of the workspace
    next();
  } catch (error) {
    logger.error('Workspace member authorization failed:', error);
    next(error);
  }
};

// Project member middleware
export const requireProjectMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      const error = new AppError('Authentication required') as Error;
      (error as AppError).statusCode = 401;
      (error as AppError).code = 'AUTHENTICATION_REQUIRED';
      return next(error);
    }

    // Check if user is admin (admin can access any project)
    if (req.user.role === 'admin') {
      return next();
    }

    // Get project ID from request
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    
    if (!projectId) {
      const error = new AppError('Project ID is required') as Error;
      (error as AppError).statusCode = 400;
      (error as AppError).code = 'PROJECT_ID_REQUIRED';
      return next(error);
    }

    // Check if user is a member of the project
    // This would typically involve a database query
    // For now, we'll assume the check passes
    // const isMember = await checkProjectMembership(req.user.id, projectId);
    // if (!isMember) {
    //   const error = new AppError('Access denied: You are not a member of this project') as Error;
    //   (error as AppError).statusCode = 403;
    //   (error as AppError).code = 'NOT_PROJECT_MEMBER';
    //   return next(error);
    // }

    // User is a member of the project
    next();
  } catch (error) {
    logger.error('Project member authorization failed:', error);
    next(error);
  }
};

// Rate limiting middleware for authentication
export const authRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (!ip) {
      return next();
    }

    // Check rate limit
    const { checkAuthRateLimit } = await import('../utils/auth');
    const { allowed, remainingAttempts, resetTime } = checkAuthRateLimit(ip as string);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': remainingAttempts.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
    });

    if (!allowed) {
      const error = new AppError('Too many authentication attempts. Please try again later.') as Error;
      (error as AppError).statusCode = 429;
      (error as AppError).code = 'TOO_MANY_ATTEMPTS';
      return next(error);
    }

    next();
  } catch (error) {
    logger.error('Auth rate limit middleware failed:', error);
    next();
  }
};

// Token blacklist middleware
export const tokenBlacklistMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return next();
    }

    // Check if token is blacklisted
    // This would typically involve checking a cache or database
    // For now, we'll assume the check passes
    // const isBlacklisted = await checkTokenBlacklist(req.headers.authorization);
    // if (isBlacklisted) {
    //   // Logout user
    //   await logout(req.user.id);
    //   
    //   const error = new AppError('Token has been invalidated') as Error;
    //   (error as AppError).statusCode = 401;
    //   (error as AppError).code = 'TOKEN_BLACKLISTED';
    //   return next(error);
    // }

    next();
  } catch (error) {
    logger.error('Token blacklist middleware failed:', error);
    next();
  }
};

// Refresh token middleware
export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      const error = new AppError('Refresh token is required') as Error;
      (error as AppError).statusCode = 400;
      (error as AppError).code = 'REFRESH_TOKEN_REQUIRED';
      return next(error);
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/auth');
    const decoded = verifyRefreshToken(refreshToken);
    
    // Attach user info to request
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        const appError = new AppError('Refresh token expired') as Error;
        (appError as AppError).statusCode = 401;
        (appError as AppError).code = 'REFRESH_TOKEN_EXPIRED';
        return next(appError);
      }
      
      if (error.name === 'JsonWebTokenError') {
        const appError = new AppError('Invalid refresh token') as Error;
        (appError as AppError).statusCode = 401;
        (appError as AppError).code = 'INVALID_REFRESH_TOKEN';
        return next(appError);
      }
    }
    
    next(error);
  }
};