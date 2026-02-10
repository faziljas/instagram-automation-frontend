'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const { data: subscriptionData, isLoading, mutate: refetchSubscription } = useFetch<SubscriptionResponse>('/users/subscription');
  const { execute: cancelSubscription, loading: cancelLoading } = usePost();
  const { execute: createCheckoutSession, loading: checkoutLoading } = usePost();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleUpgrade = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      // Ensure we have a valid auth session before calling the backend
      if (!session?.access_token) {
        console.warn('⚠️ No valid session found when trying to upgrade plan');
        setErrorMessage('Your session has expired. Please log in again to upgrade your plan.');
        setTimeout(() => {
          router.push('/login?redirect=/dashboard/subscription');
        }, 2000);
        return;
      }
      
      console.log('🔄 Creating Stripe checkout session...');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
      
      const response = await createCheckoutSession('/api/dodo/create-checkout-session', {});
      
      console.log('✅ Checkout session response:', response);
      
      if (response?.checkout_url) {
        // Redirect to Stripe Checkout
        console.log('🔗 Redirecting to Stripe Checkout:', response.checkout_url);
        window.location.href = response.checkout_url;
      } else {
        console.error('❌ No checkout_url in response:', response);
        setErrorMessage('Unable to start the upgrade process. Please try again in a moment.');
      }
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      console.error('Error details:', {
        message: errorMessage,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      });

      // Friendlier error handling:
      // - Treat auth/token errors as session expiry
      // - Treat Dodo API errors as payment service issues
      if (errorMessage.includes('Missing authorization header') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.toLowerCase().includes('session expired')) {
        setErrorMessage('Your session has expired. Please log in again to upgrade your plan.');
        setTimeout(() => {
          router.push('/login?redirect=/dashboard/subscription');
        }, 2000);
      } else if (errorMessage.startsWith('Dodo API error')) {
        setErrorMessage('Our payment provider temporarily rejected the request. Please try again or contact support if this keeps happening.');
      } else {
        setErrorMessage(errorMessage || 'Failed to create checkout session. Please check your connection and try again.');
      }
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await cancelSubscription('/users/subscription/cancel', {});
      setShowCancelModal(false);
      
      // Show success message with cancellation end date
      if (response?.cancellation_end_date) {
        const endDate = new Date(response.cancellation_end_date);
        const formattedEndDate = endDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        setSuccessMessage(
          `Your subscription has been successfully canceled. You will continue to have full access to Pro features until ${formattedEndDate}. You will not be charged again.`
        );
      } else {
        setSuccessMessage('Your subscription has been successfully canceled.');
      }
      
      // Refresh subscription data
      await refetchSubscription(undefined, { revalidate: true });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel subscription');
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
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
    <div className="max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl mb-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-10 px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Usage Details</h1>
          <p className="text-lg text-white/90">View how you&apos;re using LogicDM each month</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 p-5 shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-red-800">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Current Plan</h2>
            <div className="flex items-center space-x-4">
              <span
                className={`text-4xl font-bold capitalize ${getPlanColor(displayPlan)}`}
              >
                {displayPlan === 'pro' && subscriptionData.status === 'active' ? 'Pro - Active' : displayPlan}
              </span>
              <span
                className={`px-4 py-2 inline-flex text-sm font-bold rounded-xl shadow-sm ${
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
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <ArrowUpIcon className="h-5 w-5 mr-2" />
                {checkoutLoading ? 'Processing...' : 'Upgrade Plan'}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Secure payments powered by Dodo Payments. International cards accepted.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Plan Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Usage Statistics</h2>
        <div className="space-y-6">
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Subscription Cancelled</h3>
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
