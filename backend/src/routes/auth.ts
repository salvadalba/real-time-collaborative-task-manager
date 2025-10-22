import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../database/connection';
import { 
  hashPassword, 
  comparePassword, 
  createTokenPair, 
  storeRefreshToken, 
  refreshTokens, 
  logout, 
  validatePasswordStrength, 
  validateEmail,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken
} from '../utils/auth';
import { asyncHandler, createError, badRequest, unauthorized, notFound } from '../middleware/errorHandler';
import { authRateLimitMiddleware, refreshTokenMiddleware } from '../middleware/auth';
import { logger, logSecurity } from '../utils/logger';

const router = Router();

// Register validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
];

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Refresh token validation rules
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

// Password reset validation rules
const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

// Email verification validation rules
const emailVerificationValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
];

// Register new user
router.post('/register', authRateLimitMiddleware, registerValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest('Validation failed', errors.array());
  }

  const { email, password, firstName, lastName } = req.body;

  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return badRequest(emailValidation.error || 'Invalid email format');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return badRequest('Password does not meet security requirements', passwordValidation.errors);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logSecurity('registration_attempt_with_existing_email', { email });
    return badRequest('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'member', // Default role for new users
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = createTokenPair(user.id, user.email, user.role);

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  // Log registration
  logSecurity('user_registered', { userId: user.id, email: user.email });

  // Return user data and tokens
  res.status(201).json({
    success: true,
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    },
    message: 'User registered successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Login user
router.post('/login', authRateLimitMiddleware, loginValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logSecurity('login_attempt_with_nonexistent_email', { email });
    return unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    logSecurity('login_attempt_with_inactive_account', { userId: user.id, email });
    return unauthorized('Account is inactive');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logSecurity('login_attempt_with_invalid_password', { userId: user.id, email });
    return unauthorized('Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = createTokenPair(user.id, user.email, user.role);

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  // Log successful login
  logSecurity('user_logged_in', { userId: user.id, email });

  // Return user data and tokens
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
    message: 'Login successful',
    timestamp: new Date().toISOString(),
  });
}));

// Refresh access token
router.post('/refresh', refreshTokenValidation, refreshTokenMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest('Validation failed', errors.array());
  }

  const { refreshToken } = req.body;
  const user = (req as any).user;

  // Generate new tokens
  const tokens = await refreshTokens(refreshToken);

  // Log token refresh
  logSecurity('token_refreshed', { userId: user.id });

  // Return new tokens
  res.json({
    success: true,
    data: {
      tokens,
    },
    message: 'Tokens refreshed successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Logout user
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return badRequest('Refresh token is required');
  }

  // Verify refresh token to get user ID
  try {
    const { verifyRefreshToken } = await import('../utils/auth');
    const decoded = verifyRefreshToken(refreshToken);
    
    // Logout user
    await logout(decoded.userId);

    // Log logout
    logSecurity('user_logged_out', { userId: decoded.userId });

    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Still return success for logout to prevent token enumeration attacks
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Request password reset
router.post('/forgot-password', authRateLimitMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return badRequest('Email is required');
  }

  // Validate email format
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return badRequest(emailValidation.error || 'Invalid email format');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration attacks
  if (!user) {
    logSecurity('password_reset_requested_for_nonexistent_email', { email });
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      timestamp: new Date().toISOString(),
    });
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken(user.id);

  // Store reset token (in a real implementation, this would be stored in the database with an expiration)
  // For now, we'll just log it
  logger.info(`Password reset token for ${user.email}: ${resetToken}`);

  // Send password reset email (in a real implementation, this would send an email)
  // await sendPasswordResetEmail(user.email, resetToken);

  // Log password reset request
  logSecurity('password_reset_requested', { userId: user.id, email });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent',
    timestamp: new Date().toISOString(),
  });
}));

// Reset password
router.post('/reset-password', passwordResetValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest('Validation failed', errors.array());
  }

  const { token, password } = req.body;

  // Verify reset token
  const { userId } = verifyPasswordResetToken(token);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return notFound('User not found');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return badRequest('Password does not meet security requirements', passwordValidation.errors);
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  // Invalidate all refresh tokens for this user
  await logout(userId);

  // Log password reset
  logSecurity('password_reset_completed', { userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Password reset successful',
    timestamp: new Date().toISOString(),
  });
}));

// Verify email
router.post('/verify-email', emailVerificationValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest('Validation failed', errors.array());
  }

  const { token } = req.body;

  // Verify email token
  const { userId, email } = verifyEmailVerificationToken(token);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return notFound('User not found');
  }

  // Update user email (if changed) and mark as verified
  await prisma.user.update({
    where: { id: userId },
    data: { 
      email: email !== user.email ? email : user.email,
      isActive: true,
    },
  });

  // Log email verification
  logSecurity('email_verified', { userId: user.id, email });

  res.json({
    success: true,
    message: 'Email verified successfully',
    timestamp: new Date().toISOString(),
  });
}));

// Get current user info
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  // This route would typically be protected by authentication middleware
  // For now, we'll just return a placeholder response
  res.json({
    success: true,
    message: 'This route requires authentication',
    timestamp: new Date().toISOString(),
  });
}));

export default router;