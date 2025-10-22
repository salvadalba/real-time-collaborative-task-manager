import { BaseEntity, RoleType } from './common';

// Re-export RoleType for use in other type files
export type { RoleType } from './common';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: RoleType;
  isActive: boolean;
}

export interface UserProfile extends User {
  workspaces: WorkspaceMember[];
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  commentAdded: boolean;
  projectUpdated: boolean;
  deadlineReminder: boolean;
  dailyDigest: boolean;
}

export interface DashboardPreferences {
  defaultView: 'list' | 'board' | 'calendar';
  showCompleted: boolean;
  groupBy: 'project' | 'status' | 'priority' | 'assignee';
  sortBy: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'tasks' | 'projects' | 'analytics' | 'activity' | 'time-tracking';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface UserStats {
  tasksCompleted: number;
  tasksInProgress: number;
  hoursLogged: number;
  projectsCount: number;
  lastActiveAt: string;
}

export interface WorkspaceMember extends BaseEntity {
  workspaceId: string;
  userId: string;
  role: RoleType;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Presence {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  entityType: 'task' | 'project';
  entityId: string;
  status: 'viewing' | 'editing' | 'idle';
  cursorPosition?: {
    line: number;
    column: number;
  };
  lastSeen: string;
  color: string;
}

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: RoleType;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}