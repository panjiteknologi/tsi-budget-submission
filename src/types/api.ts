// API Response Types
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success?: boolean;
}

// Auth Types
export interface LoginRequest {
  params: {
    db: string;
    login: string;
    password: string;
  };
}

export interface LoginResponse {
  jsonrpc: string;
  id: null;
  result: {
    result: string;
    user_id: number;
    user_name: string;
    access_token: string;
    department?: {
      id: number;
      name: string;
    };
    is_auditor: boolean;
  };
}

export interface User {
  id: string | number;
  email: string;
  name?: string;
  user_id?: number;
  user_name?: string;
  department?: {
    id: number;
    name: string;
  };
  is_auditor?: boolean;
  [key: string]: unknown;
}

export interface AuthState {
  access_token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
