'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { GridStatsSkeleton } from '@/components/Skeleton';
import {
  UserGroupIcon,
  BoltIcon,
  PaperAirplaneIcon,
  CreditCardIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface DashboardUser {
  id: number;
  email: string;
  plan_tier: string;
  created_at: string | null;
}

interface DashboardStatsData {
  accounts_count: number;
  active_rules_count: number;
  dms_sent_today: number;
  total_dms_sent: number;
}

interface DashboardResponse {
  user: DashboardUser;
  stats: DashboardStatsData;
}

interface SubscriptionUsageData {
  accounts: number;
  rules: number;
  dms_sent_this_month: number;
}

interface SubscriptionResponse {
  plan_tier: string;
  status: string;
  stripe_subscription_id: string | null;
  usage: SubscriptionUsageData;
}

// Plan limits (must match backend and other pages)
const PLAN_LIMITS: Record<string, { accounts: number; rules: number; dms: number }> = {
  free: { accounts: 1, rules: -1, dms: 1000 }, // High Volume pricing: unlimited rules, 1000 DMs
  basic: { accounts: 3, rules: 10, dms: 500 },
  pro: { accounts: 10, rules: 50, dms: 5000 },
  enterprise: { accounts: -1, rules: -1, dms: -1 }, // unlimited
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useFetch<DashboardResponse>('/users/me/dashboard');
  const { data: subscriptionData } = useFetch<SubscriptionResponse>('/users/subscription');
  
  // Check if account and rule limits are reached
  const plan = subscriptionData?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const accountsUsed = subscriptionData?.usage?.accounts || 0;
  const rulesUsed = subscriptionData?.usage?.rules || 0;
  const isAccountLimitReached = limits.accounts !== -1 && accountsUsed >= limits.accounts;
  const isRuleLimitReached = limits.rules !== -1 && rulesUsed >= limits.rules;

  const handleConnectAccount = () => {
    // Dashboard "Connect Account" button ALWAYS redirects to connect page
    // This shows the full "Log in with Instagram" onboarding screen every time
    console.log('🔄 Redirecting to connect page from Dashboard');
    router.push('/dashboard/accounts/connect');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Banner - More Vibrant */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-10 px-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-lg text-white/90">
            Here&apos;s what&apos;s happening with your Instagram automation today.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mb-8">
          <GridStatsSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Connected Accounts Card */}
          <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-xl p-3 shadow-md">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-700">Connected Accounts</p>
                <p className="text-3xl font-bold text-blue-900">
                  {data?.stats?.accounts_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Active Rules Card */}
          <div className="group relative bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl border-2 border-yellow-200 shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-xl p-3 shadow-md">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-yellow-700">Active Rules</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {data?.stats?.active_rules_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* DMs Today Card */}
          <div className="group relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-2 border-green-200 shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-xl p-3 shadow-md">
                <PaperAirplaneIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-700">DMs Today</p>
                <p className="text-3xl font-bold text-green-900">
                  {data?.stats?.dms_sent_today || 0}
                </p>
                <p className="text-xs font-medium text-green-600 mt-1">
                  {`${data?.stats?.total_dms_sent || 0} total`}
                </p>
              </div>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="group relative bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border-2 border-purple-200 shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/20 rounded-full blur-2xl"></div>
            <div className="relative flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 shadow-md">
                <CreditCardIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-purple-700">Current Plan</p>
                <p className="text-3xl font-bold text-purple-900 capitalize">
                  {data?.user?.plan_tier || 'Free'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Connect Account Feature Card */}
          {isAccountLimitReached ? (
            <div className="relative group">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-6 cursor-not-allowed opacity-60">
                <div className="bg-gray-300 text-gray-500 rounded-2xl p-4 w-fit mb-4 shadow-inner">
                  <PlusIcon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-gray-600 mb-1 text-lg">Connect Account</h3>
                <p className="text-sm text-gray-500">Account limit reached</p>
              </div>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-full">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                  Account limit reached ({accountsUsed}/{limits.accounts})
                  <br />
                  Upgrade to connect more accounts
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectAccount}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 hover:border-blue-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 w-fit mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <PlusIcon className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-blue-700 transition-colors">Connect Account</h3>
              <p className="text-sm text-gray-600 font-medium">Add Instagram account</p>
            </div>
            </button>
          )}

          {/* Create Rule Feature Card */}
          {isRuleLimitReached ? (
            <div className="relative group">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-6 cursor-not-allowed opacity-60">
                <div className="bg-gray-300 text-gray-500 rounded-2xl p-4 w-fit mb-4 shadow-inner">
                  <BoltIcon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-gray-600 mb-1 text-lg">Create Rule</h3>
                <p className="text-sm text-gray-500">Rule limit reached</p>
              </div>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-full">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                  Rule limit reached ({rulesUsed}/{limits.rules})
                  <br />
                  Upgrade to create more rules
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          ) : (
          <Link
            href="/dashboard/rules/create"
            className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl p-6 hover:border-yellow-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white rounded-2xl p-4 w-fit mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BoltIcon className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-yellow-700 transition-colors">Create Rule</h3>
              <p className="text-sm text-gray-600 font-medium">Set up automation</p>
            </div>
          </Link>
          )}

          <Link
            href="/dashboard/subscription"
            className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-300 rounded-2xl p-6 hover:border-purple-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-4 w-fit mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <CreditCardIcon className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-purple-700 transition-colors">Upgrade Plan</h3>
              <p className="text-sm text-gray-600 font-medium">View pricing options</p>
            </div>
          </Link>
        </div>
        
        {/* Warning Messages */}
        {(isAccountLimitReached || isRuleLimitReached) && (
          <div className="mt-8 space-y-3">
            {isAccountLimitReached && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 flex items-center shadow-md">
                <div className="bg-amber-500 rounded-lg p-2 mr-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Account limit reached ({accountsUsed}/{limits.accounts})
                  </p>
                  <p className="text-xs text-amber-700">Upgrade to connect more accounts</p>
                </div>
              </div>
            )}
            {isRuleLimitReached && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 flex items-center shadow-md">
                <div className="bg-amber-500 rounded-lg p-2 mr-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Rule limit reached ({rulesUsed}/{limits.rules})
                  </p>
                  <p className="text-xs text-amber-700">Upgrade to create more rules</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}