import { BaseEntity, ActivityEntityType, ActivityAction, PaginatedResponse } from './common';
import { User } from './user';

export interface Activity extends BaseEntity {
  workspaceId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle?: string;
  action: ActivityAction;
  details: ActivityDetails;
  isRead: boolean;
}

export interface ActivityDetails {
  // Task activities
  oldStatus?: string;
  newStatus?: string;
  oldPriority?: string;
  newPriority?: string;
  oldAssignee?: string;
  newAssignee?: string;
  oldDueDate?: string;
  newDueDate?: string;
  commentContent?: string;
  attachmentFilename?: string;
  timeHours?: number;
  
  // Project activities
  oldProjectStatus?: string;
  newProjectStatus?: string;
  memberRole?: string;
  memberName?: string;
  
  // User activities
  userRole?: string;
  workspaceName?: string;
  
  // Generic changes
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface ActivityFeed {
  activities: Activity[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
}

export interface ActivityFilters {
  workspaceId: string;
  userId?: string;
  entityType?: ActivityEntityType[];
  entityId?: string;
  action?: ActivityAction[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface ActivitySearchParams {
  workspaceId: string;
  query?: string;
  filters?: ActivityFilters;
  sort?: {
    field: 'createdAt' | 'updatedAt';
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface ActivitySubscription {
  id: string;
  userId: string;
  entityType: ActivityEntityType;
  entityId: string;
  isActive: boolean;
  notificationTypes: ActivityAction[];
}

export interface ActivityNotification {
  id: string;
  activity: Activity;
  userId: string;
  type: 'in_app' | 'email' | 'push';
  isRead: boolean;
  sentAt?: string;
  readAt?: string;
}

export interface ActivityStats {
  total: number;
  unread: number;
  byType: Record<ActivityEntityType, number>;
  byAction: Record<ActivityAction, number>;
  recent: Activity[];
  trending: Array<{
    entityType: ActivityEntityType;
    entityId: string;
    entityTitle: string;
    count: number;
  }>;
}

// Operational Transform Types
export interface Operation {
  id: string;
  type: OperationType;
  position: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  sequenceNumber: number;
}

export type OperationType = 'insert' | 'delete' | 'retain' | 'format';

export interface TextState {
  content: string;
  version: number;
  operations: Operation[];
}

export interface TransformResult {
  operation: Operation;
  content: string;
  version: number;
}

export interface OperationData {
  operation: Operation;
  entityId: string;
  entityType: string;
  version: number;
}

export interface AckData {
  operationId: string;
  version: number;
}

export interface OperationError {
  operationId: string;
  error: string;
}

// Presence Types (re-exported for activity tracking)
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

export interface PresenceUpdate {
  userId: string;
  entityType: string;
  entityId: string;
  status: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

export interface CursorPosition {
  line: number;
  column: number;
  selection?: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
}

// Activity Feed Components
export interface ActivityGroup {
  date: string;
  activities: Activity[];
}

export interface ActivityItemProps {
  activity: Activity;
  onMarkAsRead?: (activityId: string) => void;
  onViewEntity?: (entityType: ActivityEntityType, entityId: string) => void;
}

export interface ActivityFeedProps {
  workspaceId: string;
  filters?: ActivityFilters;
  onActivityClick?: (activity: Activity) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

// Real-time Activity Events
export interface ActivityEvent {
  type: 'activity:new' | 'activity:updated' | 'activity:read';
  data: Activity;
  timestamp: string;
}

export interface PresenceEvent {
  type: 'presence:update' | 'presence:remove';
  data: Presence | { userId: string; entityType: string; entityId: string };
  timestamp: string;
}

export interface OperationEvent {
  type: 'operation:receive' | 'operation:ack' | 'operation:error';
  data: OperationData | AckData | OperationError;
  timestamp: string;
}

// Activity Settings
export interface ActivitySettings {
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  notificationTypes: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    taskUpdated: boolean;
    commentAdded: boolean;
    projectUpdated: boolean;
    memberJoined: boolean;
    deadlineReminder: boolean;
  };
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    start: string;
    end: string;
  };
}