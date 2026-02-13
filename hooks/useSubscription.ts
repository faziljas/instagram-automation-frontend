import { useFetch } from './useFetch';
import { useEffect, useMemo } from 'react';

interface SubscriptionResponse {
  plan_tier: string;
  effective_plan_tier?: string;
  status: string;
  stripe_subscription_id: string | null;
  cancellation_end_date?: string | null;
  usage: {
    accounts: number;
    rules: number;
    dms_sent_this_month: number;
  };
}

const SUBSCRIPTION_CACHE_KEY = 'logicdm_subscription_cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedSubscription {
  data: SubscriptionResponse;
  timestamp: number;
}

/**
 * Custom hook for subscription data with localStorage caching
 * This prevents pro users from appearing as free users during page refresh
 */
export function useSubscription() {
  const { data, isLoading, error, mutate } = useFetch<SubscriptionResponse>('/users/subscription');

  // Load cached data on mount
  const cachedData = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
      if (cached) {
        const parsed: CachedSubscription = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        // Use cache if less than 5 minutes old
        if (age < CACHE_EXPIRY_MS) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('Failed to read subscription cache:', e);
    }
    return null;
  }, []);

  // Update cache when data changes
  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      try {
        const cache: CachedSubscription = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
      } catch (e) {
        console.warn('Failed to cache subscription data:', e);
      }
    }
  }, [data]);

  // Use cached data optimistically while loading
  const subscriptionData = data || cachedData;

  // Determine if user has pro plan (use cached data if available)
  const hasProPlan = useMemo(() => {
    const planTier = subscriptionData?.plan_tier || subscriptionData?.effective_plan_tier;
    return planTier === 'pro' || planTier === 'enterprise';
  }, [subscriptionData]);

  // Plan tier with fallback
  const planTier = subscriptionData?.plan_tier || subscriptionData?.effective_plan_tier || 'free';

  return {
    data: subscriptionData,
    isLoading: isLoading && !cachedData, // Don't show loading if we have cached data
    error,
    mutate: async (newData?: SubscriptionResponse, options?: Parameters<typeof mutate>[1]) => {
      // Clear cache when mutating
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        } catch (e) {
          console.warn('Failed to clear subscription cache:', e);
        }
      }
      return mutate(newData, options);
    },
    hasProPlan,
    planTier,
  };
}
