import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store } from './store';
import { lightTheme, darkTheme, getTheme } from './styles/theme';
import { useAppSelector } from './store';
import { storage } from './utils/helpers';
import { STORAGE_KEYS } from './utils/constants';

// Layout components
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Page components
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import DashboardPage from './pages/dashboard/Dashboard';
import TasksPage from './pages/tasks/TasksPage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import AnalyticsPage from './pages/analytics/Analytics';
import SettingsPage from './pages/settings/Settings';
import NotFoundPage from './pages/NotFound';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public route component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme and check authentication
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme preference
        const savedTheme = storage.get<'light' | 'dark'>('theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }

        // Check if user is authenticated (this will be handled by auth slice)
        // For now, we'll just simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle theme changes
  useEffect(() => {
    storage.set('theme', theme);
  }, [theme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const currentTheme = getTheme(theme);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;