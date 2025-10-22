import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store';
import { storage } from '../utils/helpers';
import { SOCKET_EVENTS } from '../utils/constants';
import { OperationData, PresenceData } from '../types/activity';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
  joinEntity: (entityType: string, entityId: string) => void;
  leaveEntity: (entityType: string, entityId: string) => void;
  updatePresence: (data: PresenceData) => void;
  sendOperation: (data: OperationData) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const { user, tokens } = useAppSelector((state) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!tokens?.accessToken || socketRef.current?.connected) {
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: {
        token: tokens.accessToken,
      },
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Handle connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      // Handle token expiration
      if (error.message === 'Authentication failed') {
        // Token might be expired, try to refresh
        handleTokenExpiration();
      }
    });

    // Re-register all event listeners
    eventListenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        newSocket.on(event, callback as any);
      });
    });

    if (autoConnect) {
      newSocket.connect();
    }
  }, [tokens?.accessToken, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Handle token expiration
  const handleTokenExpiration = useCallback(async () => {
    try {
      // Try to refresh the token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.refreshToken}`,
        },
        body: JSON.stringify({
          refreshToken: tokens?.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTokens = data.data.tokens;
        
        // Update tokens in storage
        storage.set('accessToken', newTokens.accessToken);
        storage.set('refreshToken', newTokens.refreshToken);
        
        // Reconnect with new token
        disconnect();
        setTimeout(connect, 100);
      } else {
        // Token refresh failed, logout user
        storage.remove('accessToken');
        storage.remove('refreshToken');
        storage.remove('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Logout user on error
      storage.remove('accessToken');
      storage.remove('refreshToken');
      storage.remove('user');
      window.location.href = '/login';
    }
  }, [tokens?.refreshToken, disconnect, connect]);

  // Join workspace
  const joinWorkspace = useCallback((workspaceId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.join_workspace, workspaceId);
    }
  }, []);

  // Leave workspace
  const leaveWorkspace = useCallback((workspaceId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.leave_workspace, workspaceId);
    }
  }, []);

  // Join entity
  const joinEntity = useCallback((entityType: string, entityId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.join_entity, { entityType, entityId });
    }
  }, []);

  // Leave entity
  const leaveEntity = useCallback((entityType: string, entityId: string) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.leave_entity, { entityType, entityId });
    }
  }, []);

  // Update presence
  const updatePresence = useCallback((data: PresenceData) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.presence_update, data);
    }
  }, []);

  // Send operation
  const sendOperation = useCallback((data: OperationData) => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.operation_send, data);
    }
  }, []);

  // Generic emit
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Add event listener
  const on = useCallback((event: string, callback: (data: any) => void) => {
    // Store callback for reconnection
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)?.push(callback);

    // Add to socket if it exists
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event: string, callback: (data: any) => void) => {
    // Remove from stored callbacks
    const callbacks = eventListenersRef.current.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    // Remove from socket if it exists
    if (socketRef.current) {
      socketRef.current.off(event, callback as any);
    }
  }, []);

  // Auto-connect when tokens are available
  useEffect(() => {
    if (tokens?.accessToken && autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [tokens?.accessToken, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    joinWorkspace,
    leaveWorkspace,
    joinEntity,
    leaveEntity,
    updatePresence,
    sendOperation,
    emit,
    on,
    off,
  };
};

export default useSocket;