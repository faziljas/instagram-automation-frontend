'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFetch } from '@/hooks/useFetch';
import { usePost } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { get, post } from '@/utils/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionUsageData {
  accounts: number;
  rules: number;
  dms_sent_this_month: number;
}

interface SubscriptionResponse {
  plan_tier: string;
  effective_plan_tier: string;  // Effective plan tier for display (shows Pro limits if still within paid Pro cycle)
  status: string;
  stripe_subscription_id: string | null;
  cancellation_end_date: string | null;  // When Pro access ends after cancellation (ISO format)
  usage: SubscriptionUsageData;
}

// Plan limits
const PLAN_LIMITS: Record<string, { accounts: number; rules: number; dms: number }> = {
  free: { accounts: 1, rules: -1, dms: 1000 }, // High Volume pricing: unlimited rules, 1000 DMs
  basic: { accounts: 3, rules: 10, dms: 500 },
  pro: { accounts: 5, rules: -1, dms: -1 }, // High Volume pricing: 5 accounts, unlimited rules, unlimited DMs
  enterprise: { accounts: -1, rules: -1, dms: -1 }, // unlimited
};

// Plan features
const PLAN_FEATURES: Record<string, string[]> = {
  free: ['1 Instagram Account', 'Unlimited Automation Rules', '1,000 Auto-replies / mo', 'Basic Support'],
  basic: ['3 Instagram Accounts', '10 Automation Rules', '500 DMs/month', 'Email Support'],
  pro: ['Connect up to 5 Instagram Accounts', 'Unlimited AutoDMs across Reels, Posts, Stories & Lives', 'Advanced AutoDM Flows (Follow-checks, Sequences)', 'Unlimited Leads via Lead Magnets', 'Priority Support via Dedicated Channel'],
  enterprise: ['Unlimited Accounts', 'Unlimited Rules', 'Unlimited DMs', '24/7 Premium Support'],
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: subscriptionData, isLoading, mutate: refetchSubscription } = useFetch<SubscriptionResponse>('/users/subscription', {
    // Retry on 404 and 500 errors for new users (user might be auto-created on retry)
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Check error status from different possible error formats
      const status = (error as { response?: { status?: number }; status?: number })?.response?.status ||
                    (error as { status?: number })?.status ||
                    (error?.message?.includes('404') ? 404 : 
                     error?.message?.includes('500') ? 500 : null);
      const maxRetries = 3; // Reduced retries to avoid long waits
      
      // Retry on 404 (user not found) or 500 (user creation failed) errors
      if ((status === 404 || status === 500) && retryCount < maxRetries) {
        // Wait progressively longer before retrying (exponential backoff)
        const delay = Math.min(500 * Math.pow(2, retryCount), 2000);
        console.log(`[Subscription] Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => revalidate({ retryCount }), delay);
        return;
      }
      // Don't retry other errors or after max retries
    },
    errorRetryCount: 3,
    errorRetryInterval: 500,
  });
  const { execute: createCheckoutSession, loading: checkoutLoading } = usePost();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();

  // Open plan selection when arriving with ?choosePlan=1 (e.g. from sidebar or automations)
  useEffect(() => {
    if (searchParams.get('choosePlan') === '1') {
      setShowPlanModal(true);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('choosePlan');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    }
  }, [searchParams]);

  // Poll for subscription updates when polling is active
  useEffect(() => {
    if (!isPolling) return;
    
    let pollCount = 0;
    const maxPolls = 40; // Poll for up to 60 seconds (40 * 1.5s)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      // Check if we have a valid session before polling
      if (!session?.access_token) {
        console.warn(`⚠️ Poll [${pollCount}] skipped - no valid session`);
        return;
      }
      
      try {
        // Use API utility which handles token injection properly
        const timestamp = Date.now();
        const freshData = await get<SubscriptionResponse>(`/users/subscription?_t=${timestamp}`);
        
        console.log(`🔄 Poll [${pollCount}/${maxPolls}] - Plan: ${freshData?.plan_tier}, Status: ${freshData?.status}, Stripe ID: ${freshData?.stripe_subscription_id}`);
        
        // Check if plan has changed from free
        if (freshData && freshData.plan_tier && freshData.plan_tier !== 'free') {
          console.log('✅ Plan changed detected! Updating UI...');
          // Update SWR cache with fresh data and trigger revalidation
          await refetchSubscription(freshData, { revalidate: true });
          return; // Exit early, the watch effect will handle UI update
        }
        
        // Also check if stripe_subscription_id exists - indicates subscription was created
        // This means upgrade is in progress, webhook just needs to process it
        if (freshData && freshData.stripe_subscription_id && freshData.plan_tier === 'free') {
          console.log('🔄 Stripe subscription ID found! Subscription created, waiting for webhook...');
          // Update message to be more specific
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed by our system...');
          // Reset poll count to give more time for webhook to process
          // (This extends polling if subscription ID exists)
          pollCount = Math.max(0, pollCount - 5); // Give 5 more polls (7.5 seconds)
        }
        
        // Update SWR cache with fresh data
        await refetchSubscription(freshData, { revalidate: false });
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('⏱️ Max polling attempts reached');
          clearInterval(pollInterval);
          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed. Please refresh the page in a moment.');
          setTimeout(() => {
            setSuccessMessage(null);
            router.replace('/dashboard/subscription');
          }, 10000);
        }
      } catch (error) {
        console.error(`❌ Error polling subscription [${pollCount}]:`, error);
        // If it's a 401, stop polling (session expired)
        if (error instanceof Error && error.message.includes('401')) {
          console.warn('⚠️ Session expired during polling, stopping...');
          clearInterval(pollInterval);
          setIsPolling(false);
          return;
        }
        // Still try SWR mutate as fallback
        try {
          await refetchSubscription(undefined, { revalidate: true });
        } catch (e) {
          console.error('Failed to refetch via SWR:', e);
        }
        
        // Stop polling after max attempts (even on error)
        if (pollCount >= maxPolls) {
          console.log('⏱️ Max polling attempts reached');
          clearInterval(pollInterval);
          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed. Please refresh the page in a moment.');
          setTimeout(() => {
            setSuccessMessage(null);
            router.replace('/dashboard/subscription');
          }, 10000);
        }
      }
    }, 1500); // Poll every 1.5 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [isPolling, refetchSubscription, router, session]);

  // Watch for plan changes when polling
  useEffect(() => {
    if (isPolling && subscriptionData) {
      console.log('👀 Watching subscription data:', {
        plan_tier: subscriptionData.plan_tier,
        status: subscriptionData.status,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
      });
      
      // Check if plan has changed from free (could be pro, basic, enterprise, etc.)
      if (subscriptionData.plan_tier && subscriptionData.plan_tier !== 'free') {
        console.log('✅ Plan updated to:', subscriptionData.plan_tier);
        setIsPolling(false);
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
        setSuccessMessage('Thanks for upgrading! Your subscription is now active.');
        setTimeout(() => {
          setSuccessMessage(null);
          router.replace('/dashboard/subscription');
        }, 5000);
      }
      
      // Also check if stripe_subscription_id exists - this indicates subscription was created
      // even if plan_tier hasn't been updated yet by webhook
      if (subscriptionData.stripe_subscription_id && subscriptionData.plan_tier === 'free') {
        console.log('🔄 Stripe subscription ID detected, waiting for webhook to update plan_tier...');
        // Update message to indicate subscription was created and is being processed
        setSuccessMessage('Thanks for upgrading! Your subscription was created successfully. Our system is updating your plan now...');
        // Keep polling - webhook will update plan_tier soon
        // Don't stop polling even if we've been polling for a while
      }
    }
  }, [subscriptionData, isPolling, router]);

  // Handle success/cancel query params
  useEffect(() => {
    // Check URL params on mount
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');
    
    if (success === 'true' && sessionId) {
      setSuccessMessage('Thanks for upgrading! Verifying your subscription...');
      
      // Immediately verify and sync subscription from Stripe
      const verifySubscription = async () => {
        // Check if we have a valid session before verifying
        if (!session?.access_token) {
          console.warn('⚠️ No valid session, skipping verification but starting polling');
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed...');
          setIsPolling(true);
          return;
        }
        
        try {
          console.log('🔄 Verifying checkout session:', sessionId);
          const data = await post('/api/dodo/verify-checkout-session', { session_id: sessionId });
          console.log('✅ Subscription verified:', data);
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed...');
        } catch (error) {
          // Handle error response - might be 500 or other error
          console.warn('⚠️ Verification endpoint returned error, but continuing with polling:', error);
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed...');
        }
        
        // Always start polling regardless of verification result
        // The Stripe webhook will process the subscription even if verification fails
        setIsPolling(true);
        
        // Set timeout to stop polling after 60 seconds
        const timeout = setTimeout(() => {
          setIsPolling(false);
          setSuccessMessage('Thanks for upgrading! Your subscription is being processed. Please refresh the page in a moment.');
          setTimeout(() => {
            setSuccessMessage(null);
            router.replace('/dashboard/subscription');
          }, 10000);
        }, 60000); // 60 seconds
        
        pollingTimeoutRef.current = timeout;
        
        // Immediate refetch with forced revalidation
        refetchSubscription(undefined, { revalidate: true });
      };
      
      verifySubscription();
    } else if (success === 'true') {
      // Success but no session_id - start polling
      setSuccessMessage('Thanks for upgrading! Your subscription is being processed...');
      setIsPolling(true);
      
      const timeout = setTimeout(() => {
        setIsPolling(false);
        setSuccessMessage('Thanks for upgrading! Your subscription is being processed. Please refresh the page in a moment.');
        setTimeout(() => {
          setSuccessMessage(null);
          router.replace('/dashboard/subscription');
        }, 10000);
      }, 60000); // 60 seconds
      pollingTimeoutRef.current = timeout;
      
      refetchSubscription(undefined, { revalidate: true });
    }
    
    if (canceled === 'true') {
      setErrorMessage('Checkout was canceled. No charges were made.');
      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessage(null);
        // Remove query params from URL
        router.replace('/dashboard/subscription');
      }, 5000);
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      setIsPolling(false);
    };
  }, [refetchSubscription, router]);

  type BillingPlan = 'monthly' | 'yearly';

  const handleUpgradeWithPlan = async (plan: BillingPlan) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!session?.access_token) {
        console.warn('⚠️ No valid session found when trying to upgrade plan');
        setErrorMessage('Your session has expired. Please log in again to upgrade your plan.');
        setTimeout(() => {
          router.push('/login?redirect=/dashboard/subscription');
        }, 2000);
        return;
      }

      if (!subscriptionData) {
        console.log('🔄 Subscription data not loaded, refetching before upgrade...');
        try {
          await refetchSubscription(undefined, { revalidate: true });
        } catch (refetchError) {
          console.warn('⚠️ Failed to refetch subscription data:', refetchError);
        }
      }

      console.log('🔄 Creating checkout session for plan:', plan);
      const response = await createCheckoutSession('/api/dodo/create-checkout-session', { plan }) as { checkout_url?: string } | undefined;

      if (response?.checkout_url) {
        setShowPlanModal(false);
        window.location.href = response.checkout_url;
      } else {
        setErrorMessage('Unable to start the upgrade process. Please try again in a moment.');
      }
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      if (errorMessage.includes('Missing authorization header') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.toLowerCase().includes('session expired')) {
        setErrorMessage('Your session has expired. Please log in again to upgrade your plan.');
        setTimeout(() => router.push('/login?redirect=/dashboard/subscription'), 2000);
      } else if (errorMessage.startsWith('Dodo API error')) {
        setErrorMessage('Our payment provider temporarily rejected the request. Please try again or contact support if this keeps happening.');
      } else {
        setErrorMessage(errorMessage || 'Failed to create checkout session. Please check your connection and try again.');
      }
    }
  };

  const getPlanColor = (plan: string) => {
    const colorMap: Record<string, string> = {
      free: 'text-gray-700',
      basic: 'text-blue-700',
      pro: 'text-purple-700',
      enterprise: 'text-orange-700',
    };
    return colorMap[plan] || 'text-gray-700';
  };

  const getPlanBadgeColor = (plan: string) => {
    const colorMap: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-orange-100 text-orange-800',
    };
    return colorMap[plan] || 'bg-gray-100 text-gray-800';
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading && !subscriptionData) {
    // Show page layout with skeletons so the page paints immediately (no full-page spinner)
    return (
      <div className="w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl mb-6 shadow-lg">
          <div className="relative py-5 px-6">
            <div className="h-8 bg-white/20 rounded w-56 mb-1.5 animate-pulse" />
            <div className="h-5 bg-white/20 rounded w-80 animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
          <div className="h-5 bg-gray-200 rounded w-28 mb-3 animate-pulse" />
          <div className="flex items-center space-x-3">
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 bg-gray-100 rounded w-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
          <div className="h-5 bg-gray-200 rounded w-36 mb-4 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-28 animate-pulse" />
                  <div className="h-3.5 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
                <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="w-full">
        <div className="text-center py-10">
          <p className="text-red-600">Unable to load subscription data</p>
        </div>
      </div>
    );
  }

  // Use effective_plan_tier for display limits (shows Pro limits if still within paid Pro cycle)
  // Use plan_tier for actual plan features and status
  // If cancelled but still within cycle, show Pro in UI
  const plan = subscriptionData.plan_tier;
  const effectivePlan = subscriptionData.effective_plan_tier || subscriptionData.plan_tier;
  const displayPlan = (subscriptionData.status === 'cancelled' && subscriptionData.cancellation_end_date) 
    ? effectivePlan  // Show Pro if cancelled but still within cycle
    : plan;
  const limits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;
  const features = PLAN_FEATURES[displayPlan] || PLAN_FEATURES.free;

  return (
    <div className="w-full">
      {/* Hero Banner - compact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl mb-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-4 md:py-5 px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Usage Details</h1>
          <p className="text-sm text-white/90">View how you&apos;re using LogicDM each month</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan selection modal: Monthly vs Yearly */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Choose your plan</h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Select monthly billing or save with a yearly subscription.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleUpgradeWithPlan('monthly')}
                  disabled={checkoutLoading}
                  className="w-full flex items-start justify-between px-4 py-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-semibold text-gray-900">Monthly</span>
                  <span className="text-gray-600">$9 USD/month</span>
                </button>
                <button
                  onClick={() => handleUpgradeWithPlan('yearly')}
                  disabled={checkoutLoading}
                  className="w-full flex items-start justify-between px-4 py-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-900">Yearly</span>
                    <span className="text-xs text-green-600 font-medium">Save 2 months</span>
                  </div>
                  <span className="text-gray-600">$84 USD/year</span>
                </button>
              </div>
              {checkoutLoading && (
                <p className="mt-3 text-sm text-gray-500 text-center">Processing...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Current Plan</h2>
            <div className="flex items-center space-x-3">
              <span
                className={`text-2xl font-bold capitalize ${getPlanColor(displayPlan)}`}
              >
                {displayPlan === 'pro' && subscriptionData.status === 'active' ? 'Pro - Active' : displayPlan}
              </span>
              <span
                className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg shadow-sm ${
                  displayPlan === 'pro' && subscriptionData.status === 'active'
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white border border-amber-600 shadow-lg'
                    : subscriptionData.status === 'active' 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' 
                    : subscriptionData.status === 'cancelled' && subscriptionData.cancellation_end_date
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300'
                    : getPlanBadgeColor(displayPlan)
                }`}
              >
                {subscriptionData.status === 'active' 
                  ? displayPlan === 'pro' ? 'Active' : 'Active'
                  : subscriptionData.status === 'cancelled' && subscriptionData.cancellation_end_date
                  ? 'Cancelled (Active until cycle ends)'
                  : subscriptionData.status}
              </span>
            </div>
          </div>
          {displayPlan === 'free' && subscriptionData.status !== 'cancelled' && (
            <div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowUpIcon className="h-5 w-5 mr-2" />
                Upgrade to Pro
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Secure payments powered by Dodo Payments. International cards accepted.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-4">Plan Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-6 mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-4">Usage Statistics</h2>
        <div className="space-y-4">
          {/* Accounts Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Connected Accounts</span>
              <span className="text-sm text-gray-600">
                {subscriptionData.usage.accounts} / {limits.accounts === -1 ? '∞' : limits.accounts}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(
                  limits.accounts === -1 ? 0 : getUsagePercentage(subscriptionData.usage.accounts, limits.accounts)
                )}`}
                style={{
                  width: `${limits.accounts === -1 ? (subscriptionData.usage.accounts === 0 ? 0 : 50) : getUsagePercentage(subscriptionData.usage.accounts, limits.accounts)}%`,
                }}
              />
            </div>
          </div>

          {/* DMs Sent This Month Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">DMs Sent This Month</span>
              <span className="text-sm text-gray-600">
                {subscriptionData.usage.dms_sent_this_month} / {limits.dms === -1 ? '∞' : limits.dms}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(
                  limits.dms === -1 ? 0 : getUsagePercentage(subscriptionData.usage.dms_sent_this_month, limits.dms)
                )}`}
                style={{
                  width: `${limits.dms === -1 ? (subscriptionData.usage.dms_sent_this_month === 0 ? 0 : 50) : getUsagePercentage(subscriptionData.usage.dms_sent_this_month, limits.dms)}%`,
                }}
              />
            </div>
          </div>

          {/* Rules Created Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Automation Rules</span>
              <span className="text-sm text-gray-600">
                {subscriptionData.usage.rules} / {limits.rules === -1 ? '∞' : limits.rules}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(
                  limits.rules === -1 ? 0 : getUsagePercentage(subscriptionData.usage.rules, limits.rules)
                )}`}
                style={{
                  width: `${limits.rules === -1 ? (subscriptionData.usage.rules === 0 ? 0 : 50) : getUsagePercentage(subscriptionData.usage.rules, limits.rules)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Message */}
      {subscriptionData.status === 'cancelled' && subscriptionData.cancellation_end_date && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-base font-bold text-blue-900 mb-1">Subscription Cancelled</h3>
              <p className="text-sm text-blue-800">
                Your subscription has been successfully canceled.
                <br />
                You will continue to have full access to <strong>Pro</strong> features until{' '}
                <strong>
                  {new Date(subscriptionData.cancellation_end_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </strong>.
                <br />
                You will not be charged again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription UI removed - billing management handled in Settings/Billing tab */}
    </div>
  );
}
