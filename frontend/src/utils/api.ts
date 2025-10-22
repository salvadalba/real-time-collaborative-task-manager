import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { ApiResponse } from '../types/common';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
          localStorage.setItem(STORAGE_KEYS.refreshToken, newRefreshToken);

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          // Token refresh failed, log out user
          localStorage.removeItem(STORAGE_KEYS.accessToken);
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
          localStorage.removeItem(STORAGE_KEYS.user);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// API client instance
export const apiClient = createApiClient();

// Generic API request function
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient(config);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    
    if (axiosError.response) {
      // Server responded with error status
      return {
        success: false,
        error: {
          code: axiosError.response.data.error?.code || 'SERVER_ERROR',
          message: axiosError.response.data.error?.message || ERROR_MESSAGES.serverError,
          details: axiosError.response.data.error?.details,
        },
        timestamp: new Date().toISOString(),
      };
    } else if (axiosError.request) {
      // Network error
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: ERROR_MESSAGES.network,
        },
        timestamp: new Date().toISOString(),
      };
    } else {
      // Other error
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: ERROR_MESSAGES.unknown,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
};

// HTTP method helpers
export const get = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: 'GET', url, ...config });
};

export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: 'POST', url, data, ...config });
};

export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: 'PUT', url, data, ...config });
};

export const patch = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: 'PATCH', url, data, ...config });
};

export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ method: 'DELETE', url, ...config });
};

// File upload helper
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  additionalData?: Record<string, any>
): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return apiRequest({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};

// Download file helper
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// API endpoint builders
export const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// Error handling utilities
export const isApiError = (error: any): error is AxiosError => {
  return axios.isAxiosError(error);
};

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.response?.data?.error?.message || error.message || ERROR_MESSAGES.unknown;
  }
  return error?.message || ERROR_MESSAGES.unknown;
};

export const getErrorCode = (error: any): string => {
  if (isApiError(error)) {
    return error.response?.data?.error?.code || 'UNKNOWN_ERROR';
  }
  return 'UNKNOWN_ERROR';
};

// Retry utility
export const retryRequest = async <T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Cache utilities
export const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const getCachedData = (key: string): any | null => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

export const setCachedData = (key: string, data: any, ttl: number = 300000): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

export const clearCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

// Request cancelation utilities
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export const isCancel = (error: any): boolean => {
  return axios.isCancel(error);
};

// Export API endpoints for easy access
export { API_ENDPOINTS };