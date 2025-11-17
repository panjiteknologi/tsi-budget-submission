import type { ApiResponse, ApiError } from '@/types/api';
import { authStore } from './auth-store';

// Get API base URL based on environment
function getApiBaseUrl(): string {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:80';
  }
  return (
    import.meta.env.VITE_API_BASE_URL_PROD || 'https://erp.tsicertification.com'
  );
}

// Get access token from auth store
function getAccessToken(): string | null {
  return authStore.getAccessToken();
}

// API Client Error class
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: ApiError
  ) {
    super(data?.message || statusText);
    this.name = 'ApiClientError';
  }
}

// API Client configuration
export interface ApiClientConfig extends RequestInit {
  skipAuth?: boolean; // Skip adding Authorization header
  baseURL?: string; // Override base URL
}

// Main API client function
export async function apiClient<T = unknown>(
  endpoint: string,
  config: ApiClientConfig = {}
): Promise<T> {
  const { skipAuth = false, baseURL, ...fetchConfig } = config;

  // Build full URL
  const base = baseURL || getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  // Prepare headers
  const headers = new Headers(fetchConfig.headers);

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set default content type for JSON requests
  if (
    !headers.has('Content-Type') &&
    (fetchConfig.method === 'POST' ||
      fetchConfig.method === 'PUT' ||
      fetchConfig.method === 'PATCH')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: ApiResponse<T> | T;

    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? (JSON.parse(text) as T) : ({} as T);
    }

    // Handle error responses
    if (!response.ok) {
      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          // Optionally trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        // Could trigger a permission error event
        window.dispatchEvent(new CustomEvent('auth:forbidden'));
      }

      const errorData = (data as ApiResponse<T>).error || {
        message: response.statusText,
        code: response.status.toString()
      };

      throw new ApiClientError(response.status, response.statusText, errorData);
    }

    // Handle JSON-RPC format (has 'result' property)
    if (
      typeof data === 'object' &&
      data !== null &&
      'result' in data &&
      'jsonrpc' in data
    ) {
      // Check for JSON-RPC error
      if ('error' in data && data.error) {
        const errorData = {
          message:
            (data.error as { message?: string }).message || 'JSON-RPC error',
          code: (data.error as { code?: string | number }).code?.toString()
        };
        throw new ApiClientError(
          response.status || 500,
          'JSON-RPC Error',
          errorData
        );
      }
      // Return JSON-RPC result directly
      return data as T;
    }

    // Return data from ApiResponse wrapper if present (has 'data' property)
    if (typeof data === 'object' && data !== null && 'data' in data) {
      return (data as ApiResponse<T>).data as T;
    }

    return data as T;
  } catch (error) {
    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiClientError(0, 'Network error', {
        message:
          'Failed to connect to the server. Please check your connection.'
      });
    }

    // Re-throw unknown errors
    throw error;
  }
}

// Convenience methods
export const api = {
  get: <T = unknown>(endpoint: string, config?: ApiClientConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: ApiClientConfig
  ) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  put: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: ApiClientConfig
  ) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: ApiClientConfig
  ) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T = unknown>(endpoint: string, config?: ApiClientConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'DELETE' })
};

export default apiClient;
