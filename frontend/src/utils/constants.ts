// Application constants

export const APP_CONFIG = {
  name: 'TaskManager',
  version: '1.0.0',
  description: 'Real-time collaborative task manager',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    verifyEmail: '/auth/verify-email',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  users: {
    me: '/users/me',
    profile: '/users/profile',
    avatar: '/users/avatar',
    search: '/users/search',
    preferences: '/users/preferences',
    password: '/users/password',
  },
  workspaces: {
    list: '/workspaces',
    create: '/workspaces',
    get: (id: string) => `/workspaces/${id}`,
    update: (id: string) => `/workspaces/${id}`,
    delete: (id: string) => `/workspaces/${id}`,
    members: (id: string) => `/workspaces/${id}/members`,
    invite: (id: string) => `/workspaces/${id}/invite`,
    acceptInvite: '/workspaces/accept-invite',
  },
  projects: {
    list: '/projects',
    create: '/projects',
    get: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    archive: (id: string) => `/projects/${id}/archive`,
    restore: (id: string) => `/projects/${id}/restore`,
    members: (id: string) => `/projects/${id}/members`,
    duplicate: (id: string) => `/projects/${id}/duplicate`,
    templates: (workspaceId: string) => `/workspaces/${workspaceId}/project-templates`,
  },
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id: string) => `/tasks/${id}`,
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    assign: (id: string) => `/tasks/${id}/assign`,
    unassign: (id: string) => `/tasks/${id}/unassign`,
    status: (id: string) => `/tasks/${id}/status`,
    position: (id: string) => `/tasks/${id}/position`,
    comments: (id: string) => `/tasks/${id}/comments`,
    attachments: (id: string) => `/tasks/${id}/attachments`,
    time: (id: string) => `/tasks/${id}/time`,
  },
  comments: {
    create: (taskId: string) => `/tasks/${taskId}/comments`,
    update: (id: string) => `/comments/${id}`,
    delete: (id: string) => `/comments/${id}`,
  },
  attachments: {
    upload: '/attachments',
    get: (id: string) => `/attachments/${id}`,
    delete: (id: string) => `/attachments/${id}`,
    preview: (id: string) => `/attachments/${id}/preview`,
    download: (id: string) => `/attachments/${id}/download`,
  },
  timeEntries: {
    list: '/time-entries',
    create: '/time-entries',
    update: (id: string) => `/time-entries/${id}`,
    delete: (id: string) => `/time-entries/${id}`,
  },
  activities: {
    list: '/activities',
    feed: '/activities/feed',
    read: (id: string) => `/activities/${id}/read`,
    readAll: '/activities/read-all',
  },
  analytics: {
    dashboard: '/analytics/dashboard',
    project: (id: string) => `/analytics/projects/${id}`,
    user: (id: string) => `/analytics/users/${id}`,
    timeTracking: '/analytics/time-tracking',
    productivity: '/analytics/productivity',
  },
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    settings: '/notifications/settings',
  },
  search: {
    global: '/search',
    tasks: '/search/tasks',
    projects: '/search/projects',
    users: '/search/users',
  },
  integrations: {
    toggl: {
      connect: '/integrations/toggl/connect',
      disconnect: '/integrations/toggl/disconnect',
      sync: '/integrations/toggl/sync',
    },
    harvest: {
      connect: '/integrations/harvest/connect',
      disconnect: '/integrations/harvest/disconnect',
      sync: '/integrations/harvest/sync',
    },
    calendar: {
      google: '/integrations/calendar/google',
      outlook: '/integrations/calendar/outlook',
      sync: '/integrations/calendar/sync',
    },
  },
} as const;

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection
  connect: 'connect',
  disconnect: 'disconnect',
  error: 'error',
  
  // Authentication
  authenticated: 'authenticated',
  authentication_error: 'authentication_error',
  
  // Rooms
  join_workspace: 'join:workspace',
  leave_workspace: 'leave:workspace',
  join_entity: 'join:entity',
  leave_entity: 'leave:entity',
  
  // Tasks
  task_created: 'task:created',
  task_updated: 'task:updated',
  task_deleted: 'task:deleted',
  task_assigned: 'task:assigned',
  task_status_changed: 'task:status_changed',
  
  // Projects
  project_created: 'project:created',
  project_updated: 'project:updated',
  project_deleted: 'project:deleted',
  
  // Comments
  comment_added: 'comment:added',
  comment_updated: 'comment:updated',
  comment_deleted: 'comment:deleted',
  
  // Presence
  presence_update: 'presence:update',
  presence_remove: 'presence:remove',
  
  // Operational Transform
  operation_send: 'operation:send',
  operation_receive: 'operation:receive',
  operation_ack: 'operation:ack',
  operation_error: 'operation:error',
  
  // Activity
  activity_new: 'activity:new',
  
  // Notifications
  notification_new: 'notification:new',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user',
  preferences: 'user_preferences',
  theme: 'theme_mode',
  lastWorkspace: 'last_workspace',
  sidebarCollapsed: 'sidebar_collapsed',
} as const;

// Task status configuration
export const TASK_STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: '#64748b',
    icon: 'circle',
    order: 1,
  },
  in_progress: {
    label: 'In Progress',
    color: '#6366f1',
    icon: 'clock',
    order: 2,
  },
  review: {
    label: 'Review',
    color: '#f59e0b',
    icon: 'eye',
    order: 3,
  },
  done: {
    label: 'Done',
    color: '#10b981',
    icon: 'check-circle',
    order: 4,
  },
  blocked: {
    label: 'Blocked',
    color: '#ef4444',
    icon: 'x-circle',
    order: 5,
  },
} as const;

// Priority configuration
export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#10b981',
    icon: 'arrow-down',
    order: 1,
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
    icon: 'minus',
    order: 2,
  },
  high: {
    label: 'High',
    color: '#ef4444',
    icon: 'arrow-up',
    order: 3,
  },
  critical: {
    label: 'Critical',
    color: '#7c2d12',
    icon: 'alert-triangle',
    order: 4,
  },
} as const;

// Project status configuration
export const PROJECT_STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: '#10b981',
    icon: 'play-circle',
    order: 1,
  },
  completed: {
    label: 'Completed',
    color: '#6366f1',
    icon: 'check-circle',
    order: 2,
  },
  archived: {
    label: 'Archived',
    color: '#64748b',
    icon: 'archive',
    order: 3,
  },
  on_hold: {
    label: 'On Hold',
    color: '#f59e0b',
    icon: 'pause-circle',
    order: 4,
  },
} as const;

// Role configuration
export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    description: 'Full access to all features',
    permissions: ['*'],
  },
  manager: {
    label: 'Manager',
    description: 'Can manage projects and users',
    permissions: [
      'projects:create',
      'projects:update',
      'projects:delete',
      'tasks:create',
      'tasks:update',
      'tasks:delete',
      'users:invite',
      'users:manage',
    ],
  },
  member: {
    label: 'Member',
    description: 'Can create and update tasks',
    permissions: [
      'tasks:create',
      'tasks:update',
      'comments:create',
      'attachments:create',
    ],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'projects:read',
      'tasks:read',
      'comments:read',
    ],
  },
} as const;

// File type configuration
export const FILE_TYPES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  videos: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  archives: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
} as const;

// Date formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  short: 'MM/dd/yyyy',
  long: 'MMMM dd, yyyy HH:mm',
  time: 'HH:mm',
  iso: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  limit: 20,
  offset: 0,
  maxLimit: 100,
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unexpected error occurred.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  taskCreated: 'Task created successfully.',
  taskUpdated: 'Task updated successfully.',
  taskDeleted: 'Task deleted successfully.',
  projectCreated: 'Project created successfully.',
  projectUpdated: 'Project updated successfully.',
  fileUploaded: 'File uploaded successfully.',
  commentAdded: 'Comment added successfully.',
  userInvited: 'User invited successfully.',
  settingsSaved: 'Settings saved successfully.',
} as const;