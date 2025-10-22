import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authSlice from '../features/auth/authSlice';
import tasksSlice from '../features/tasks/tasksSlice';
import projectsSlice from '../features/projects/projectsSlice';
import workspacesSlice from '../features/workspaces/workspacesSlice';
import uiSlice from '../features/ui/uiSlice';
import presenceSlice from '../features/collaboration/presence/presenceSlice';
import activitySlice from '../features/collaboration/activityFeed/activitySlice';
import notificationsSlice from '../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tasks: tasksSlice,
    projects: projectsSlice,
    workspaces: workspacesSlice,
    ui: uiSlice,
    presence: presenceSlice,
    activity: activitySlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['presence/updatePresence', 'activity/addActivity'],
        ignoredPaths: ['presence.presences', 'activity.activities'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;