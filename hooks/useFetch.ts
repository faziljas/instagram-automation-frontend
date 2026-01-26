import useSWR, { SWRConfiguration } from 'swr';
import { get } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

interface UseFetchOptions<T> extends SWRConfiguration<T> {
  enabled?: boolean;
}

export function useFetch<T = unknown>(
  url: string | null,
  options?: UseFetchOptions<T>
) {
  const { session, loading: authLoading } = useAuth();
  const { enabled = true, ...swrOptions } = options || {};

  // CRITICAL: Don't fetch until session is loaded and available
  // Check both loading state and session token existence
  const hasValidSession = !authLoading && !!session?.access_token;
  const shouldFetch = enabled && url !== null && hasValidSession;

  const response = useSWR<T, Error>(
    shouldFetch ? url : null,
    async (url: string) => {
      // The Axios interceptor in @/utils/api will handle token injection
      // We've already verified session exists via shouldFetch check above
      const response = await get<T>(url);
      return response;
    },
    {
      revalidateOnFocus: true, // Revalidate when window regains focus
      refreshInterval: 0, // Disable auto-refresh (we'll handle it manually)
      dedupingInterval: 1000, // Dedupe requests within 1 second
      ...swrOptions,
    }
  );

  return {
    data: response.data,
    error: response.error,
    isLoading: (!response.error && !response.data) || authLoading || !hasValidSession,
    isValidating: response.isValidating,
    mutate: response.mutate,
  };
}