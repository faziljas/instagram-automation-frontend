import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to fetch multiple API endpoints in parallel
 * This significantly improves performance by reducing sequential wait times
 * Includes request deduplication to prevent duplicate calls
 */
const requestCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
const CACHE_DURATION = 2000; // 2 seconds cache for deduplication

export function useParallelFetch<T extends Record<string, any>>(
  endpoints: Partial<Record<keyof T, string | null>>,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
  }
) {
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const endpointsRef = useRef<string>('');

  const enabled = options?.enabled !== false;
  const hasValidSession = !authLoading && !!session?.access_token;
  const shouldFetch = enabled && hasValidSession;

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false);
      return;
    }

    // Filter out null endpoints
    const validEndpoints = Object.entries(endpoints).filter(
      ([_, url]) => url !== null
    ) as Array<[keyof T, string]>;

    if (validEndpoints.length === 0) {
      setIsLoading(false);
      return;
    }

    // Create cache key from endpoints
    const cacheKey = JSON.stringify(validEndpoints.map(([_, url]) => url).sort());
    
    // Check if we're already fetching the same endpoints
    if (endpointsRef.current === cacheKey && isLoading) {
      return;
    }
    
    endpointsRef.current = cacheKey;
    setIsLoading(true);
    setError(null);

    // Fetch all endpoints in parallel with deduplication
    const fetchPromises = validEndpoints.map(async ([key, url]) => {
      const cacheEntry = requestCache.get(url);
      const now = Date.now();
      
      // Check if we have a recent cached response
      if (cacheEntry && (now - cacheEntry.timestamp) < CACHE_DURATION) {
        // If there's an ongoing request, wait for it
        if (cacheEntry.promise) {
          try {
            const result = await cacheEntry.promise;
            return { key, data: result };
          } catch (err) {
            // If cached promise failed, fetch fresh
          }
        } else {
          // Return cached data
          return { key, data: cacheEntry.data };
        }
      }

      // Create fetch promise
      const fetchPromise = (async () => {
        try {
          const { get } = await import('@/utils/api');
          const response = await get(url);
          
          // Cache the response
          requestCache.set(url, {
            data: response,
            timestamp: now,
          });
          
          // Clear promise after completion
          setTimeout(() => {
            const entry = requestCache.get(url);
            if (entry) {
              delete entry.promise;
            }
          }, 100);
          
          return response;
        } catch (err) {
          // Clear cache on error
          requestCache.delete(url);
          throw err;
        }
      })();

      // Store promise in cache for deduplication
      requestCache.set(url, {
        data: null,
        timestamp: now,
        promise: fetchPromise,
      });

      try {
        const result = await fetchPromise;
        return { key, data: result };
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err);
        return { key, data: null, error: err };
      }
    });

    Promise.all(fetchPromises)
      .then((results) => {
        const resultData: Partial<T> = {} as Partial<T>;
        let hasError = false;

        results.forEach(({ key, data, error }) => {
          if (error) {
            hasError = true;
            resultData[key] = null as any;
          } else {
            resultData[key] = data;
          }
        });

        setData(resultData);
        setIsLoading(false);

        if (options?.onSuccess && !hasError) {
          options.onSuccess(resultData as T);
        }

        if (hasError) {
          setError(new Error('Some requests failed'));
        }
      })
      .catch((err) => {
        console.error('Parallel fetch error:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [
    shouldFetch,
    JSON.stringify(Object.values(endpoints)),
    authLoading,
    session?.access_token,
  ]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      // Clear cache and trigger re-fetch
      Object.values(endpoints).forEach(url => {
        if (url) requestCache.delete(url);
      });
      setData({});
      setIsLoading(true);
    },
  };
}
