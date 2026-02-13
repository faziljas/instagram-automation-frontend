import useSWR, { SWRConfiguration } from 'swr';
import { get } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

interface UseFetchOptions<T> extends SWRConfiguration<T> {
  enabled?: boolean;
  cacheTime?: number; // Cache time in milliseconds (default: 30 seconds for most endpoints)
}

// Cache configuration for different endpoint types
const CACHE_TIMES: Record<string, number> = {
  '/users/subscription': 5 * 60 * 1000, // 5 minutes (already cached in useSubscription)
  '/users/me': 2 * 60 * 1000, // 2 minutes
  '/users/me/accounts': 1 * 60 * 1000, // 1 minute
  '/users/me/dashboard': 30 * 1000, // 30 seconds
  '/automation/rules': 30 * 1000, // 30 seconds
  '/api/analytics': 5 * 60 * 1000, // 5 minutes - increased for better performance
  '/api/leads': 30 * 1000, // 30 seconds
};

export function useFetch<T = unknown>(
  url: string | null,
  options?: UseFetchOptions<T>
) {
  const { session, loading: authLoading } = useAuth();
  const { enabled = true, cacheTime, ...swrOptions } = options || {};

  // CRITICAL: Don't fetch until session is loaded and available
  // Check both loading state and session token existence
  const hasValidSession = !authLoading && !!session?.access_token;
  const shouldFetch = enabled && url !== null && hasValidSession;

  // Determine cache time based on URL pattern
  const getCacheTime = (url: string | null): number => {
    if (!url) return 30000; // Default 30 seconds
    
    // Check for specific endpoint matches
    for (const [pattern, time] of Object.entries(CACHE_TIMES)) {
      if (url.includes(pattern)) {
        return time;
      }
    }
    
    // Use provided cacheTime or default
    return cacheTime || 30000; // Default 30 seconds
  };

  const response = useSWR<T, Error>(
    shouldFetch ? url : null,
    async (url: string) => {
      // The Axios interceptor in @/utils/api will handle token injection
      // We've already verified session exists via shouldFetch check above
      const response = await get<T>(url);
      return response;
    },
    {
      revalidateOnFocus: false, // Changed to false - reduce unnecessary refetches
      revalidateOnReconnect: true, // Still revalidate on reconnect
      refreshInterval: 0, // Disable auto-refresh (we'll handle it manually)
      dedupingInterval: getCacheTime(url), // Use cache time based on endpoint for deduplication
      focusThrottleInterval: 5000, // Throttle focus revalidation to 5 seconds
      ...swrOptions,
      // Override dedupingInterval if explicitly provided in options
      ...(swrOptions.dedupingInterval !== undefined ? {} : {}),
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