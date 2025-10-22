import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthTokens, LoginCredentials, RegisterData } from '../../../types/user';
import { apiClient } from '../../../utils/api';
import { storage } from '../../../utils/helpers';
import { STORAGE_KEYS } from '../../../utils/constants';

// Auth state interface
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens in localStorage
        storage.set(STORAGE_KEYS.accessToken, tokens.accessToken);
        storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
        storage.set(STORAGE_KEYS.user, user);
        
        return { user, tokens };
      } else {
        return rejectWithValue(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens in localStorage
        storage.set(STORAGE_KEYS.accessToken, tokens.accessToken);
        storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
        storage.set(STORAGE_KEYS.user, user);
        
        return { user, tokens };
      } else {
        return rejectWithValue(response.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = storage.get(STORAGE_KEYS.refreshToken);
      
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refreshToken,
      });
      
      if (response.success && response.data) {
        const { tokens } = response.data;
        
        // Update tokens in localStorage
        storage.set(STORAGE_KEYS.accessToken, tokens.accessToken);
        storage.set(STORAGE_KEYS.refreshToken, tokens.refreshToken);
        
        return tokens;
      } else {
        return rejectWithValue(response.error?.message || 'Token refresh failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = storage.get(STORAGE_KEYS.refreshToken);
      
      if (refreshToken) {
        // Call logout endpoint to invalidate refresh token
        await apiClient.post('/auth/logout', {
          refreshToken,
        });
      }
      
      // Clear localStorage
      storage.remove(STORAGE_KEYS.accessToken);
      storage.remove(STORAGE_KEYS.refreshToken);
      storage.remove(STORAGE_KEYS.user);
      
      return true;
    } catch (error: any) {
      // Still clear localStorage even if API call fails
      storage.remove(STORAGE_KEYS.accessToken);
      storage.remove(STORAGE_KEYS.refreshToken);
      storage.remove(STORAGE_KEYS.user);
      
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.success && response.data) {
        return response.data.user;
      } else {
        return rejectWithValue(response.error?.message || 'Failed to get user');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get user');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      if (response.success) {
        return true;
      } else {
        return rejectWithValue(response.error?.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/reset-password', data);
      
      if (response.success) {
        return true;
      } else {
        return rejectWithValue(response.error?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset password');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      
      if (response.success) {
        return true;
      } else {
        return rejectWithValue(response.error?.message || 'Failed to verify email');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify email');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const accessToken = storage.get(STORAGE_KEYS.accessToken);
      const refreshToken = storage.get(STORAGE_KEYS.refreshToken);
      const user = storage.get(STORAGE_KEYS.user);
      
      if (accessToken && refreshToken && user) {
        state.user = user;
        state.tokens = { accessToken, refreshToken };
        state.isAuthenticated = true;
      }
      
      state.isInitialized = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        storage.set(STORAGE_KEYS.user, state.user);
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.tokens = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If refresh fails, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
        storage.remove(STORAGE_KEYS.accessToken);
        storage.remove(STORAGE_KEYS.refreshToken);
        storage.remove(STORAGE_KEYS.user);
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Still logout user even if API call fails
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If getting current user fails, user might not be authenticated
        if (action.payload === 'Failed to get user') {
          state.isAuthenticated = false;
          state.user = null;
          state.tokens = null;
          storage.remove(STORAGE_KEYS.accessToken);
          storage.remove(STORAGE_KEYS.refreshToken);
          storage.remove(STORAGE_KEYS.user);
        }
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify Email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, initializeAuth, updateUser } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTokens = (state: { auth: AuthState }) => state.auth.tokens;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;

// Export reducer
export default authSlice.reducer;