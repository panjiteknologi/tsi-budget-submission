import { authStore } from './auth-store';
import type { User } from '@/types/api';

/**
 * Extract access_token from URL query parameters
 * @param url - URL string or URLSearchParams
 * @returns access_token if found, null otherwise
 */
export function extractTokenFromUrl(url?: string | URLSearchParams): string | null {
  let searchParams: URLSearchParams;

  if (typeof url === 'string') {
    try {
      const urlObj = new URL(url, window.location.origin);
      searchParams = urlObj.searchParams;
    } catch {
      // If URL parsing fails, try to parse as query string
      searchParams = new URLSearchParams(url);
    }
  } else if (url instanceof URLSearchParams) {
    searchParams = url;
  } else {
    // Use current window location
    searchParams = new URLSearchParams(window.location.search);
  }

  return searchParams.get('access_token');
}

/**
 * Handle auto login from URL parameter
 * @param token - Access token from URL
 * @param user - Optional user data
 * @returns Promise that resolves when login is complete
 */
export async function handleAutoLoginFromUrl(
  token: string,
  user?: User | null
): Promise<void> {
  if (!token) {
    return;
  }

  // Save token to auth store
  authStore.setAccessToken(token, user);

  // Clean URL by removing access_token parameter
  cleanTokenFromUrl();
}

/**
 * Clean access_token from URL without page reload
 */
export function cleanTokenFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('access_token');

  // Update URL without reloading page
  window.history.replaceState({}, '', url.toString());
}

/**
 * Check and handle token from URL on page load
 * This should be called in the root component or router
 */
export function handleTokenFromUrlOnLoad(): void {
  if (typeof window === 'undefined') return;

  const token = extractTokenFromUrl();
  if (token) {
    handleAutoLoginFromUrl(token);
  }
}

/**
 * Get token from URL and clean it, returning the token
 * Useful for one-time extraction
 */
export function extractAndCleanTokenFromUrl(): string | null {
  const token = extractTokenFromUrl();
  if (token) {
    cleanTokenFromUrl();
  }
  return token;
}

