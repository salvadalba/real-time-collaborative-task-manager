# Comprehensive Testing Guide

## Overview

This guide provides a comprehensive testing strategy for the real-time collaborative task manager application, including unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Stack

### Frontend Testing
- **Framework**: Jest + React Testing Library
- **Component Testing**: @testing-library/react
- **Mocking**: MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Visual Testing**: Chromatic
- **Coverage**: Jest Coverage

### Backend Testing
- **Framework**: Jest + Supertest
- **Database Testing**: Test Database with Prisma
- **Mocking**: Jest Mocks
- **API Testing**: Supertest
- **Integration Testing**: Docker Compose Test Environment

### Performance Testing
- **Load Testing**: Artillery
- **Performance Monitoring**: Lighthouse CI
- **Memory Testing**: Node.js Profiler

## 1. Unit Testing

### Frontend Unit Tests

#### Component Testing Example

```typescript
// frontend/src/components/common/Button/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Button } from './Button';
import { theme } from '../../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  test('renders button with text', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    renderWithTheme(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('applies correct variant styles', () => {
    renderWithTheme(<Button variant="contained">Contained</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-contained');
  });
});
```

#### Hook Testing Example

```typescript
// frontend/src/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import * as authApi from '../features/auth/authApi';

// Mock API
jest.mock('../features/auth/authApi');
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('initial state is not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('login sets authentication state', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const mockTokens = {
      accessToken: 'access_token',
      refreshToken: 'refresh_token'
    };

    mockAuthApi.login.mockResolvedValue({
      user: mockUser,
      tokens: mockTokens
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('accessToken')).toBe('access_token');
  });

  test('logout clears authentication state', async () => {
    // Set initial authenticated state
    localStorage.setItem('accessToken', 'access_token');
    localStorage.setItem('refreshToken', 'refresh_token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
```

#### Redux Slice Testing

```typescript
// frontend/src/features/tasks/tasksSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask
} from './tasksSlice';
import { Task } from '../../../types/task';

describe('Tasks Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: tasksReducer
      }
    });
  });

  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    projectId: '1',
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  describe('reducers', () => {
    test('should handle initial state', () => {
      const state = store.getState().tasks;
      expect(state.tasks).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('async thunks', () => {
    test('fetchTasks.fulfilled sets tasks and loading', async () => {
      const mockTasks = [mockTask];
      
      await store.dispatch(fetchTasks({ projectId: '1' }) as any);
      
      const state = store.getState().tasks;
      expect(state.tasks).toEqual(mockTasks);
      expect(state.loading).toBe(false);
    });

    test('createTask.fulfilled adds new task', async () => {
      await store.dispatch(createTask(mockTask) as any);
      
      const state = store.getState().tasks;
      expect(state.tasks).toContainEqual(mockTask);
    });

    test('updateTask.fulfilled updates existing task', async () => {
      // First add a task
      await store.dispatch(createTask(mockTask) as any);
      
      // Then update it
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      await store.dispatch(updateTask(updatedTask) as any);
      
      const state = store.getState().tasks;
      expect(state.tasks).toContainEqual(updatedTask);
    });

    test('deleteTask.fulfilled removes task', async () => {
      // First add a task
      await store.dispatch(createTask(mockTask) as any);
      
      // Then delete it
      await store.dispatch(deleteTask(mockTask.id) as any);
      
      const state = store.getState().tasks;
      expect(state.tasks).not.toContainEqual(mockTask);
    });
  });
});
```

### Backend Unit Tests

#### Service Testing

```typescript
// backend/src/services/taskService.test.ts
import { TaskService } from './taskService';
import { prisma } from '../database/connection';
import { TaskStatus, Priority } from '@prisma/client';

jest.mock('../database/connection');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    test('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        projectId: 'project-1',
        priority: Priority.MEDIUM,
        position: 1
      };

      const createdTask = {
        id: 'task-1',
        ...taskData,
        status: TaskStatus.TODO,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.task.create.mockResolvedValue(createdTask);

      const result = await taskService.createTask(taskData);

      expect(result).toEqual(createdTask);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: taskData
      });
    });

    test('should throw error when creation fails', async () => {
      const taskData = {
        title: 'Test Task',
        projectId: 'project-1'
      };

      mockPrisma.task.create.mockRejectedValue(new Error('Database error'));

      await expect(taskService.createTask(taskData)).rejects.toThrow('Database error');
    });
  });

  describe('getTasksByProject', () => {
    test('should return tasks for a project', async () => {
      const projectId = 'project-1';
      const tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          projectId,
          status: TaskStatus.TODO
        },
        {
          id: 'task-2',
          title: 'Task 2',
          projectId,
          status: TaskStatus.DONE
        }
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await taskService.getTasksByProject(projectId);

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId },
        orderBy: { position: 'asc' }
      });
    });
  });
});
```

#### Controller Testing

```typescript
// backend/src/controllers/taskController.test.ts
import request from 'supertest';
import { app } from '../app';
import { TaskService } from '../services/taskService';
import { generateToken } from '../utils/auth';

jest.mock('../services/taskService');
const mockTaskService = TaskService as jest.MockedClass<typeof TaskService>;

describe('Task Controller', () => {
  let authToken: string;

  beforeEach(() => {
    authToken = generateToken({ userId: 'user-1', email: 'test@example.com' });
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    test('should return tasks for authenticated user', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Test Task',
          projectId: 'project-1'
        }
      ];

      mockTaskService.prototype.getTasks.mockResolvedValue({
        tasks: mockTasks,
        total: 1,
        limit: 20,
        offset: 0
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toEqual(mockTasks);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
  });

  describe('POST /api/tasks', () => {
    test('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        projectId: 'project-1',
        priority: 'medium'
      };

      const createdTask = {
        id: 'task-1',
        ...taskData,
        status: 'todo',
        createdAt: new Date().toISOString()
      };

      mockTaskService.prototype.createTask.mockResolvedValue(createdTask);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdTask);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## 2. Integration Testing

### API Integration Tests

```typescript
// backend/tests/integration/tasks.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database/connection';
import { generateToken } from '../../src/utils/auth';

describe('Tasks API Integration', () => {
  let authToken: string;
  let userId: string;
  let workspaceId: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    userId = user.id;
    authToken = generateToken({ userId, email: user.email });

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        ownerId: userId
      }
    });
    workspaceId = workspace.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        workspaceId,
        createdBy: userId
      }
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.task.deleteMany({
      where: { projectId }
    });
    await prisma.project.delete({
      where: { id: projectId }
    });
    await prisma.workspace.delete({
      where: { id: workspaceId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
    
    await prisma.$disconnect();
  });

  describe('Task CRUD Operations', () => {
    test('POST /api/tasks - create task', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Testing task creation',
        projectId,
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.projectId).toBe(projectId);
    });

    test('GET /api/tasks - list tasks', async () => {
      const response = await request(app)
        .get(`/api/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.tasks.length).toBeGreaterThan(0);
    });

    test('PUT /api/tasks/:id - update task', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Update',
          projectId
        });

      const taskId = createResponse.body.data.id;

      // Update the task
      const updateData = {
        title: 'Updated Task Title',
        status: 'in_progress'
      };

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.title).toBe(updateData.title);
      expect(updateResponse.body.data.status).toBe(updateData.status);
    });

    test('DELETE /api/tasks/:id - delete task', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete',
          projectId
        });

      const taskId = createResponse.body.data.id;

      // Delete the task
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### Real-time Features Integration Tests

```typescript
// backend/tests/integration/socket.test.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import { setupSocketHandlers } from '../../src/socket/socketHandler';

describe('Socket.io Integration', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    setupSocketHandlers(io);
    
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: 'valid_jwt_token'
        }
      });
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should handle task updates', (done) => {
    const taskData = {
      id: 'task-1',
      title: 'Updated Task',
      status: 'done'
    };

    serverSocket.emit('task:updated', { task: taskData });
    
    clientSocket.on('task:updated', (data: any) => {
      expect(data.task.title).toBe(taskData.title);
      done();
    });
  });

  test('should handle presence updates', (done) => {
    const presenceData = {
      userId: 'user-1',
      entityType: 'task',
      entityId: 'task-1',
      status: 'editing'
    };

    clientSocket.emit('presence:update', presenceData);
    
    serverSocket.on('presence:update', (data: any) => {
      expect(data.userId).toBe(presenceData.userId);
      expect(data.status).toBe(presenceData.status);
      done();
    });
  });
});
```

## 3. End-to-End Testing

### E2E Test Configuration

```typescript
// tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/task-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/projects/project-1/tasks');
    
    // Click create task button
    await page.click('[data-testid=create-task-button]');
    
    // Fill task form
    await page.fill('[data-testid=task-title-input]', 'E2E Test Task');
    await page.fill('[data-testid=task-description-textarea]', 'This is a test task created by E2E tests');
    await page.selectOption('[data-testid=task-priority-select]', 'high');
    
    // Submit form
    await page.click('[data-testid=save-task-button]');
    
    // Verify task was created
    await expect(page.locator('[data-testid=task-list]')).toContainText('E2E Test Task');
    await expect(page.locator('[data-testid=task-item][data-task-status="todo"]')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/projects/project-1/tasks');
    
    // Find a task and update its status
    const taskItem = page.locator('[data-testid=task-item]').first();
    await taskItem.click();
    
    // Change status to in progress
    await page.click('[data-testid=status-dropdown]');
    await page.click('[data-testid=status-in-progress]');
    
    // Verify status was updated
    await expect(taskItem.locator('[data-testid-task-status="in_progress"]')).toBeVisible();
  });

  test('should add comment to task', async ({ page }) => {
    await page.goto('/projects/project-1/tasks/task-1');
    
    // Add comment
    await page.fill('[data-testid=comment-input]', 'This is a test comment');
    await page.click('[data-testid=comment-submit-button]');
    
    // Verify comment was added
    await expect(page.locator('[data-testid=comment-list]')).toContainText('This is a test comment');
  });

  test('should upload file attachment', async ({ page }) => {
    await page.goto('/projects/project-1/tasks/task-1');
    
    // Upload file
    const fileInput = page.locator('[data-testid=file-input]');
    await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
    
    // Wait for upload to complete
    await expect(page.locator('[data-testid=upload-progress]')).toBeHidden();
    await expect(page.locator('[data-testid=attachment-item]')).toBeVisible();
  });
});
```

### Real-time Collaboration E2E Tests

```typescript
// tests/e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test('should show user presence indicators', async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login as first user
    await page1.goto('/login');
    await page1.fill('[data-testid=email-input]', 'user1@example.com');
    await page1.fill('[data-testid=password-input]', 'password123');
    await page1.click('[data-testid=login-button]');
    
    // Login as second user
    await page2.goto('/login');
    await page2.fill('[data-testid=email-input]', 'user2@example.com');
    await page2.fill('[data-testid=password-input]', 'password123');
    await page2.click('[data-testid=login-button]');
    
    // Navigate to same task
    await page1.goto('/projects/project-1/tasks/task-1');
    await page2.goto('/projects/project-1/tasks/task-1');
    
    // Verify presence indicators
    await expect(page1.locator('[data-testid=presence-indicator]')).toContainText('user2@example.com');
    await expect(page2.locator('[data-testid=presence-indicator]')).toContainText('user1@example.com');
    
    await context1.close();
    await context2.close();
  });

  test('should handle concurrent editing', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Setup both users on the same task
    await setupUser(page1, 'user1@example.com');
    await setupUser(page2, 'user2@example.com');
    
    await page1.goto('/projects/project-1/tasks/task-1');
    await page2.goto('/projects/project-1/tasks/task-1');
    
    // User 1 edits task description
    await page1.click('[data-testid=edit-description-button]');
    const descriptionEditor1 = page1.locator('[data-testid=description-editor]');
    await descriptionEditor1.fill('User 1 is editing');
    
    // User 2 simultaneously edits the same description
    await page2.click('[data-testid=edit-description-button]');
    const descriptionEditor2 = page2.locator('[data-testid=description-editor]');
    await descriptionEditor2.fill('User 2 is editing');
    
    // Both users save
    await page1.click('[data-testid=save-description-button]');
    await page2.click('[data-testid=save-description-button]');
    
    // Verify operational transform worked correctly
    await page1.waitForTimeout(1000); // Wait for sync
    const finalContent1 = await page1.locator('[data-testid=task-description]').textContent();
    const finalContent2 = await page2.locator('[data-testid=task-description]').textContent();
    
    expect(finalContent1).toBe(finalContent2);
    
    await context1.close();
    await context2.close();
  });

  async function setupUser(page: any, email: string) {
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', email);
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    await page.waitForURL('/dashboard');
  }
});
```

## 4. Performance Testing

### Load Testing Configuration

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  payload:
    path: 'tests/performance/users.csv'
    fields:
      - 'email'
      - 'password'

scenarios:
  - name: 'Login and Browse Tasks'
    weight: 70
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
          capture:
            - json: '$.data.tokens.accessToken'
              as: 'authToken'
      
      - get:
          url: '/api/tasks'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      
      - get:
          url: '/api/projects'
          headers:
            Authorization: 'Bearer {{ authToken }}'

  - name: 'Create and Update Tasks'
    weight: 30
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
          capture:
            - json: '$.data.tokens.accessToken'
              as: 'authToken'
      
      - post:
          url: '/api/tasks'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            title: 'Performance Test Task'
            description: 'Task created during load test'
            projectId: 'test-project-id'
            priority: 'medium'
      
      - think: 2
      
      - loop:
          - put:
              url: '/api/tasks/{{ previousResponse.data.id }}'
              headers:
                Authorization: 'Bearer {{ authToken }}'
              json:
                status: 'in_progress'
          - think: 1
        count: 5
```

### Performance Monitoring

```typescript
// tests/performance/monitoring.ts
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      this.measurements.get(name)!.push(duration);
    };
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    const sorted = measurements.sort((a, b) => a - b);
    
    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }

  reset() {
    this.measurements.clear();
  }
}
```

## 5. Testing Database Setup

### Test Database Configuration

```typescript
// tests/setup/test-database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/taskmanager_test'
    }
  }
});

export async function setupTestDatabase() {
  // Connect to test database
  await prisma.$connect();
  
  // Run migrations
  // This would typically be handled by Prisma migrate
  await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS public`;
  
  // Clean database before tests
  await cleanupTestDatabase();
}

export async function cleanupTestDatabase() {
  // Delete all data in correct order to respect foreign key constraints
  const tablenames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

export { prisma as testPrisma };
```

### Jest Configuration

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup/jest.setup.ts"],
  "testMatch": [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/tests/**/*.test.ts"
  ],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/types/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

## 6. CI/CD Testing Pipeline

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: taskmanager_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/package-lock.json
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm run test:ci
        env:
          CI: true
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run Backend Tests
        run: |
          cd backend
          npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/taskmanager_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
      
      - name: Upload Coverage Reports
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info,./backend/coverage/lcov.info

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Test Environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30 # Wait for services to be ready
      
      - name: Run Integration Tests
        run: |
          cd backend
          npm run test:integration
      
      - name: Cleanup Test Environment
        run: |
          docker-compose -f docker-compose.test.yml down -v

  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
      
      - name: Install Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps
      
      - name: Start Application
        run: |
          docker-compose -f docker-compose.e2e.yml up -d
          sleep 30
      
      - name: Run E2E Tests
        run: |
          cd frontend
          npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

This comprehensive testing guide provides all the necessary components to ensure the reliability and performance of the real-time collaborative task manager application across all levels of testing.