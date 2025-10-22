# Project Structure and Implementation Guide

## Directory Structure

```
1/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .env.example
├── architecture-plan.md
├── project-structure.md
├── frontend/                          # React TypeScript Application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/               # Reusable UI Components
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Loading/
│   │   │   │   └── ErrorBoundary/
│   │   │   ├── layout/
│   │   │   │   ├── Header/
│   │   │   │   ├── Sidebar/
│   │   │   │   └── Footer/
│   │   │   └── forms/
│   │   │       ├── TaskForm/
│   │   │       ├── ProjectForm/
│   │   │       └── UserForm/
│   │   ├── pages/                    # Page Components
│   │   │   ├── auth/
│   │   │   │   ├── Login/
│   │   │   │   └── Register/
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard/
│   │   │   ├── tasks/
│   │   │   │   ├── TaskList/
│   │   │   │   ├── TaskDetail/
│   │   │   │   └── TaskBoard/
│   │   │   ├── projects/
│   │   │   │   ├── ProjectList/
│   │   │   │   ├── ProjectDetail/
│   │   │   │   └── ProjectSettings/
│   │   │   ├── analytics/
│   │   │   │   └── Analytics/
│   │   │   └── settings/
│   │   │       └── Settings/
│   │   ├── features/                 # Feature-specific Logic
│   │   │   ├── auth/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── authApi.ts
│   │   │   │   └── authUtils.ts
│   │   │   ├── tasks/
│   │   │   │   ├── tasksSlice.ts
│   │   │   │   ├── tasksApi.ts
│   │   │   │   └── taskUtils.ts
│   │   │   ├── projects/
│   │   │   │   ├── projectsSlice.ts
│   │   │   │   ├── projectsApi.ts
│   │   │   │   └── projectUtils.ts
│   │   │   ├── collaboration/
│   │   │   │   ├── operationalTransform/
│   │   │   │   │   ├── operations.ts
│   │   │   │   │   ├── transform.ts
│   │   │   │   │   └── textSync.ts
│   │   │   │   ├── presence/
│   │   │   │   │   ├── presenceSlice.ts
│   │   │   │   │   ├── presenceUtils.ts
│   │   │   │   │   └── presenceComponents.tsx
│   │   │   │   └── activityFeed/
│   │   │   │       ├── activitySlice.ts
│   │   │   │       ├── activityApi.ts
│   │   │   │       └── activityComponents.tsx
│   │   │   ├── fileUpload/
│   │   │   │   ├── uploadSlice.ts
│   │   │   │   ├── uploadApi.ts
│   │   │   │   └── uploadComponents.tsx
│   │   │   └── timeTracking/
│   │   │       ├── timeSlice.ts
│   │   │       ├── timeApi.ts
│   │   │       └── timeComponents.tsx
│   │   ├── hooks/                    # Custom React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── usePresence.ts
│   │   │   ├── useOperationalTransform.ts
│   │   │   ├── useFileUpload.ts
│   │   │   └── useTimeTracking.ts
│   │   ├── utils/                    # Utility Functions
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── date.ts
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── styles/                   # Styling
│   │   │   ├── globals.css
│   │   │   ├── theme.ts
│   │   │   └── components/
│   │   ├── store/                    # Redux Store Configuration
│   │   │   ├── index.ts
│   │   │   └── rootReducer.ts
│   │   ├── types/                    # TypeScript Type Definitions
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── task.ts
│   │   │   ├── project.ts
│   │   │   ├── user.ts
│   │   │   └── common.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── setupTests.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── webpack.config.js
│   └── .eslintrc.js
├── backend/                           # Node.js Express TypeScript API
│   ├── src/
│   │   ├── controllers/              # Request Handlers
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── workspaceController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── commentController.ts
│   │   │   ├── attachmentController.ts
│   │   │   ├── timeEntryController.ts
│   │   │   └── analyticsController.ts
│   │   ├── services/                 # Business Logic
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── workspaceService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── taskService.ts
│   │   │   ├── commentService.ts
│   │   │   ├── attachmentService.ts
│   │   │   ├── timeEntryService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── fileUploadService.ts
│   │   │   ├── operationalTransformService.ts
│   │   │   ├── presenceService.ts
│   │   │   ├── activityService.ts
│   │   │   └── externalApiService.ts
│   │   ├── middleware/               # Express Middleware
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── cors.ts
│   │   ├── models/                   # Database Models
│   │   │   ├── User.ts
│   │   │   ├── Workspace.ts
│   │   │   ├── Project.ts
│   │   │   ├── Task.ts
│   │   │   ├── Comment.ts
│   │   │   ├── Attachment.ts
│   │   │   ├── TimeEntry.ts
│   │   │   ├── Activity.ts
│   │   │   ├── Presence.ts
│   │   │   └── Operation.ts
│   │   ├── routes/                   # API Routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── projects.ts
│   │   │   ├── tasks.ts
│   │   │   ├── comments.ts
│   │   │   ├── attachments.ts
│   │   │   ├── timeEntries.ts
│   │   │   └── analytics.ts
│   │   ├── socket/                   # Socket.io Handlers
│   │   │   ├── socketHandler.ts
│   │   │   ├── taskSocket.ts
│   │   │   ├── presenceSocket.ts
│   │   │   ├── activitySocket.ts
│   │   │   └── operationalTransformSocket.ts
│   │   ├── database/                 # Database Configuration
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── utils/                    # Utility Functions
│   │   │   ├── logger.ts
│   │   │   ├── validation.ts
│   │   │   ├── encryption.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── types/                    # TypeScript Types
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── database.ts
│   │   │   └── socket.ts
│   │   ├── config/                   # Configuration Files
│   │   │   ├── database.ts
│   │   │   ├── aws.ts
│   │   │   ├── redis.ts
│   │   │   └── app.ts
│   │   ├── tests/                    # Test Files
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── fixtures/
│   │   └── app.ts                    # Express App Entry Point
│   ├── prisma/                       # Prisma ORM
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .eslintrc.js
├── database/                         # Database Scripts
│   ├── init.sql
│   ├── migrations/
│   └── seeds/
├── docs/                             # Documentation
│   ├── api/
│   │   └── swagger.yaml
│   ├── deployment/
│   │   ├── aws.md
│   │   └── docker.md
│   └── development/
│       └── setup.md
├── scripts/                          # Utility Scripts
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
├── tests/                            # E2E Tests
│   ├── e2e/
│   └── performance/
└── deployment/                       # Deployment Configuration
    ├── docker/
    │   ├── Dockerfile.frontend
    │   ├── Dockerfile.backend
    │   └── nginx.conf
    ├── kubernetes/
    │   ├── frontend-deployment.yaml
    │   ├── backend-deployment.yaml
    │   └── ingress.yaml
    └── terraform/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Key Implementation Components

### 1. Operational Transform Implementation

The operational transform system will handle concurrent editing of task descriptions and comments:

```typescript
// frontend/src/features/collaboration/operationalTransform/operations.ts
export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  sequenceNumber: number;
}

export interface TextState {
  content: string;
  version: number;
  operations: Operation[];
}
```

```typescript
// frontend/src/features/collaboration/operationalTransform/transform.ts
export class OperationalTransform {
  // Transform two concurrent operations
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    }
    // Handle other operation combinations...
  }
  
  // Apply operation to text
  static apply(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               operation.content + 
               content.slice(operation.position);
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + operation.length);
      // Handle other operation types...
    }
  }
}
```

### 2. Real-time Presence System

```typescript
// frontend/src/features/collaboration/presence/presenceSlice.ts
export interface Presence {
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
  lastSeen: Date;
  color: string; // User-specific color for indicators
}

export const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    presences: [] as Presence[],
    currentPresence: null as Presence | null,
  },
  reducers: {
    updatePresence: (state, action) => {
      const index = state.presences.findIndex(
        p => p.userId === action.payload.userId && 
             p.entityId === action.payload.entityId
      );
      
      if (index >= 0) {
        state.presences[index] = action.payload;
      } else {
        state.presences.push(action.payload);
      }
    },
    removePresence: (state, action) => {
      state.presences = state.presences.filter(
        p => !(p.userId === action.payload.userId && 
               p.entityId === action.payload.entityId)
      );
    },
  },
});
```

### 3. File Upload System

```typescript
// frontend/src/features/fileUpload/uploadComponents.tsx
export const FileUpload: React.FC<{
  taskId: string;
  onUploadComplete: (files: UploadedFile[]) => void;
}> = ({ taskId, onUploadComplete }) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => {
        uploadFile(file, taskId);
      });
    },
    multiple: true,
  });

  const uploadFile = async (file: File, taskId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    try {
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      const result = await response.json();
      onUploadComplete([result]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed #ccc',
        borderRadius: 1,
        p: 2,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f5f5f5' : 'transparent',
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop files here...</p>
      ) : (
        <p>Drag & drop files here, or click to select files</p>
      )}
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <Box key={filename} mt={1}>
          <Typography variant="caption">{filename}</Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      ))}
    </Box>
  );
};
```

### 4. Time Tracking Integration

```typescript
// backend/src/services/externalApiService.ts
export class ExternalApiService {
  // Toggl Integration
  static async syncWithToggl(userId: string, apiKey: string) {
    const togglClient = new TogglClient(apiKey);
    const timeEntries = await togglClient.getTimeEntries();
    
    // Sync with local database
    for (const entry of timeEntries) {
      await this.createOrUpdateTimeEntry(userId, entry);
    }
  }

  // Harvest Integration
  static async syncWithHarvest(userId: string, accessToken: string) {
    const harvestClient = new HarvestClient(accessToken);
    const timeEntries = await harvestClient.getTimeEntries();
    
    // Sync with local database
    for (const entry of timeEntries) {
      await this.createOrUpdateTimeEntry(userId, entry);
    }
  }

  private static async createOrUpdateTimeEntry(userId: string, entry: any) {
    // Implementation for syncing external time entries
  }
}
```

### 5. Activity Feed System

```typescript
// frontend/src/features/collaboration/activityFeed/activityComponents.tsx
export const ActivityFeed: React.FC<{
  workspaceId: string;
  filters?: ActivityFilters;
}> = ({ workspaceId, filters }) => {
  const { data: activities, isLoading } = useGetActivitiesQuery({
    workspaceId,
    ...filters,
  });

  const formatActivityMessage = (activity: Activity) => {
    switch (activity.action) {
      case 'created':
        return `${activity.userName} created ${activity.entityType} "${activity.entityTitle}"`;
      case 'updated':
        return `${activity.userName} updated ${activity.entityType} "${activity.entityTitle}"`;
      case 'assigned':
        return `${activity.userName} assigned ${activity.entityType} "${activity.entityTitle}" to ${activity.assignedToName}`;
      // Handle other action types...
    }
  };

  return (
    <Box>
      <Typography variant="h6">Activity Feed</Typography>
      <List>
        {activities?.map(activity => (
          <ListItem key={activity.id}>
            <ListItemAvatar>
              <Avatar src={activity.userAvatar} />
            </ListItemAvatar>
            <ListItemText
              primary={formatActivityMessage(activity)}
              secondary={formatDistanceToNow(new Date(activity.createdAt))}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
```

## Development Workflow

### 1. Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd 1

# Install dependencies
npm run install:all

# Start development environment
npm run dev

# This will start:
# - Frontend development server (http://localhost:3000)
# - Backend API server (http://localhost:5000)
# - PostgreSQL database (via Docker)
# - Redis cache (via Docker)
```

### 2. Environment Configuration

Create `.env` files for both frontend and backend:

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
TOGGL_API_KEY=your-toggl-api-key
HARVEST_ACCESS_TOKEN=your-harvest-access-token
```

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_AWS_REGION=us-east-1
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### 4. Testing

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

This comprehensive project structure provides a solid foundation for building the real-time collaborative task manager application with all the requested features.