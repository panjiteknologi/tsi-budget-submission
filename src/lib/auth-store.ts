import type { User, LoginResponse } from '@/types/api';
import { authClient } from './auth';

// Auth store for managing authentication state
// Uses localStorage as primary storage
// TanStack DB collection can be used in components via hooks for reactive updates
export const authStore = {
  // Set access token and update auth state
  setAccessToken: (token: string, user?: User | null) => {
    // Update localStorage (primary storage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }

      // Dispatch custom event for components using TanStack DB hooks to react
      window.dispatchEvent(
        new CustomEvent('auth:token-updated', {
          detail: { token, user }
        })
      );
    }

    // Sync with better-auth if needed
    // Note: better-auth might handle this differently based on your setup
  },

  // Clear access token and logout
  clearAccessToken: async () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Dispatch custom event for components using TanStack DB hooks to react
      window.dispatchEvent(new CustomEvent('auth:token-cleared'));
    }

    // Sign out from better-auth
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Error signing out from better-auth:', error);
    }
  },

  // Get access token
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  // Get current user
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

  // Check if authenticated
  isAuthenticated: (): boolean => {
    const token = authStore.getAccessToken();
    return !!token;
  },

  // Handle login response (for JSON-RPC format)
  handleLoginResponse: (response: LoginResponse) => {
    const userData = response.result;
    const user: User = {
      id: userData.user_id,
      email: '', // Email not in response, will need to be set separately
      name: userData.user_name,
      user_id: userData.user_id,
      user_name: userData.user_name,
      department: userData.department,
      is_auditor: userData.is_auditor,
    };
    authStore.setAccessToken(userData.access_token, user);
  }
};
