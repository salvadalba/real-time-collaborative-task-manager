import { 
  ApiResponse, 
  PaginatedResponse, 
  SearchParams, 
  ActivityEntityType, 
  ActivityAction 
} from './common';
import { User, LoginCredentials, RegisterData, AuthResponse } from './user';
import { 
  Task, 
  TaskCreateData, 
  TaskUpdateData, 
  TaskSearchParams, 
  TaskListResponse 
} from './task';
import { 
  Project, 
  ProjectCreateData, 
  ProjectUpdateData, 
  ProjectSearchParams, 
  ProjectListResponse,
  Workspace,
  WorkspaceMember
} from './project';

// Auth API
export interface AuthApi {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterData) => Promise<ApiResponse<AuthResponse>>;
  refresh: (refreshToken: string) => Promise<ApiResponse<{ accessToken: string; refreshToken: string }>>;
  logout: () => Promise<ApiResponse<void>>;
  verifyEmail: (token: string) => Promise<ApiResponse<void>>;
  forgotPassword: (email: string) => Promise<ApiResponse<void>>;
  resetPassword: (token: string, password: string) => Promise<ApiResponse<void>>;
}

// User API
export interface UserApi {
  getCurrentUser: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
  uploadAvatar: (file: File) => Promise<ApiResponse<{ avatarUrl: string }>>;
  searchUsers: (query: string, limit?: number) => Promise<ApiResponse<User[]>>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<ApiResponse<void>>;
  updatePreferences: (preferences: any) => Promise<ApiResponse<void>>;
}

// Workspace API
export interface WorkspaceApi {
  getWorkspaces: () => Promise<ApiResponse<Workspace[]>>;
  getWorkspace: (id: string) => Promise<ApiResponse<Workspace>>;
  createWorkspace: (data: { name: string; description?: string }) => Promise<ApiResponse<Workspace>>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<ApiResponse<Workspace>>;
  deleteWorkspace: (id: string) => Promise<ApiResponse<void>>;
  getWorkspaceMembers: (workspaceId: string) => Promise<ApiResponse<WorkspaceMember[]>>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<ApiResponse<void>>;
  updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<ApiResponse<void>>;
  removeMember: (workspaceId: string, userId: string) => Promise<ApiResponse<void>>;
  acceptInvite: (token: string) => Promise<ApiResponse<void>>;
  declineInvite: (token: string) => Promise<ApiResponse<void>>;
}

// Project API
export interface ProjectApi {
  getProjects: (params: ProjectSearchParams) => Promise<ApiResponse<ProjectListResponse>>;
  getProject: (id: string) => Promise<ApiResponse<Project>>;
  createProject: (data: ProjectCreateData) => Promise<ApiResponse<Project>>;
  updateProject: (id: string, data: ProjectUpdateData) => Promise<ApiResponse<Project>>;
  deleteProject: (id: string) => Promise<ApiResponse<void>>;
  archiveProject: (id: string) => Promise<ApiResponse<void>>;
  restoreProject: (id: string) => Promise<ApiResponse<void>>;
  getProjectMembers: (projectId: string) => Promise<ApiResponse<WorkspaceMember[]>>;
  addProjectMember: (projectId: string, userId: string, role: string) => Promise<ApiResponse<void>>;
  updateProjectMember: (projectId: string, userId: string, role: string) => Promise<ApiResponse<void>>;
  removeProjectMember: (projectId: string, userId: string) => Promise<ApiResponse<void>>;
  duplicateProject: (id: string, name: string) => Promise<ApiResponse<Project>>;
  getProjectTemplates: (workspaceId: string) => Promise<ApiResponse<any[]>>;
  createProjectFromTemplate: (templateId: string, name: string) => Promise<ApiResponse<Project>>;
}

// Task API
export interface TaskApi {
  getTasks: (params: TaskSearchParams) => Promise<ApiResponse<TaskListResponse>>;
  getTask: (id: string) => Promise<ApiResponse<Task>>;
  createTask: (data: TaskCreateData) => Promise<ApiResponse<Task>>;
  updateTask: (id: string, data: TaskUpdateData) => Promise<ApiResponse<Task>>;
  deleteTask: (id: string) => Promise<ApiResponse<void>>;
  assignTask: (id: string, assigneeId: string) => Promise<ApiResponse<Task>>;
  unassignTask: (id: string) => Promise<ApiResponse<Task>>;
  updateTaskStatus: (id: string, status: string) => Promise<ApiResponse<Task>>;
  updateTaskPosition: (id: string, position: number, status?: string) => Promise<ApiResponse<Task>>;
  getTaskComments: (taskId: string, params?: SearchParams) => Promise<ApiResponse<PaginatedResponse<any>>>;
  addTaskComment: (taskId: string, content: string, mentions?: string[]) => Promise<ApiResponse<any>>;
  updateTaskComment: (commentId: string, content: string) => Promise<ApiResponse<any>>;
  deleteTaskComment: (commentId: string) => Promise<ApiResponse<void>>;
  getTaskAttachments: (taskId: string) => Promise<ApiResponse<any[]>>;
  uploadTaskAttachment: (taskId: string, file: File, description?: string) => Promise<ApiResponse<any>>;
  deleteTaskAttachment: (attachmentId: string) => Promise<ApiResponse<void>>;
  logTime: (taskId: string, data: { description?: string; hours: number; date: string }) => Promise<ApiResponse<any>>;
  updateTimeEntry: (entryId: string, data: any) => Promise<ApiResponse<any>>;
  deleteTimeEntry: (entryId: string) => Promise<ApiResponse<void>>;
  getTimeEntries: (taskId?: string, params?: SearchParams) => Promise<ApiResponse<PaginatedResponse<any>>>;
}

// Activity API
export interface ActivityApi {
  getActivities: (params: {
    workspaceId: string;
    userId?: string;
    entityType?: ActivityEntityType;
    entityId?: string;
    action?: ActivityAction;
    limit?: number;
    offset?: number;
  }) => Promise<ApiResponse<PaginatedResponse<any>>>;
  getActivityFeed: (workspaceId: string, filters?: any) => Promise<ApiResponse<any[]>>;
  markActivityAsRead: (activityId: string) => Promise<ApiResponse<void>>;
  markAllActivitiesAsRead: (workspaceId: string) => Promise<ApiResponse<void>>;
}

// Analytics API
export interface AnalyticsApi {
  getDashboardAnalytics: (params: {
    workspaceId: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<ApiResponse<any>>;
  getProjectAnalytics: (projectId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => Promise<ApiResponse<any>>;
  getUserAnalytics: (userId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => Promise<ApiResponse<any>>;
  getTimeTrackingReport: (params: {
    workspaceId: string;
    userId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<ApiResponse<any>>;
  getProductivityReport: (params: {
    workspaceId: string;
    period: 'week' | 'month' | 'quarter' | 'year';
  }) => Promise<ApiResponse<any>>;
}

// File Upload API
export interface FileUploadApi {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<ApiResponse<{
    id: string;
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    downloadUrl: string;
    previewUrl?: string;
  }>>;
  deleteFile: (fileId: string) => Promise<ApiResponse<void>>;
  getFilePreview: (fileId: string) => Promise<ApiResponse<string>>;
  downloadFile: (fileId: string) => Promise<Blob>;
}

// External Integrations API
export interface ExternalApi {
  // Toggl Integration
  connectToggl: (apiKey: string) => Promise<ApiResponse<void>>;
  disconnectToggl: () => Promise<ApiResponse<void>>;
  syncTogglTimeEntries: (params?: { startDate?: string; endDate?: string }) => Promise<ApiResponse<any>>;
  
  // Harvest Integration
  connectHarvest: (accessToken: string) => Promise<ApiResponse<void>>;
  disconnectHarvest: () => Promise<ApiResponse<void>>;
  syncHarvestTimeEntries: (params?: { startDate?: string; endDate?: string }) => Promise<ApiResponse<any>>;
  
  // Calendar Integration
  connectGoogleCalendar: () => Promise<ApiResponse<{ authUrl: string }>>;
  connectOutlookCalendar: () => Promise<ApiResponse<{ authUrl: string }>>;
  syncCalendarEvents: (calendarId: string) => Promise<ApiResponse<any>>;
}

// Notification API
export interface NotificationApi {
  getNotifications: (params?: { read?: boolean; limit?: number; offset?: number }) => Promise<ApiResponse<PaginatedResponse<any>>>;
  markNotificationAsRead: (notificationId: string) => Promise<ApiResponse<void>>;
  markAllNotificationsAsRead: () => Promise<ApiResponse<void>>;
  deleteNotification: (notificationId: string) => Promise<ApiResponse<void>>;
  updateNotificationSettings: (settings: any) => Promise<ApiResponse<void>>;
}

// Search API
export interface SearchApi {
  globalSearch: (query: string, filters?: {
    entityTypes: string[];
    workspaceId?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
  }) => Promise<ApiResponse<{
    tasks: Task[];
    projects: Project[];
    users: User[];
    total: number;
  }>>;
  searchTasks: (params: TaskSearchParams) => Promise<ApiResponse<TaskListResponse>>;
  searchProjects: (params: ProjectSearchParams) => Promise<ApiResponse<ProjectListResponse>>;
  searchUsers: (query: string, workspaceId?: string, limit?: number) => Promise<ApiResponse<User[]>>;
}

// WebSocket API types
export interface SocketApi {
  // Connection
  connect: (token: string) => void;
  disconnect: () => void;
  
  // Rooms
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
  joinEntity: (entityType: string, entityId: string) => void;
  leaveEntity: (entityType: string, entityId: string) => void;
  
  // Events
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  
  // Presence
  updatePresence: (data: {
    entityType: string;
    entityId: string;
    status: string;
    cursorPosition?: { line: number; column: number };
  }) => void;
  
  // Operational Transform
  sendOperation: (data: {
    entityType: string;
    entityId: string;
    operation: any;
  }) => void;
}

// Error handling
export interface ApiError extends Error {
  code: string;
  status?: number;
  details?: any;
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}