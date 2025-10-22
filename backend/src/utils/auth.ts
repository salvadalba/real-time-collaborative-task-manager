import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/app';
import { JwtPayload, RoleType } from '../types/common';
import { logger } from './logger';
import { cacheUtils } from '../database/redis';

// Generate JWT access token
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.app.name,
      audience: config.app.name,
    });
  } catch (error) {
    logger.error('Failed to generate access token:', error);
    throw new Error('Token generation failed');
  }
};

// Generate JWT refresh token
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.app.name,
      audience: config.app.name,
    });
  } catch (error) {
    logger.error('Failed to generate refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
};

// Verify JWT access token
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.app.name,
      audience: config.app.name,
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    logger.error('Failed to verify access token:', error);
    throw new Error('Invalid or expired token');
  }
};

// Verify JWT refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.app.name,
      audience: config.app.name,
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    logger.error('Failed to verify refresh token:', error);
    throw new Error('Invalid or expired refresh token');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(config.app.bcryptRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Failed to hash password:', error);
    throw new Error('Password hashing failed');
  }
};

// Compare password with hash
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Failed to compare password:', error);
    throw new Error('Password comparison failed');
  }
};

// Generate random token
export const generateRandomToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create token pair (access + refresh)
export const createTokenPair = (userId: string, email: string, role: RoleType) => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId,
    email,
    role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
  };
};

// Store refresh token in cache
export const storeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  try {
    const key = `refresh_token:${userId}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await cacheUtils.cacheUserSession(key, { token: refreshToken }, ttl);
  } catch (error) {
    logger.error('Failed to store refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
};

// Get stored refresh token
export const getStoredRefreshToken = async (userId: string): Promise<string | null> => {
  try {
    const key = `refresh_token:${userId}`;
    const sessionData = await cacheUtils.getUserSession(key);
    return sessionData?.token || null;
  } catch (error) {
    logger.error('Failed to get stored refresh token:', error);
    return null;
  }
};

// Remove stored refresh token
export const removeStoredRefreshToken = async (userId: string): Promise<void> => {
  try {
    const key = `refresh_token:${userId}`;
    await cacheUtils.deleteUserSession(key);
  } catch (error) {
    logger.error('Failed to remove stored refresh token:', error);
    throw new Error('Failed to remove refresh token');
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Validate password strength
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate email format
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

// Check if user has required role
export const hasRole = (userRole: RoleType, requiredRole: RoleType): boolean => {
  const roleHierarchy: Record<RoleType, number> = {
    viewer: 1,
    member: 2,
    manager: 3,
    admin: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Check if user has any of the required roles
export const hasAnyRole = (userRole: RoleType, requiredRoles: RoleType[]): boolean => {
  return requiredRoles.some(role => hasRole(userRole, role));
};

// Generate password reset token
export const generatePasswordResetToken = (userId: string): string => {
  const payload = {
    userId,
    type: 'password_reset',
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
    issuer: config.app.name,
    audience: config.app.name,
  });
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): { userId: string; type: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.app.name,
      audience: config.app.name,
    }) as any;

    return {
      userId: decoded.userId,
      type: decoded.type,
    };
  } catch (error) {
    logger.error('Failed to verify password reset token:', error);
    throw new Error('Invalid or expired password reset token');
  }
};

// Generate email verification token
export const generateEmailVerificationToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '24h',
    issuer: config.app.name,
    audience: config.app.name,
  });
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): { userId: string; email: string; type: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.app.name,
      audience: config.app.name,
    }) as any;

    return {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };
  } catch (error) {
    logger.error('Failed to verify email verification token:', error);
    throw new Error('Invalid or expired email verification token');
  }
};

// Token refresh utility
export const refreshTokens = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get stored refresh token for user
    const storedToken = await getStoredRefreshToken(decoded.userId);
    
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = createTokenPair(decoded.userId, decoded.email, decoded.role);
    
    // Store new refresh token
    await storeRefreshToken(decoded.userId, tokens.refreshToken);
    
    return tokens;
  } catch (error) {
    logger.error('Failed to refresh tokens:', error);
    throw new Error('Token refresh failed');
  }
};

// Logout utility
export const logout = async (userId: string): Promise<void> => {
  try {
    // Remove stored refresh token
    await removeStoredRefreshToken(userId);
    
    // Invalidate any cached user sessions
    await cacheUtils.deleteUserSession(userId);
    
    logger.info(`User ${userId} logged out successfully`);
  } catch (error) {
    logger.error('Failed to logout user:', error);
    throw new Error('Logout failed');
  }
};

// Rate limiting for authentication attempts
export const authRateLimit = new Map<string, { count: number; lastAttempt: number }>();

export const checkAuthRateLimit = (
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } => {
  const now = Date.now();
  const record = authRateLimit.get(identifier);

  if (!record || now - record.lastAttempt > windowMs) {
    // First attempt or window expired
    authRateLimit.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    // Rate limit exceeded
    const resetTime = record.lastAttempt + windowMs;
    return { allowed: false, remainingAttempts: 0, resetTime };
  }

  // Increment counter
  record.count++;
  record.lastAttempt = now;
  authRateLimit.set(identifier, record);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - record.count,
    resetTime: record.lastAttempt + windowMs,
  };
};

// Clean up expired rate limit records
export const cleanupRateLimitRecords = (): void => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  for (const [key, record] of authRateLimit.entries()) {
    if (now - record.lastAttempt > windowMs) {
      authRateLimit.delete(key);
    }
  }
};

// Schedule cleanup of rate limit records
setInterval(cleanupRateLimitRecords, 5 * 60 * 1000); // Every 5 minutes