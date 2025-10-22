// Common types used across the backend

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  sort?: SortParams;
  filters?: Record<string, any>;
}

// Database types
export type RoleType = 'admin' | 'manager' | 'member' | 'viewer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type ProjectStatus = 'active' | 'completed' | 'archived' | 'on_hold';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type PresenceStatus = 'viewing' | 'editing' | 'idle';
export type ActivityEntityType = 'task' | 'project' | 'comment' | 'attachment' | 'time_entry';
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'completed' | 'commented';
export type OperationType = 'insert' | 'delete' | 'retain' | 'format';
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

// Request/Response types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: RoleType;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: RoleType;
  iat: number;
  exp: number;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

// Socket.io types
export interface SocketUser {
  id: string;
  userId: string;
  email: string;
  role: RoleType;
}

export interface SocketData {
  user: SocketUser;
  rooms: string[];
}

// File upload types
export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Bucket: string;
  downloadUrl: string;
  previewUrl?: string;
}

// External API types
export interface TogglTimeEntry {
  id: number;
  description: string;
  start: string;
  end?: string;
  duration: number;
  project_id?: number;
  task_id?: number;
  user_id: number;
  workspace_id: number;
  created_at: string;
  updated_at: string;
}

export interface HarvestTimeEntry {
  id: number;
  hours: number;
  notes: string;
  spent_at: string;
  project_id?: number;
  task_id?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  url: string;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  s3Bucket: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

export interface AppConfig {
  name: string;
  url: string;
  frontendUrl: string;
  nodeEnv: string;
  port: number;
  host: string;
  corsOrigin: string;
  bcryptRounds: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  swaggerEnabled: boolean;
}

export interface LoggingConfig {
  level: string;
  filePath: string;
  maxSize: string;
  maxFiles: string;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    socketio: 'running' | 'stopped';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Metrics types
export interface Metrics {
  timestamp: Date;
  activeUsers: number;
  activeConnections: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Validation types
export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'min' | 'max' | 'regex' | 'custom';
    value?: any;
    message: string;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

// Cache types
export interface CacheOptions {
  ttl: number;
  key: string;
}

// Rate limiting types
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: AuthenticatedRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Middleware types
export interface MiddlewareOptions {
  enabled: boolean;
  options?: any;
}