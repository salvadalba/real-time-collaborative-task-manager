import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tooltip, 
  Avatar, 
  Chip, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Collapse,
  IconButton,
  Badge,
  useTheme,
} from '@mui/material';
import { 
  People as PeopleIcon, 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Idle as IdleIcon,
} from '@mui/icons-material';
import { Presence } from '../../../types/activity';
import { generateUserColor, formatRelativeTime } from '../../../utils/helpers';
import { useSocket } from '../../../hooks/useSocket';

interface PresenceIndicatorProps {
  entityType: string;
  entityId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showDetails?: boolean;
  maxVisible?: number;
}

interface UserPresence extends Presence {
  isOnline: boolean;
  lastSeenRelative: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  entityType,
  entityId,
  position = 'top',
  showDetails = false,
  maxVisible = 3,
}) => {
  const theme = useTheme();
  const { socket } = useSocket();
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Join entity room to receive presence updates
  useEffect(() => {
    if (!socket || !entityType || !entityId) return;

    // Join the entity room
    socket.emit('join:entity', { entityType, entityId });

    // Listen for presence updates
    const handlePresenceUpdated = (data: Presence) => {
      setPresences(prev => {
        const existingIndex = prev.findIndex(p => p.userId === data.userId);
        
        if (existingIndex >= 0) {
          // Update existing presence
          const updated = [...prev];
          updated[existingIndex] = {
            ...data,
            isOnline: true,
            lastSeenRelative: 'now',
          };
          return updated;
        } else {
          // Add new presence
          return [
            ...prev,
            {
              ...data,
              isOnline: true,
              lastSeenRelative: 'now',
            },
          ];
        }
      });
    };

    const handleUserDisconnected = (data: { userId: string }) => {
      setPresences(prev => 
        prev.map(p => 
          p.userId === data.userId 
            ? { ...p, isOnline: false, lastSeenRelative: formatRelativeTime(new Date()) }
            : p
        )
      );
    };

    socket.on('presence:updated', handlePresenceUpdated);
    socket.on('user:disconnected', handleUserDisconnected);

    // Cleanup on unmount
    return () => {
      socket.emit('leave:entity', { entityType, entityId });
      socket.off('presence:updated', handlePresenceUpdated);
      socket.off('user:disconnected', handleUserDisconnected);
    };
  }, [socket, entityType, entityId]);

  // Update own presence when hovering
  useEffect(() => {
    if (!socket) return;

    const updateOwnPresence = () => {
      socket.emit('presence:update', {
        entityType,
        entityId,
        status: isHovered ? 'editing' : 'viewing',
      });
    };

    if (isHovered) {
      updateOwnPresence();
    }

    return () => {
      // Reset to viewing when not hovering
      socket.emit('presence:update', {
        entityType,
        entityId,
        status: 'viewing',
      });
    };
  }, [socket, entityType, entityId, isHovered]);

  // Sort presences: online users first, then by last seen
  const sortedPresences = [...presences].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  const visiblePresences = sortedPresences.slice(0, maxVisible);
  const hiddenCount = Math.max(0, presences.length - maxVisible);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'viewing':
        return <VisibilityIcon fontSize="small" />;
      case 'editing':
        return <EditIcon fontSize="small" />;
      case 'idle':
        return <IdleIcon fontSize="small" />;
      default:
        return <VisibilityIcon fontSize="small" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viewing':
        return theme.palette.info.main;
      case 'editing':
        return theme.palette.success.main;
      case 'idle':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  if (presences.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        [position]: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        border: `1px solid ${theme.palette.divider}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Presence avatars */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {visiblePresences.map((presence, index) => (
          <Tooltip
            key={presence.userId}
            title={
              <Box>
                <Typography variant="body2">
                  {presence.userName}
                </Typography>
                <Typography variant="caption" display="block">
                  {presence.status === 'editing' ? 'Editing' : 'Viewing'}
                </Typography>
                {!presence.isOnline && (
                  <Typography variant="caption" display="block">
                    Last seen: {presence.lastSeenRelative}
                  </Typography>
                )}
              </Box>
            }
            placement="bottom"
            arrow
          >
            <Badge
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              badgeContent={
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: presence.isOnline 
                      ? getStatusColor(presence.status) 
                      : theme.palette.grey[500],
                    border: '2px solid white',
                  }}
                />
              }
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: presence.userAvatar 
                    ? 'transparent' 
                    : generateUserColor(presence.userId),
                  border: `2px solid ${presence.color}`,
                  ml: index > 0 ? -1 : 0,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    zIndex: 1,
                  },
                }}
                src={presence.userAvatar}
                alt={presence.userName}
              >
                {!presence.userAvatar && presence.userName.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </Tooltip>
        ))}
        
        {/* Hidden count indicator */}
        {hiddenCount > 0 && (
          <Tooltip
            title={`${hiddenCount} more users`}
            placement="bottom"
            arrow
          >
            <Chip
              size="small"
              label={`+${hiddenCount}`}
              sx={{
                height: 24,
                minWidth: 24,
                fontSize: '0.7rem',
                ml: 0.5,
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Details button */}
      {showDetails && presences.length > 0 && (
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ p: 0.5 }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      )}

      {/* Expanded details */}
      {showDetails && expanded && (
        <Collapse in={expanded}>
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              right: 0,
              mt: 1,
              minWidth: 250,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 3,
              border: `1px solid ${theme.palette.divider}`,
              zIndex: 100,
            }}
          >
            <List dense>
              {sortedPresences.map((presence) => (
                <ListItem key={presence.userId} sx={{ px: 2, py: 1 }}>
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: presence.isOnline 
                              ? getStatusColor(presence.status) 
                              : theme.palette.grey[500],
                            border: '1px solid white',
                          }}
                        />
                      }
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: presence.userAvatar 
                            ? 'transparent' 
                            : generateUserColor(presence.userId),
                        }}
                        src={presence.userAvatar}
                        alt={presence.userName}
                      >
                        {!presence.userAvatar && presence.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {presence.userName}
                        </Typography>
                        {getStatusIcon(presence.status)}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {presence.isOnline 
                          ? `${presence.status.charAt(0).toUpperCase()}${presence.status.slice(1)}`
                          : `Offline (${presence.lastSeenRelative})`
                        }
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default PresenceIndicator;