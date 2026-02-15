import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch commonly used queries
export async function prefetchCommonQueries(userId: string) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['profile', userId],
      queryFn: async () => null, // Placeholder - actual queryFn provided by hooks
    }),
    queryClient.prefetchQuery({
      queryKey: ['contacts', userId],
      queryFn: async () => null,
    }),
  ]);
}
