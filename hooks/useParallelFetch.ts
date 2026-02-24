import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';

const CACHE_KEY_PREFIX = 'swr_';
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 min - show last data on refresh

function getStorageKey(url: string): string {
  return CACHE_KEY_PREFIX + encodeURIComponent(url).slice(0, 180);
}

function readCached<T>(url: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(url));
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw) as { data: T; timestamp: number };
    if (Date.now() - timestamp > CACHE_DURATION_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCached<T>(url: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(url), JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore
  }
}

const requestCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
const CACHE_DURATION = 2000; // 2 seconds in-memory deduplication

export function useParallelFetch<T extends Record<string, any>>(
  endpoints: Partial<Record<keyof T, string | null>>,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
  }
) {
  const { session, loading: authLoading } = useAuth();
  const enabled = options?.enabled !== false;
  const hasValidSession = !authLoading && !!session?.access_token;
  const shouldFetch = enabled && hasValidSession;

  const initialCached = useMemo(() => {
    const entries = Object.entries(endpoints).filter(
      ([, u]): u is string => u != null
    ) as Array<[keyof T, string]>;
    const out: Partial<T> = {};
    entries.forEach(([key, url]) => {
      const c = readCached(url);
      if (c != null) (out as Record<string, unknown>)[key as string] = c;
    });
    return out;
  }, [JSON.stringify(endpoints)]);

  const [data, setData] = useState<Partial<T>>(initialCached);
  const [isLoading, setIsLoading] = useState(Object.keys(initialCached).length === 0);
  const [error, setError] = useState<Error | null>(null);
  const endpointsRef = useRef<string>('');

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
    if (Object.keys(initialCached).length === 0) setIsLoading(true);
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
            const url = validEndpoints.find(([k]) => k === key)?.[1];
            if (url && data != null) writeCached(url, data);
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
      Object.values(endpoints).forEach(url => {
        if (url) {
          requestCache.delete(url);
          if (typeof window !== 'undefined') try { localStorage.removeItem(getStorageKey(url)); } catch { /* ignore */ }
        }
      });
      setData({});
      setIsLoading(true);
    },
  };
}
