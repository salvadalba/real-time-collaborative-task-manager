import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { logger, logSocket } from '../utils/logger';
import { prisma } from '../database/connection';
import { cacheUtils } from '../database/redis';
import { Operation, OperationType } from '../types/common';

// Socket data interface
interface SocketData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  rooms: string[];
}

// Operational transform interface
interface OperationData {
  entityType: string;
  entityId: string;
  operation: Operation;
  version: number;
}

// Presence data interface
interface PresenceData {
  entityType: string;
  entityId: string;
  status: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

// Setup Socket.io handlers
export const setupSocketHandlers = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      // Get token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user to socket
      socket.data.user = user;
      socket.data.rooms = [];
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connection
  io.on('connection', (socket: Socket) => {
    const user = (socket.data as SocketData).user;
    
    logSocket('user_connected', socket.id, user.id, { email: user.email, role: user.role });
    
    // Join user to their personal room
    const userRoom = `user:${user.id}`;
    socket.join(userRoom);
    (socket.data as SocketData).rooms.push(userRoom);
    
    // Handle joining workspace
    socket.on('join:workspace', (workspaceId: string) => {
      if (!workspaceId) return;
      
      const room = `workspace:${workspaceId}`;
      socket.join(room);
      (socket.data as SocketData).rooms.push(room);
      
      logSocket('joined_workspace', socket.id, user.id, { workspaceId });
      
      // Notify others in workspace
      socket.to(room).emit('user:joined_workspace', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    });
    
    // Handle leaving workspace
    socket.on('leave:workspace', (workspaceId: string) => {
      if (!workspaceId) return;
      
      const room = `workspace:${workspaceId}`;
      socket.leave(room);
      
      // Remove from rooms list
      const rooms = (socket.data as SocketData).rooms;
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
      
      logSocket('left_workspace', socket.id, user.id, { workspaceId });
      
      // Notify others in workspace
      socket.to(room).emit('user:left_workspace', {
        userId: user.id,
      });
    });
    
    // Handle joining entity (task, project, etc.)
    socket.on('join:entity', (data: { entityType: string; entityId: string }) => {
      if (!data.entityType || !data.entityId) return;
      
      const room = `${data.entityType}:${data.entityId}`;
      socket.join(room);
      (socket.data as SocketData).rooms.push(room);
      
      logSocket('joined_entity', socket.id, user.id, data);
      
      // Update presence
      updatePresence(socket, data.entityType, data.entityId, 'viewing');
    });
    
    // Handle leaving entity
    socket.on('leave:entity', (data: { entityType: string; entityId: string }) => {
      if (!data.entityType || !data.entityId) return;
      
      const room = `${data.entityType}:${data.entityId}`;
      socket.leave(room);
      
      // Remove from rooms list
      const rooms = (socket.data as SocketData).rooms;
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
      
      logSocket('left_entity', socket.id, user.id, data);
      
      // Remove presence
      removePresence(socket, data.entityType, data.entityId);
    });
    
    // Handle presence updates
    socket.on('presence:update', (data: PresenceData) => {
      if (!data.entityType || !data.entityId) return;
      
      updatePresence(socket, data.entityType, data.entityId, data.status, data.cursorPosition);
      
      // Broadcast to others in the same entity
      const room = `${data.entityType}:${data.entityId}`;
      socket.to(room).emit('presence:updated', {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userAvatar: user.avatarUrl,
        entityType: data.entityType,
        entityId: data.entityId,
        status: data.status,
        cursorPosition: data.cursorPosition,
        lastSeen: new Date().toISOString(),
        color: getUserColor(user.id),
      });
    });
    
    // Handle operational transform
    socket.on('operation:send', async (data: OperationData) => {
      try {
        if (!data.entityType || !data.entityId || !data.operation) return;
        
        // Validate operation
        if (!validateOperation(data.operation)) {
          socket.emit('operation:error', {
            operationId: data.operation.id,
            error: 'Invalid operation',
          });
          return;
        }
        
        // Get current version
        const currentVersion = await getCurrentVersion(data.entityType, data.entityId);
        
        if (data.version !== currentVersion) {
          // Version mismatch, need to transform
          const transformedOperation = await transformOperation(
            data.operation,
            data.version,
            currentVersion
          );
          
          // Apply transformed operation
          await applyOperation(data.entityType, data.entityId, transformedOperation);
          
          // Broadcast to others
          const room = `${data.entityType}:${data.entityId}`;
          socket.to(room).emit('operation:receive', {
            entityType: data.entityType,
            entityId: data.entityId,
            operation: transformedOperation,
            version: currentVersion + 1,
          });
          
          // Acknowledge to sender
          socket.emit('operation:ack', {
            operationId: data.operation.id,
            version: currentVersion + 1,
          });
        } else {
          // Apply operation directly
          await applyOperation(data.entityType, data.entityId, data.operation);
          
          // Broadcast to others
          const room = `${data.entityType}:${data.entityId}`;
          socket.to(room).emit('operation:receive', {
            entityType: data.entityType,
            entityId: data.entityId,
            operation: data.operation,
            version: data.version + 1,
          });
          
          // Acknowledge to sender
          socket.emit('operation:ack', {
            operationId: data.operation.id,
            version: data.version + 1,
          });
        }
        
        logSocket('operation_sent', socket.id, user.id, {
          entityType: data.entityType,
          entityId: data.entityId,
          operationType: data.operation.type,
        });
      } catch (error) {
        logger.error('Failed to process operation:', error);
        socket.emit('operation:error', {
          operationId: data.operation.id,
          error: 'Failed to process operation',
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logSocket('user_disconnected', socket.id, user.id, { reason });
      
      // Clean up presence for all entities
      cleanupPresence(socket);
      
      // Notify others in all rooms
      (socket.data as SocketData).rooms.forEach(room => {
        socket.to(room).emit('user:disconnected', {
          userId: user.id,
        });
      });
    });
  });
};

// Update user presence
const updatePresence = async (
  socket: Socket,
  entityType: string,
  entityId: string,
  status: string,
  cursorPosition?: { line: number; column: number }
): Promise<void> => {
  try {
    const user = (socket.data as SocketData).user;
    const key = `presence:${entityType}:${entityId}:${user.id}`;
    
    const presenceData = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatarUrl,
      entityType,
      entityId,
      status,
      cursorPosition,
      lastSeen: new Date().toISOString(),
      color: getUserColor(user.id),
    };
    
    // Store in Redis with TTL (5 minutes)
    await cacheUtils.cacheUserSession(key, presenceData, 300);
  } catch (error) {
    logger.error('Failed to update presence:', error);
  }
};

// Remove user presence
const removePresence = async (
  socket: Socket,
  entityType: string,
  entityId: string
): Promise<void> => {
  try {
    const user = (socket.data as SocketData).user;
    const key = `presence:${entityType}:${entityId}:${user.id}`;
    
    // Remove from Redis
    await cacheUtils.deleteUserSession(key);
  } catch (error) {
    logger.error('Failed to remove presence:', error);
  }
};

// Clean up all presence for a user
const cleanupPresence = async (socket: Socket): Promise<void> => {
  try {
    const user = (socket.data as SocketData).user;
    
    // Find all presence keys for this user
    const pattern = `presence:*:${user.id}`;
    const keys = await cacheUtils.invalidateCachePattern(pattern);
    
    logger.debug(`Cleaned up ${keys} presence keys for user ${user.id}`);
  } catch (error) {
    logger.error('Failed to cleanup presence:', error);
  }
};

// Get current version of an entity
const getCurrentVersion = async (entityType: string, entityId: string): Promise<number> => {
  try {
    // Get version from cache or database
    const key = `version:${entityType}:${entityId}`;
    const cachedVersion = await cacheUtils.getRedisValue(key);
    
    if (cachedVersion) {
      return parseInt(cachedVersion, 10);
    }
    
    // Get from database (this would be implemented based on the entity type)
    // For now, we'll return 0
    return 0;
  } catch (error) {
    logger.error('Failed to get current version:', error);
    return 0;
  }
};

// Validate operation
const validateOperation = (operation: Operation): boolean => {
  if (!operation.id || !operation.type) {
    return false;
  }
  
  // Validate operation type
  const validTypes: OperationType[] = ['insert', 'delete', 'retain', 'format'];
  if (!validTypes.includes(operation.type)) {
    return false;
  }
  
  // Validate position
  if (typeof operation.position !== 'number' || operation.position < 0) {
    return false;
  }
  
  // Validate length for delete operations
  if (operation.type === 'delete' && (typeof operation.length !== 'number' || operation.length <= 0)) {
    return false;
  }
  
  // Validate content for insert operations
  if (operation.type === 'insert' && !operation.content) {
    return false;
  }
  
  return true;
};

// Transform operation based on version
const transformOperation = async (
  operation: Operation,
  fromVersion: number,
  toVersion: number
): Promise<Operation> => {
  try {
    // Get operations between versions
    const operations = await getOperationsBetweenVersions(operation.entityType, operation.entityId, fromVersion, toVersion);
    
    // Transform operation against each operation
    let transformedOperation = { ...operation };
    
    for (const op of operations) {
      transformedOperation = transformAgainstOperation(transformedOperation, op);
    }
    
    return transformedOperation;
  } catch (error) {
    logger.error('Failed to transform operation:', error);
    return operation;
  }
};

// Get operations between versions
const getOperationsBetweenVersions = async (
  entityType: string,
  entityId: string,
  fromVersion: number,
  toVersion: number
): Promise<Operation[]> => {
  try {
    // Get operations from database
    // This would be implemented based on the entity type
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    logger.error('Failed to get operations between versions:', error);
    return [];
  }
};

// Transform operation against another operation
const transformAgainstOperation = (operation1: Operation, operation2: Operation): Operation => {
  // This is a simplified implementation of operational transform
  // In a real implementation, this would be more complex based on the operation types
  
  if (operation1.type === 'insert' && operation2.type === 'insert') {
    if (operation1.position <= operation2.position) {
      return operation1;
    } else {
      return {
        ...operation1,
        position: operation1.position + operation2.content.length,
      };
    }
  }
  
  if (operation1.type === 'delete' && operation2.type === 'insert') {
    if (operation1.position <= operation2.position) {
      return operation1;
    } else {
      return {
        ...operation1,
        position: operation1.position + operation2.content.length,
      };
    }
  }
  
  if (operation1.type === 'insert' && operation2.type === 'delete') {
    if (operation1.position <= operation2.position) {
      return operation1;
    } else if (operation1.position >= operation2.position + operation2.length) {
      return {
        ...operation1,
        position: operation1.position - operation2.length,
      };
    } else {
      // Insert position is within the delete range
      return {
        ...operation1,
        position: operation2.position,
      };
    }
  }
  
  return operation1;
};

// Apply operation to entity
const applyOperation = async (
  entityType: string,
  entityId: string,
  operation: Operation
): Promise<void> => {
  try {
    // Apply operation to entity in database
    // This would be implemented based on the entity type
    // For now, we'll just log the operation
    
    // Update version
    const key = `version:${entityType}:${entityId}`;
    const currentVersion = await getCurrentVersion(entityType, entityId);
    await cacheUtils.setRedisValue(key, (currentVersion + 1).toString());
    
    // Store operation in database
    await prisma.operation.create({
      data: {
        entityType,
        entityId,
        userId: operation.userId,
        operationType: operation.type,
        operationData: operation,
        sequenceNumber: currentVersion + 1,
      },
    });
    
    logger.debug(`Applied operation ${operation.id} to ${entityType}:${entityId}`);
  } catch (error) {
    logger.error('Failed to apply operation:', error);
    throw error;
  }
};

// Get user color
const getUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E2', '#F8B739', '#52C777',
    '#EC7063', '#5DADE2', '#48C9B0', '#F5B041'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export default setupSocketHandlers;