import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api-client';

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Use API client as default query function
        queryFn: async ({ queryKey }) => {
          const [endpoint] = queryKey as [string, ...unknown[]];
          if (typeof endpoint !== 'string') {
            throw new Error('Query key must start with a string endpoint');
          }
          return apiClient(endpoint);
        },
        // Error handling
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (
            error instanceof ApiClientError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Stale time configuration
        staleTime: 1000 * 60 * 5 // 5 minutes
      },
      mutations: {
        // Error handling for mutations
        // Note: mutationFn is defined per-use with useMutation, not as a default
        onError: (error) => {
          if (error instanceof ApiClientError) {
            // Handle specific error cases
            if (error.status === 401) {
              // Unauthorized - token might be invalid
              console.error('Unauthorized request');
            } else if (error.status === 403) {
              // Forbidden - user doesn't have permission
              console.error('Forbidden request');
            }
          }
        }
      }
    }
  });

  return {
    queryClient
  };
}

export function Provider({
  children,
  queryClient
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
