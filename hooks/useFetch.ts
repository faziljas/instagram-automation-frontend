import useSWR, { SWRConfiguration } from 'swr';
import { get } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useMemo, useEffect } from 'react';

interface UseFetchOptions<T> extends SWRConfiguration<T> {
  enabled?: boolean;
  cacheTime?: number; // Cache time in milliseconds (default: 30 seconds for most endpoints)
}

// Cache configuration for different endpoint types
const CACHE_TIMES: Record<string, number> = {
  '/users/subscription': 5 * 60 * 1000, // 5 minutes (already cached in useSubscription)
  '/users/me': 2 * 60 * 1000, // 2 minutes
  '/users/me/accounts': 1 * 60 * 1000, // 1 minute
  '/users/me/dashboard': 2 * 60 * 1000, // 2 min - show last data immediately on refresh
  '/automation/rules': 30 * 1000, // 30 seconds
  // Analytics + media should feel "live" – keep cache short
  '/api/analytics': 60 * 1000, // 1 minute
  '/api/instagram/media': 60 * 1000, // 1 minute - automations/DM stats refresh quickly
  '/api/leads': 60 * 1000, // 1 minute
};

const CACHE_KEY_PREFIX = 'swr_';

function getCacheTtlForUrl(url: string | null): number {
  if (!url) return 30000;
  for (const [pattern, time] of Object.entries(CACHE_TIMES)) {
    if (url.includes(pattern)) return time;
  }
  return 30000;
}

function getStorageKey(url: string): string {
  return CACHE_KEY_PREFIX + encodeURIComponent(url).slice(0, 180);
}

function readCache<T>(url: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(url));
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw) as { data: T; timestamp: number };
    const ttl = getCacheTtlForUrl(url);
    if (Date.now() - timestamp > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache<T>(url: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      getStorageKey(url),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore quota / private mode
  }
}

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

  const cachedData = useMemo(
    () => (url && typeof window !== 'undefined' ? readCache<T>(url) : null),
    [url]
  );

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

  useEffect(() => {
    if (url && response.data != null) writeCache(url, response.data);
  }, [url, response.data]);

  const dataToShow = response.data ?? cachedData;

  return {
    data: dataToShow,
    error: response.error,
    isLoading: !dataToShow && !response.error,
    isValidating: response.isValidating,
    mutate: response.mutate,
  };
}