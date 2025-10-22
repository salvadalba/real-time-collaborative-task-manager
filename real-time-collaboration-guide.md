# Real-Time Collaboration Implementation Guide

## Overview

This guide details the implementation of the real-time collaboration features, including operational transforms for concurrent editing, user presence indicators, and activity feeds.

## 1. Operational Transform Algorithm

### Core Concepts

Operational Transform (OT) is an algorithm that enables real-time collaborative editing by transforming concurrent operations to maintain document consistency.

### Implementation Architecture

```typescript
// backend/src/services/operationalTransformService.ts
export class OperationalTransformService {
  private static instance: OperationalTransformService;
  private documentStates: Map<string, DocumentState> = new Map();
  
  static getInstance(): OperationalTransformService {
    if (!this.instance) {
      this.instance = new OperationalTransformService();
    }
    return this.instance;
  }

  // Initialize document state
  initializeDocument(entityId: string, content: string): void {
    this.documentStates.set(entityId, {
      content,
      version: 0,
      operations: [],
    });
  }

  // Apply operation to document
  async applyOperation(
    entityId: string,
    operation: Operation
  ): Promise<TransformResult> {
    const docState = this.documentStates.get(entityId);
    if (!docState) {
      throw new Error('Document not found');
    }

    // Transform operation against concurrent operations
    const transformedOp = await this.transformOperation(
      operation,
      docState
    );

    // Apply transformed operation
    const newContent = this.applyToContent(
      docState.content,
      transformedOp
    );

    // Update document state
    docState.content = newContent;
    docState.version++;
    docState.operations.push(transformedOp);

    // Persist to database
    await this.persistOperation(entityId, transformedOp);

    return {
      operation: transformedOp,
      content: newContent,
      version: docState.version,
    };
  }

  // Transform operation against concurrent operations
  private async transformOperation(
    operation: Operation,
    docState: DocumentState
  ): Promise<Operation> {
    let transformedOp = { ...operation };

    // Transform against all concurrent operations
    for (const concurrentOp of docState.operations) {
      if (this.areConcurrent(operation, concurrentOp)) {
        transformedOp = this.transform(transformedOp, concurrentOp);
      }
    }

    return transformedOp;
  }

  // Check if two operations are concurrent
  private areConcurrent(op1: Operation, op2: Operation): boolean {
    return (
      op1.userId !== op2.userId &&
      Math.abs(op1.timestamp - op2.timestamp) < 1000 // 1 second window
    );
  }

  // Transform two operations
  private transform(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }
    
    return op1;
  }

  // Transform two insert operations
  private transformInsertInsert(op1: Operation, op2: Operation): Operation {
    if (op1.position <= op2.position) {
      return op1;
    } else {
      return {
        ...op1,
        position: op1.position + op2.content.length,
      };
    }
  }

  // Transform insert and delete operations
  private transformInsertDelete(op1: Operation, op2: Operation): Operation {
    if (op1.position <= op2.position) {
      return op1;
    } else if (op1.position >= op2.position + op2.length) {
      return {
        ...op1,
        position: op1.position - op2.length,
      };
    } else {
      return {
        ...op1,
        position: op2.position,
      };
    }
  }

  // Transform delete and insert operations
  private transformDeleteInsert(op1: Operation, op2: Operation): Operation {
    if (op1.position + op1.length <= op2.position) {
      return op1;
    } else if (op1.position >= op2.position) {
      return {
        ...op1,
        position: op1.position + op2.content.length,
      };
    } else {
      return {
        ...op1,
        length: op1.position - op2.position,
      };
    }
  }

  // Transform two delete operations
  private transformDeleteDelete(op1: Operation, op2: Operation): Operation {
    if (op1.position + op1.length <= op2.position) {
      return op1;
    } else if (op1.position >= op2.position + op2.length) {
      return {
        ...op1,
        position: op1.position - op2.length,
      };
    } else {
      // Overlapping deletes - complex case
      const start1 = op1.position;
      const end1 = op1.position + op1.length;
      const start2 = op2.position;
      const end2 = op2.position + op2.length;

      if (start1 <= start2 && end1 >= end2) {
        // op1 encompasses op2
        return {
          ...op1,
          length: op1.length - op2.length,
        };
      } else if (start1 >= start2 && end1 <= end2) {
        // op2 encompasses op1
        return {
          ...op1,
          length: 0,
        };
      } else {
        // Partial overlap
        const overlap = Math.min(end1, end2) - Math.max(start1, start2);
        return {
          ...op1,
          length: op1.length - overlap,
        };
      }
    }
  }

  // Apply operation to content
  private applyToContent(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          operation.content +
          content.slice(operation.position)
        );
      case 'delete':
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + operation.length)
        );
      default:
        return content;
    }
  }

  // Persist operation to database
  private async persistOperation(
    entityId: string,
    operation: Operation
  ): Promise<void> {
    await prisma.operation.create({
      data: {
        entityType: operation.entityType,
        entityId,
        userId: operation.userId,
        operationType: operation.type,
        operationData: operation,
        sequenceNumber: operation.sequenceNumber,
      },
    });
  }
}
```

### Frontend Operational Transform Client

```typescript
// frontend/src/features/collaboration/operationalTransform/otClient.ts
export class OTClient {
  private socket: Socket;
  private entityId: string;
  private entityType: string;
  private localOperations: Operation[] = [];
  private awaitingAck: Map<string, Operation> = new Map();
  private currentContent: string = '';
  private version: number = 0;

  constructor(
    socket: Socket,
    entityId: string,
    entityType: string,
    initialContent: string
  ) {
    this.socket = socket;
    this.entityId = entityId;
    this.entityType = entityType;
    this.currentContent = initialContent;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('operation:receive', (data: OperationData) => {
      this.handleRemoteOperation(data);
    });

    this.socket.on('operation:ack', (data: AckData) => {
      this.handleOperationAck(data);
    });
  }

  // Apply local operation
  applyLocalOperation(operation: Operation): void {
    // Add to local operations queue
    this.localOperations.push(operation);

    // Apply to local content immediately
    this.currentContent = this.applyOperation(
      this.currentContent,
      operation
    );

    // Send to server
    this.sendOperation(operation);
  }

  // Send operation to server
  private sendOperation(operation: Operation): void {
    const operationData = {
      operation,
      entityId: this.entityId,
      entityType: this.entityType,
      version: this.version,
    };

    this.socket.emit('operation:send', operationData);
    this.awaitingAck.set(operation.id, operation);
  }

  // Handle remote operation from server
  private handleRemoteOperation(data: OperationData): void {
    let operation = data.operation;

    // Transform against local operations
    for (const localOp of this.localOperations) {
      if (localOp.userId !== operation.userId) {
        operation = this.transform(operation, localOp);
      }
    }

    // Apply to local content
    this.currentContent = this.applyOperation(
      this.currentContent,
      operation
    );

    this.version = data.version;

    // Notify UI of content change
    this.notifyContentChange(this.currentContent);
  }

  // Handle operation acknowledgment
  private handleOperationAck(data: AckData): void {
    const operation = this.awaitingAck.get(data.operationId);
    if (operation) {
      this.awaitingAck.delete(data.operationId);
      
      // Remove from local operations
      const index = this.localOperations.findIndex(
        op => op.id === data.operationId
      );
      if (index >= 0) {
        this.localOperations.splice(index, 1);
      }
    }
  }

  // Transform two operations (same as server-side)
  private transform(op1: Operation, op2: Operation): Operation {
    // Implementation same as server-side transform logic
    // ... (same methods as in OperationalTransformService)
  }

  // Apply operation to content
  private applyOperation(content: string, operation: Operation): string {
    // Implementation same as server-side applyToContent
    // ... (same method as in OperationalTransformService)
  }

  // Notify UI of content change
  private notifyContentChange(content: string): void {
    // Emit event or call callback to update UI
    window.dispatchEvent(
      new CustomEvent('contentChange', { detail: { content } })
    );
  }

  // Get current content
  getContent(): string {
    return this.currentContent;
  }
}
```

## 2. User Presence System

### Backend Presence Service

```typescript
// backend/src/services/presenceService.ts
export class PresenceService {
  private static instance: PresenceService;
  private presences: Map<string, Presence> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupCleanupInterval();
  }

  static getInstance(io?: Server): PresenceService {
    if (!this.instance) {
      if (!io) {
        throw new Error('Socket.IO instance required for first initialization');
      }
      this.instance = new PresenceService(io);
    }
    return this.instance;
  }

  // Update user presence
  async updatePresence(
    userId: string,
    entityType: string,
    entityId: string,
    status: PresenceStatus,
    cursorPosition?: CursorPosition
  ): Promise<Presence> {
    const presenceKey = `${userId}:${entityType}:${entityId}`;
    
    const presence: Presence = {
      id: presenceKey,
      userId,
      entityType: entityType as any,
      entityId,
      status: status as any,
      cursorPosition,
      lastSeen: new Date(),
    };

    // Update in-memory store
    this.presences.set(presenceKey, presence);

    // Persist to database
    await this.persistPresence(presence);

    // Broadcast to other users
    this.broadcastPresenceUpdate(presence);

    return presence;
  }

  // Remove user presence
  async removePresence(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    const presenceKey = `${userId}:${entityType}:${entityId}`;
    
    this.presences.delete(presenceKey);

    // Remove from database
    await prisma.userPresence.delete({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: entityType as any,
          entityId,
        },
      },
    });

    // Broadcast to other users
    this.broadcastPresenceRemoval(userId, entityType, entityId);
  }

  // Get presences for entity
  getEntityPresences(entityType: string, entityId: string): Presence[] {
    return Array.from(this.presences.values()).filter(
      presence => presence.entityType === entityType && presence.entityId === entityId
    );
  }

  // Get user presences
  getUserPresences(userId: string): Presence[] {
    return Array.from(this.presences.values()).filter(
      presence => presence.userId === userId
    );
  }

  // Persist presence to database
  private async persistPresence(presence: Presence): Promise<void> {
    await prisma.userPresence.upsert({
      where: {
        userId_entityType_entityId: {
          userId: presence.userId,
          entityType: presence.entityType,
          entityId: presence.entityId,
        },
      },
      update: {
        status: presence.status,
        cursorPosition: presence.cursorPosition,
        lastSeen: presence.lastSeen,
      },
      create: presence,
    });
  }

  // Broadcast presence update
  private broadcastPresenceUpdate(presence: Presence): void {
    this.io.to(`${presence.entityType}:${presence.entityId}`).emit(
      'presence:update',
      presence
    );
  }

  // Broadcast presence removal
  private broadcastPresenceRemoval(
    userId: string,
    entityType: string,
    entityId: string
  ): void {
    this.io.to(`${entityType}:${entityId}`).emit(
      'presence:remove',
      { userId, entityType, entityId }
    );
  }

  // Setup cleanup interval for inactive presences
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactivePresences();
    }, 30000); // Check every 30 seconds
  }

  // Cleanup inactive presences
  private async cleanupInactivePresences(): Promise<void> {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [key, presence] of this.presences.entries()) {
      if (now.getTime() - presence.lastSeen.getTime() > inactiveThreshold) {
        this.presences.delete(key);
        await this.removePresence(
          presence.userId,
          presence.entityType,
          presence.entityId
        );
      }
    }
  }
}
```

### Frontend Presence Management

```typescript
// frontend/src/features/collaboration/presence/usePresence.ts
export const usePresence = (
  entityType: string,
  entityId: string
) => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const socket = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    // Join entity room
    socket.emit('join:entity', { entityType, entityId });

    // Listen for presence updates
    const handlePresenceUpdate = (presence: Presence) => {
      setPresences(prev => {
        const filtered = prev.filter(
          p => !(p.userId === presence.userId && 
                 p.entityType === presence.entityType && 
                 p.entityId === presence.entityId)
        );
        return [...filtered, presence];
      });
    };

    const handlePresenceRemove = (data: { userId: string }) => {
      setPresences(prev => 
        prev.filter(p => p.userId !== data.userId)
      );
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:remove', handlePresenceRemove);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:remove', handlePresenceRemove);
      socket.emit('leave:entity', { entityType, entityId });
    };
  }, [socket, user, entityType, entityId]);

  // Update own presence
  const updatePresence = useCallback((
    status: PresenceStatus,
    cursorPosition?: CursorPosition
  ) => {
    if (!socket || !user) return;

    socket.emit('presence:update', {
      entityType,
      entityId,
      status,
      cursorPosition,
    });
  }, [socket, user, entityType, entityId]);

  // Filter out own presence
  const otherPresences = presences.filter(p => p.userId !== user?.id);

  return {
    presences: otherPresences,
    updatePresence,
  };
};
```

### Presence Indicators Component

```typescript
// frontend/src/features/collaboration/presence/PresenceIndicators.tsx
export const PresenceIndicators: React.FC<{
  entityType: string;
  entityId: string;
}> = ({ entityType, entityId }) => {
  const { presences } = usePresence(entityType, entityId);
  const theme = useTheme();

  const getUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AvatarGroup max={4}>
        {presences.map(presence => (
          <Tooltip
            key={presence.userId}
            title={`${presence.userName} - ${presence.status}`}
            arrow
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                border: `2px solid ${getUserColor(presence.userId)}`,
                backgroundColor: getUserColor(presence.userId),
              }}
              src={presence.userAvatar}
              alt={presence.userName}
            >
              {presence.userName?.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      
      {presences.length > 0 && (
        <Typography variant="caption" color="textSecondary">
          {presences.length} {presences.length === 1 ? 'person' : 'people'} viewing
        </Typography>
      )}
    </Box>
  );
};
```

## 3. Activity Feed System

### Backend Activity Service

```typescript
// backend/src/services/activityService.ts
export class ActivityService {
  // Create activity record
  static async createActivity(data: {
    workspaceId: string;
    userId: string;
    entityType: ActivityEntityType;
    entityId: string;
    action: ActivityAction;
    details?: Record<string, any>;
  }): Promise<Activity> {
    const activity = await prisma.activity.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Broadcast to workspace
    const io = getSocketIO();
    io.to(`workspace:${data.workspaceId}`).emit(
      'activity:new',
      activity
    );

    return activity;
  }

  // Get activities with filtering
  static async getActivities(params: {
    workspaceId: string;
    userId?: string;
    entityType?: ActivityEntityType;
    entityId?: string;
    action?: ActivityAction;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: Activity[]; total: number }> {
    const where: any = {
      workspaceId: params.workspaceId,
    };

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.entityId) {
      where.entityId = params.entityId;
    }

    if (params.action) {
      where.action = params.action;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      prisma.activity.count({ where }),
    ]);

    return { activities, total };
  }

  // Format activity message
  static formatActivityMessage(activity: Activity): string {
    const userName = `${activity.user.firstName} ${activity.user.lastName}`;
    const entityTitle = activity.details?.entityTitle || 'item';

    switch (activity.action) {
      case 'created':
        return `${userName} created ${activity.entityType} "${entityTitle}"`;
      case 'updated':
        return `${userName} updated ${activity.entityType} "${entityTitle}"`;
      case 'deleted':
        return `${userName} deleted ${activity.entityType} "${entityTitle}"`;
      case 'assigned':
        const assignedTo = activity.details?.assignedToName;
        return `${userName} assigned ${activity.entityType} "${entityTitle}" to ${assignedTo}`;
      case 'completed':
        return `${userName} completed ${activity.entityType} "${entityTitle}"`;
      case 'commented':
        return `${userName} commented on ${activity.entityType} "${entityTitle}"`;
      default:
        return `${userName} performed ${activity.action} on ${activity.entityType} "${entityTitle}"`;
    }
  }
}
```

### Frontend Activity Feed Component

```typescript
// frontend/src/features/collaboration/activityFeed/ActivityFeed.tsx
export const ActivityFeed: React.FC<{
  workspaceId: string;
  filters?: ActivityFilters;
}> = ({ workspaceId, filters }) => {
  const [page, setPage] = useState(0);
  const { data, isLoading, fetchMore } = useGetActivitiesQuery({
    workspaceId,
    ...filters,
    limit: 20,
    offset: page * 20,
  });

  const socket = useSocket();
  const { activities = [], total } = data || {};

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity: Activity) => {
      // Add new activity to the beginning of the list
      // This would typically be handled by RTK Query's cache updates
      window.dispatchEvent(
        new CustomEvent('activity:new', { detail: { activity } })
      );
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket]);

  const loadMore = useCallback(() => {
    if (activities.length < total) {
      setPage(prev => prev + 1);
      fetchMore();
    }
  }, [activities.length, total, fetchMore]);

  const formatActivityMessage = (activity: Activity): string => {
    return ActivityService.formatActivityMessage(activity);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity Feed
      </Typography>
      
      <List>
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            message={formatActivityMessage(activity)}
          />
        ))}
      </List>

      {activities.length < total && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outlined"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

const ActivityItem: React.FC<{
  activity: Activity;
  message: string;
}> = ({ activity, message }) => {
  return (
    <ListItem sx={{ px: 0 }}>
      <ListItemAvatar>
        <Avatar
          src={activity.user.avatarUrl}
          alt={`${activity.user.firstName} ${activity.user.lastName}`}
        >
          {activity.user.firstName?.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={message}
        secondary={
          <Typography variant="caption" color="textSecondary">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: true,
            })}
          </Typography>
        }
      />
    </ListItem>
  );
};
```

## 4. Socket.io Integration

### Socket Handler Setup

```typescript
// backend/src/socket/socketHandler.ts
export const setupSocketHandlers = (io: Server): void => {
  const presenceService = PresenceService.getInstance(io);
  const otService = OperationalTransformService.getInstance();

  io.use(async (socket, next) => {
    // Authenticate socket connection
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    console.log(`User ${user.id} connected`);

    // Join workspace rooms
    socket.on('join:workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    // Join entity rooms
    socket.on('join:entity', (data: { entityType: string; entityId: string }) => {
      socket.join(`${data.entityType}:${data.entityId}`);
    });

    // Leave entity rooms
    socket.on('leave:entity', (data: { entityType: string; entityId: string }) => {
      socket.leave(`${data.entityType}:${data.entityId}`);
      presenceService.removePresence(user.id, data.entityType, data.entityId);
    });

    // Handle presence updates
    socket.on('presence:update', async (data: {
      entityType: string;
      entityId: string;
      status: PresenceStatus;
      cursorPosition?: CursorPosition;
    }) => {
      await presenceService.updatePresence(
        user.id,
        data.entityType,
        data.entityId,
        data.status,
        data.cursorPosition
      );
    });

    // Handle operational transform operations
    socket.on('operation:send', async (data: OperationData) => {
      try {
        const result = await otService.applyOperation(
          data.entityId,
          data.operation
        );

        // Broadcast to other users in the entity room
        socket.to(`${data.entityType}:${data.entityId}`).emit(
          'operation:receive',
          {
            operation: result.operation,
            version: result.version,
          }
        );

        // Acknowledge to sender
        socket.emit('operation:ack', {
          operationId: data.operation.id,
          version: result.version,
        });
      } catch (error) {
        socket.emit('operation:error', {
          operationId: data.operation.id,
          error: error.message,
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${user.id} disconnected`);
      
      // Clean up all presences for this user
      const userPresences = presenceService.getUserPresences(user.id);
      userPresences.forEach(presence => {
        presenceService.removePresence(
          user.id,
          presence.entityType,
          presence.entityId
        );
      });
    });
  });
};
```

This comprehensive implementation guide provides the foundation for building robust real-time collaboration features including operational transforms, user presence indicators, and activity feeds. The system is designed to handle concurrent editing scenarios while maintaining data consistency and providing a smooth collaborative experience.