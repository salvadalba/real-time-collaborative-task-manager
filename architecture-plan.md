# Real-Time Collaborative Task Manager - Architecture Plan

## System Overview

This application will be a full-stack web application enabling real-time collaboration on task management with advanced features like operational transforms, presence indicators, and comprehensive time tracking.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **UI Components**: Material-UI (MUI) v5
- **Real-time Communication**: Socket.io-client
- **File Upload**: react-dropzone
- **Date Handling**: date-fns
- **Charts**: Chart.js / Recharts
- **Code Editor**: Monaco Editor (for task descriptions with rich text)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io
- **File Storage**: AWS S3 SDK
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Zod

### DevOps & Deployment
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Cloud Provider**: AWS (EC2/ECS, RDS, S3, CloudFront)
- **Monitoring**: CloudWatch
- **Logging**: Winston

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client SPA    │    │   Client SPA    │    │   Client SPA    │
│   (React)       │    │   (React)       │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Load Balancer (ALB)     │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   API Gateway / API Server │
                    │   (Express + Socket.io)   │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   PostgreSQL    │    │     Redis       │    │     AWS S3      │
│   (Primary DB)  │    │   (Caching &    │    │  (File Storage) │
│                 │    │    Sessions)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Schema Design

### Core Entities

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    role user_role NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member', 'viewer');

-- Workspaces/Organizations
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active',
    priority priority DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived', 'on_hold');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority priority DEFAULT 'medium',
    assignee_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date TIMESTAMP,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id),
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');

-- Task Dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type DEFAULT 'finish_to_start',
    UNIQUE(task_id, depends_on_task_id)
);

CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- File Attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Time Entries
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    description TEXT,
    hours DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    entity_type activity_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action activity_action NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE activity_entity_type AS ENUM ('task', 'project', 'comment', 'attachment', 'time_entry');
CREATE TYPE activity_action AS ENUM ('created', 'updated', 'deleted', 'assigned', 'completed', 'commented');

-- User Presence
CREATE TABLE user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type presence_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    status presence_status DEFAULT 'viewing',
    cursor_position JSONB,
    last_seen TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE TYPE presence_entity_type AS ENUM ('task', 'project');
CREATE TYPE presence_status AS ENUM ('viewing', 'editing', 'idle');

-- Operational Transform Operations
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type operation_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    operation_type operation_type NOT NULL,
    operation_data JSONB NOT NULL,
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE operation_entity_type AS ENUM ('task_description', 'comment');
CREATE TYPE operation_type AS ENUM ('insert', 'delete', 'retain', 'format');
```

## Real-Time Features Implementation

### 1. Operational Transform for Concurrent Editing

For handling concurrent edits on task descriptions and comments, we'll implement a simplified operational transform system:

```typescript
interface Operation {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position?: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  sequenceNumber: number;
}
```

### 2. User Presence System

Users will emit presence events when:
- Opening/closing tasks or projects
- Making edits
- Going idle

Presence data structure:
```typescript
interface Presence {
  userId: string;
  entityType: 'task' | 'project';
  entityId: string;
  status: 'viewing' | 'editing' | 'idle';
  cursorPosition?: {
    line: number;
    column: number;
  };
  lastSeen: Date;
}
```

### 3. Activity Feed System

Real-time activity updates will be pushed to connected users based on their workspace permissions.

## API Design

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Workspace Management
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Project Management
- `GET /api/projects` - List projects (with filtering)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Task Management
- `GET /api/tasks` - List tasks (with filtering, sorting, pagination)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign task to user
- `POST /api/tasks/:id/comments` - Add comment
- `POST /api/tasks/:id/attachments` - Upload attachment
- `POST /api/tasks/:id/time` - Log time entry

### Real-time Events
- `task:updated` - Task modification
- `task:assigned` - Task assignment
- `comment:added` - New comment
- `presence:update` - User presence changes
- `activity:new` - New activity in workspace

## Security Considerations

1. **Authentication & Authorization**
   - JWT with short expiration and refresh tokens
   - Role-based access control for all endpoints
   - Input validation and sanitization

2. **Data Protection**
   - Encrypted database connections
   - S3 bucket with proper IAM policies
   - Rate limiting on API endpoints

3. **Real-time Security**
   - Socket.io authentication middleware
   - Room-based access control
   - Message validation

## Performance Optimizations

1. **Database**
   - Proper indexing on frequently queried columns
   - Connection pooling
   - Read replicas for reporting queries

2. **Caching**
   - Redis for session storage
   - Caching frequently accessed data
   - CDN for static assets

3. **Frontend**
   - Code splitting and lazy loading
   - Virtual scrolling for large lists
   - Optimistic updates for better UX

## Deployment Architecture

### AWS Infrastructure
- **EC2/ECS**: Application servers
- **RDS PostgreSQL**: Managed database
- **ElastiCache Redis**: Caching layer
- **S3**: File storage
- **CloudFront**: CDN
- **Application Load Balancer**: Traffic distribution
- **Route 53**: DNS management

### CI/CD Pipeline
1. **GitHub Actions** for:
   - Code linting and formatting
   - Unit and integration tests
   - Security scanning
   - Docker image building
   - Deployment to staging/production

2. **Environment Strategy**:
   - Development: Local development with Docker Compose
   - Staging: AWS staging environment
   - Production: AWS production environment

## Testing Strategy

1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Supertest for API endpoints
3. **E2E Tests**: Playwright for critical user flows
4. **Performance Tests**: Artillery for load testing

## Monitoring & Logging

1. **Application Monitoring**: CloudWatch metrics
2. **Error Tracking**: Sentry integration
3. **Logging**: Winston with structured logs
4. **Health Checks**: Comprehensive health endpoints

This architecture provides a solid foundation for building a scalable, real-time collaborative task management application with all the requested features.