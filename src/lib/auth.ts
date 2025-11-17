import { createAuthClient } from 'better-auth/react';

// Helper function to get API base URL based on environment
function getApiBaseUrl(): string {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:80';
  }
  return (
    import.meta.env.VITE_API_BASE_URL_PROD || 'https://erp.tsicertification.com'
  );
}

// Better-auth client configuration
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || getApiBaseUrl(),
  // Use localStorage for token storage
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  // Base path for auth endpoints (adjust based on your API structure)
  basePath: '/auth'
});

// Auth utilities
export const auth = {
  // Get current session/token
  getSession: async () => {
    try {
      const session = await authClient.getSession();
      return session;
    } catch (error) {
      return null;
    }
  },

  // Sign in (for custom login flow)
  signIn: async (_email: string, _password: string) => {
    // This will be handled by our custom API client
    // better-auth can be used for session management
    return null;
  },

  // Sign out
  signOut: async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
};

// Export auth client for use in components
export default authClient;
