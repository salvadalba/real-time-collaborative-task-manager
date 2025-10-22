import { BaseEntity, ProjectStatus, Priority, PaginatedResponse, SearchParams } from './common';
import { User, RoleType } from './user';
import { Task, TaskStats } from './task';

export interface Workspace extends BaseEntity {
  name: string;
  description?: string;
  ownerId: string;
  owner?: User;
  memberCount: number;
  projectCount: number;
  settings: WorkspaceSettings;
  subscription?: WorkspaceSubscription;
}

export interface WorkspaceSettings {
  allowInvites: boolean;
  defaultRole: RoleType;
  requireApproval: boolean;
  enableTimeTracking: boolean;
  enableFileUploads: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
}

export interface WorkspaceSubscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  limits: {
    users: number;
    projects: number;
    storage: number; // in MB
  };
  usage: {
    users: number;
    projects: number;
    storage: number; // in MB
  };
}

export interface WorkspaceMember extends BaseEntity {
  workspaceId: string;
  userId: string;
  role: RoleType;
  joinedAt: string;
  invitedBy?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: RoleType;
  invitedBy: string;
  inviter?: User;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export interface Project extends BaseEntity {
  workspaceId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  creator?: User;
  members: ProjectMember[];
  taskStats: TaskStats;
  coverImageUrl?: string;
  color?: string;
  isTemplate: boolean;
  templateId?: string;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  allowTaskCreation: boolean;
  allowSelfAssignment: boolean;
  requireTaskApproval: boolean;
  enableTimeTracking: boolean;
  enableComments: boolean;
  enableAttachments: boolean;
  defaultTaskPriority: Priority;
  autoArchiveCompleted: boolean;
  archiveAfterDays: number;
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface ProjectMember extends BaseEntity {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectCreateData {
  workspaceId: string;
  name: string;
  description?: string;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  color?: string;
  templateId?: string;
  memberIds?: string[];
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  coverImageUrl?: string;
  color?: string;
  settings?: Partial<ProjectSettings>;
}

export interface ProjectSearchParams extends SearchParams {
  workspaceId?: string;
  status?: ProjectStatus[];
  priority?: Priority[];
  memberIds?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  isTemplate?: boolean;
}

export interface ProjectListResponse extends PaginatedResponse<Project> {
  stats: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  creator?: User;
  isPublic: boolean;
  category: string;
  tags: string[];
  tasks: Array<{
    title: string;
    description?: string;
    priority?: Priority;
    estimatedHours?: number;
    position: number;
    dependencies?: Array<{
      dependsOnPosition: number;
      dependencyType: string;
    }>;
  }>;
  settings: ProjectSettings;
  usageCount: number;
  rating: number;
  ratingCount: number;
}

export interface ProjectAnalytics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalHours: number;
    averageTaskDuration: number;
  };
  progress: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  memberPerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    hoursLogged: number;
    averageCompletionTime: number;
  }>;
  taskDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    milestone: string;
    date: string;
    completed: boolean;
  }>;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  project?: Project;
  userId: string;
  user?: User;
  action: ProjectActivityAction;
  details: Record<string, any>;
  createdAt: string;
}

export type ProjectActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'task_created'
  | 'task_completed'
  | 'milestone_reached';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  taskIds: string[];
  createdBy: string;
  creator?: User;
  position: number;
}

export interface ProjectCalendar {
  events: CalendarEvent[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  workingDays: number[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: 'task' | 'milestone' | 'meeting' | 'deadline';
  projectId?: string;
  taskId?: string;
  attendeeIds: string[];
  attendees?: User[];
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdBy: string;
  creator?: User;
}