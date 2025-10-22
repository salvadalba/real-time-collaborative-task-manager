// Common types used across the application

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
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
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOption {
  field: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  sort?: SortOption;
  filters?: FilterOption[];
}

// User types
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export type RoleType = 'admin' | 'manager' | 'member' | 'viewer';

// Status and Priority types
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type ProjectStatus = 'active' | 'completed' | 'archived' | 'on_hold';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Presence types
export type PresenceStatus = 'viewing' | 'editing' | 'idle';
export type PresenceEntityType = 'task' | 'project';

// Activity types
export type ActivityEntityType = 'task' | 'project' | 'comment' | 'attachment' | 'time_entry';
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'completed' | 'commented';

// File types
export interface FileUpload {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  previewUrl?: string;
}

// Color palette for user avatars and presence indicators
export const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E2', '#F8B739', '#52C777',
  '#EC7063', '#5DADE2', '#48C9B0', '#F5B041'
];

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Socket events
export interface SocketEvent {
  event: string;
  data: any;
  timestamp: string;
}