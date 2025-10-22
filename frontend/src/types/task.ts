import { BaseEntity, TaskStatus, Priority, PaginatedResponse, SearchParams } from './common';
import { User } from './user';

export interface Task extends BaseEntity {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  assignee?: User;
  createdBy: string;
  creator?: User;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  parentTask?: Task;
  subtasks?: Task[];
  position: number;
  tags?: string[];
  dependencies?: TaskDependency[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  timeEntries?: TimeEntry[];
  coverImageUrl?: string;
}

export interface TaskDependency extends BaseEntity {
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTask?: Task;
  dependencyType: DependencyType;
}

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export interface TaskAttachment extends BaseEntity {
  taskId: string;
  uploadedBy: string;
  uploader?: User;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface TaskComment extends BaseEntity {
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  mentions?: User[];
  isEdited: boolean;
  editedAt?: string;
  replies?: TaskComment[];
  parentId?: string;
}

export interface TimeEntry extends BaseEntity {
  taskId: string;
  userId: string;
  user?: User;
  task?: Task;
  description?: string;
  hours: number;
  date: string;
  isBillable: boolean;
  externalService?: {
    service: 'toggl' | 'harvest';
    externalId: string;
  };
}

export interface TaskCreateData {
  projectId: string;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  position?: number;
  tags?: string[];
  dependencies?: Array<{
    dependsOnTaskId: string;
    dependencyType: DependencyType;
  }>;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  position?: number;
  tags?: string[];
  coverImageUrl?: string;
}

export interface TaskSearchParams extends SearchParams {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  tags?: string[];
  hasAttachments?: boolean;
  hasComments?: boolean;
  createdById?: string;
}

export interface TaskListResponse extends PaginatedResponse<Task> {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
}

export interface TaskBoard {
  columns: TaskBoardColumn[];
  tasks: Task[];
}

export interface TaskBoardColumn {
  id: string;
  title: string;
  status: TaskStatus;
  taskIds: string[];
  position: number;
  color?: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  action: TaskActivityAction;
  details: Record<string, any>;
  createdAt: string;
}

export type TaskActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'assigned'
  | 'unassigned'
  | 'status_changed'
  | 'priority_changed'
  | 'due_date_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'time_logged';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Array<Omit<TaskCreateData, 'projectId'>>;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
}

export interface TaskFilters {
  status: TaskStatus[];
  priority: Priority[];
  assignees: string[];
  tags: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  hasAttachments?: boolean;
  hasComments?: boolean;
  isOverdue?: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  blocked: number;
  review: number;
  overdue: number;
  totalHours: number;
  estimatedHours: number;
  completionRate: number;
}

export interface TaskAnalytics {
  completionTrend: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
  productivityByUser: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    hoursLogged: number;
    averageCompletionTime: number;
  }>;
  statusDistribution: Array<{
    status: TaskStatus;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: Priority;
    count: number;
    percentage: number;
  }>;
}