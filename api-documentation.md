# API Documentation

## Overview

This document provides comprehensive API documentation for the real-time collaborative task manager application, including all endpoints, authentication requirements, request/response formats, and real-time events.

## Base URL

```
Production: https://api.taskmanager.com
Development: http://localhost:5000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) token for API requests
- **Refresh Token**: Long-lived (7 days) token for obtaining new access tokens

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2023-10-22T20:48:24.855Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2023-10-22T20:48:24.855Z"
}
```

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "avatarUrl": null,
      "createdAt": "2023-10-22T20:48:24.855Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management

### Get Current User

```http
GET /api/users/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2023-10-22T20:48:24.855Z",
    "updatedAt": "2023-10-22T20:48:24.855Z"
  }
}
```

### Update User Profile

```http
PUT /api/users/me
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### Search Users

```http
GET /api/users/search?q=john&limit=10&offset=0
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `q`: Search query (required)
- `limit`: Maximum results (default: 10, max: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

## Workspace Management

### Get User Workspaces

```http
GET /api/workspaces
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "uuid",
        "name": "Acme Corp",
        "description": "Main workspace for Acme Corp",
        "ownerId": "uuid",
        "role": "member",
        "memberCount": 5,
        "createdAt": "2023-10-22T20:48:24.855Z"
      }
    ]
  }
}
```

### Create Workspace

```http
POST /api/workspaces
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Description of the workspace"
}
```

### Get Workspace Details

```http
GET /api/workspaces/:workspaceId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "description": "Main workspace for Acme Corp",
    "ownerId": "uuid",
    "createdAt": "2023-10-22T20:48:24.855Z",
    "updatedAt": "2023-10-22T20:48:24.855Z",
    "members": [
      {
        "id": "uuid",
        "userId": "uuid",
        "workspaceId": "uuid",
        "role": "admin",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "joinedAt": "2023-10-22T20:48:24.855Z"
      }
    ]
  }
}
```

### Invite User to Workspace

```http
POST /api/workspaces/:workspaceId/invite
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

## Project Management

### Get Projects

```http
GET /api/projects?workspaceId=uuid&status=active&limit=20&offset=0
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `workspaceId`: Filter by workspace (required)
- `status`: Filter by status (active, completed, archived, on_hold)
- `priority`: Filter by priority (low, medium, high, critical)
- `limit`: Maximum results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "workspaceId": "uuid",
        "name": "Website Redesign",
        "description": "Complete website redesign project",
        "status": "active",
        "priority": "high",
        "startDate": "2023-10-01",
        "endDate": "2023-12-31",
        "createdBy": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "taskCount": 15,
        "completedTaskCount": 5,
        "createdAt": "2023-10-22T20:48:24.855Z",
        "updatedAt": "2023-10-22T20:48:24.855Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### Create Project

```http
POST /api/projects
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "name": "New Project",
  "description": "Project description",
  "priority": "medium",
  "startDate": "2023-10-22",
  "endDate": "2023-12-31"
}
```

### Update Project

```http
PUT /api/projects/:projectId
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "completed",
  "priority": "high"
}
```

## Task Management

### Get Tasks

```http
GET /api/tasks?projectId=uuid&status=in_progress&assigneeId=uuid&limit=50&offset=0
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `projectId`: Filter by project (optional)
- `status`: Filter by status (todo, in_progress, review, done, blocked)
- `priority`: Filter by priority (low, medium, high, critical)
- `assigneeId`: Filter by assignee (optional)
- `dueDate`: Filter by due date range (optional)
- `limit`: Maximum results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `sort`: Sort field (createdAt, updatedAt, dueDate, priority)
- `order`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "title": "Implement user authentication",
        "description": "Add JWT-based authentication to the application",
        "status": "in_progress",
        "priority": "high",
        "assignee": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "createdBy": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "dueDate": "2023-10-25T20:48:24.855Z",
        "estimatedHours": 8,
        "actualHours": 5,
        "parentTaskId": null,
        "subtasks": [
          {
            "id": "uuid",
            "title": "Create login component",
            "status": "done"
          }
        ],
        "dependencies": [
          {
            "id": "uuid",
            "title": "Setup backend API",
            "type": "finish_to_start"
          }
        ],
        "attachmentCount": 2,
        "commentCount": 5,
        "position": 1,
        "createdAt": "2023-10-22T20:48:24.855Z",
        "updatedAt": "2023-10-22T20:48:24.855Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Create Task

```http
POST /api/tasks
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "assigneeId": "uuid",
  "dueDate": "2023-10-25T20:48:24.855Z",
  "estimatedHours": 4,
  "parentTaskId": null,
  "position": 1
}
```

### Update Task

```http
PUT /api/tasks/:taskId
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "done",
  "actualHours": 6
}
```

### Assign Task

```http
POST /api/tasks/:taskId/assign
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "assigneeId": "uuid"
}
```

## Comments

### Get Task Comments

```http
GET /api/tasks/:taskId/comments?limit=20&offset=0
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "taskId": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "content": "Working on this task now. Should be done by tomorrow.",
        "mentions": [
          {
            "userId": "uuid",
            "firstName": "Jane",
            "lastName": "Smith"
          }
        ],
        "createdAt": "2023-10-22T20:48:24.855Z",
        "updatedAt": "2023-10-22T20:48:24.855Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### Add Comment

```http
POST /api/tasks/:taskId/comments
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "@jane-smith Can you review this when you have a chance?",
  "mentions": ["uuid"]
}
```

## File Attachments

### Upload Attachment

```http
POST /api/tasks/:taskId/attachments
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload (required)
- `description`: Optional description

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "filename": "document.pdf",
    "originalName": "Project_Document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "downloadUrl": "https://s3.amazonaws.com/bucket/uuid/document.pdf",
    "previewUrl": "https://s3.amazonaws.com/bucket/uuid/thumbnail.jpg",
    "uploadedBy": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2023-10-22T20:48:24.855Z"
  }
}
```

### Delete Attachment

```http
DELETE /api/attachments/:attachmentId
Authorization: Bearer <access_token>
```

## Time Tracking

### Get Time Entries

```http
GET /api/time-entries?taskId=uuid&userId=uuid&startDate=2023-10-01&endDate=2023-10-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeEntries": [
      {
        "id": "uuid",
        "taskId": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "task": {
          "id": "uuid",
          "title": "Implement authentication"
        },
        "description": "Worked on JWT implementation",
        "hours": 2.5,
        "date": "2023-10-22",
        "createdAt": "2023-10-22T20:48:24.855Z"
      }
    ],
    "totalHours": 2.5,
    "totalEntries": 1
  }
}
```

### Log Time Entry

```http
POST /api/time-entries
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "taskId": "uuid",
  "description": "Completed authentication feature",
  "hours": 3.5,
  "date": "2023-10-22"
}
```

### Update Time Entry

```http
PUT /api/time-entries/:entryId
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "hours": 4.0,
  "description": "Updated description"
}
```

## Analytics

### Get Dashboard Analytics

```http
GET /api/analytics/dashboard?workspaceId=uuid&startDate=2023-10-01&endDate=2023-10-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTasks": 150,
      "completedTasks": 75,
      "inProgressTasks": 50,
      "overdueTasks": 10,
      "totalProjects": 12,
      "completedProjects": 3
    },
    "timeTracking": {
      "totalHoursLogged": 320.5,
      "averageHoursPerTask": 2.1,
      "topContributors": [
        {
          "userId": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "totalHours": 45.5
        }
      ]
    },
    "productivity": {
      "tasksCompletedPerDay": 5.2,
      "averageTaskCompletionTime": 3.5,
      "productivityTrend": [
        {
          "date": "2023-10-22",
          "tasksCompleted": 8,
          "hoursLogged": 12.5
        }
      ]
    }
  }
}
```

## Real-time Events (Socket.io)

### Connection

```javascript
const socket = io('https://api.taskmanager.com', {
  auth: {
    token: 'jwt_access_token'
  }
});
```

### Events

#### Join Workspace

```javascript
socket.emit('join:workspace', workspaceId);
```

#### Join Entity (Task/Project)

```javascript
socket.emit('join:entity', {
  entityType: 'task',
  entityId: taskId
});
```

#### Task Updates

```javascript
// Listen for task updates
socket.on('task:updated', (data) => {
  console.log('Task updated:', data.task);
});

// Listen for new tasks
socket.on('task:created', (data) => {
  console.log('New task:', data.task);
});

// Listen for task assignments
socket.on('task:assigned', (data) => {
  console.log('Task assigned:', data.task, data.assignee);
});
```

#### Presence Updates

```javascript
// Listen for presence updates
socket.on('presence:update', (presence) => {
  console.log('User presence:', presence);
});

// Listen for presence removals
socket.on('presence:remove', (data) => {
  console.log('User left:', data.userId);
});

// Update own presence
socket.emit('presence:update', {
  entityType: 'task',
  entityId: taskId,
  status: 'editing',
  cursorPosition: {
    line: 5,
    column: 10
  }
});
```

#### Operational Transform

```javascript
// Send operation
socket.emit('operation:send', {
  entityType: 'task_description',
  entityId: taskId,
  operation: {
    type: 'insert',
    position: 10,
    content: 'Hello world',
    userId: 'uuid',
    timestamp: Date.now(),
    sequenceNumber: 1
  }
});

// Receive operation
socket.on('operation:receive', (data) => {
  console.log('Remote operation:', data.operation);
});

// Operation acknowledgment
socket.on('operation:ack', (data) => {
  console.log('Operation acknowledged:', data.operationId);
});
```

#### Activity Feed

```javascript
// Listen for new activities
socket.on('activity:new', (activity) => {
  console.log('New activity:', activity);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- File upload: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1698035304
```

## Pagination

List endpoints support pagination using `limit` and `offset` parameters. Response includes pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Webhooks

Webhooks can be configured to receive notifications about specific events:

### Configure Webhook

```http
POST /api/webhooks
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["task.created", "task.completed", "comment.added"],
  "secret": "webhook_secret"
}
```

### Webhook Payload

```json
{
  "event": "task.created",
  "data": {
    "task": {
      "id": "uuid",
      "title": "New Task"
    }
  },
  "timestamp": "2023-10-22T20:48:24.855Z",
  "signature": "sha256=computed_signature"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { TaskManagerAPI } from '@taskmanager/sdk';

const api = new TaskManagerAPI({
  baseURL: 'https://api.taskmanager.com',
  accessToken: 'jwt_token'
});

// Get tasks
const tasks = await api.tasks.list({ projectId: 'uuid' });

// Create task
const task = await api.tasks.create({
  title: 'New Task',
  projectId: 'uuid'
});

// Real-time updates
api.socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
});
```

### Python

```python
from taskmanager_sdk import TaskManagerAPI

api = TaskManagerAPI(
    base_url='https://api.taskmanager.com',
    access_token='jwt_token'
)

# Get tasks
tasks = api.tasks.list(project_id='uuid')

# Create task
task = api.tasks.create(
    title='New Task',
    project_id='uuid'
)
```

This comprehensive API documentation provides all the necessary information for integrating with the real-time collaborative task manager application.