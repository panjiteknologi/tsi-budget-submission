import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db';
import { z } from 'zod';
import type { User } from '@/types/api';

// Auth state schema
const AuthStateSchema = z.object({
  access_token: z.string().nullable(),
  user: z.object({
    id: z.union([z.string(), z.number()]),
    email: z.string(),
    name: z.string().optional(),
  }).nullable(),
  isAuthenticated: z.boolean(),
});

export type AuthState = z.infer<typeof AuthStateSchema>;

// Create auth collection
export const authCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: () => 'auth', // Single auth state entry
    schema: AuthStateSchema,
    initialData: [
      {
        id: 'auth',
        access_token: null,
        user: null,
        isAuthenticated: false,
      },
    ],
  })
);

// Helper functions to work with auth collection
// Note: These use localStorage as source of truth
// The collection can be used in components via hooks for reactive updates
export const authHelpers = {
  // Get current auth state from localStorage
  getAuthState: (): AuthState | null => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    let user: User | null = null;
    
    if (userStr) {
      try {
        user = JSON.parse(userStr) as User;
      } catch {
        // Invalid user data
      }
    }
    
    return {
      id: 'auth',
      access_token: token,
      user: user,
      isAuthenticated: !!token,
    };
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  // Get access token
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  // Get user
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  },
};

