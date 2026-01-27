'use client';

import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { GridStatsSkeleton } from '@/components/Skeleton';
import {
  UserGroupIcon,
  BoltIcon,
  PaperAirplaneIcon,
  CreditCardIcon,
  ClockIcon,
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
  const { user } = useAuth();
  const { data, isLoading } = useFetch<DashboardResponse>('/users/me/dashboard');
  const { data: subscriptionData } = useFetch<SubscriptionResponse>('/users/subscription');

  // Check if account and rule limits are reached
  const plan = subscriptionData?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Basic usage stats
  const totalDMs = data?.stats?.total_dms_sent || 0;
  const dmsToday = data?.stats?.dms_sent_today || 0;
  const activeRules = data?.stats?.active_rules_count || 0;

  // Time saved: each DM = 2 minutes
  const timeSavedMinutes = totalDMs * 2;
  const timeSavedHours = Math.round(timeSavedMinutes / 60);

  // Mocked analytics data for premium "Command Center" feel
  const engagementData = [72, 55, 90, 40, 68, 80, 60]; // last 7 days activity levels

  const recentActivity = [
    {
      username: '@growth_hub',
      label: 'Price',
      timeAgo: 'Sent 2 mins ago',
      status: 'Success',
    },
    {
      username: '@creator_labs',
      label: 'Offer',
      timeAgo: 'Sent 8 mins ago',
      status: 'Success',
    },
    {
      username: '@brand_studio',
      label: 'Waitlist',
      timeAgo: 'Sent 15 mins ago',
      status: 'Success',
    },
    {
      username: '@launchpad',
      label: 'Demo',
      timeAgo: 'Sent 22 mins ago',
      status: 'Success',
    },
  ];

  const topPosts = [
    {
      id: '1',
      caption: '“The DM engine that replies to every comment so you don’t have to.”',
      dms: 240,
    },
    {
      id: '2',
      caption: '“Drop ‘PRICE’ below and I’ll send you the full breakdown + case study.”',
      dms: 185,
    },
    {
      id: '3',
      caption: '“We turned 1 post into 327 conversations. Want the template?”',
      dms: 132,
    },
  ];

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
        <div className="grid gap-6 mb-10">
          {/* Row 1: Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total DMs Sent */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total DMs Sent
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {totalDMs.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  +12%
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Your automation has handled every DM without you needing to touch the inbox.
              </p>
            </div>

            {/* Leads Captured */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Leads Captured
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      85
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  +5
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                People who replied or clicked through from your automation flows.
              </p>
            </div>

            {/* Active Automations */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <BoltIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Active Automations
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {activeRules || 0} Active
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Rules currently watching your posts, stories, and inbox.
              </p>
            </div>

            {/* Time Saved */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Time Saved
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {timeSavedHours} Hours
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Based on ~2 minutes saved per DM your bot sends.
              </p>
            </div>
          </div>

          {/* Row 2: Engagement Overview + Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Overview (2/3 width) */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Engagement Overview
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    Automation Activity (Last 7 Days)
                  </h3>
                </div>
                <span className="text-xs text-gray-400">DMs / day</span>
              </div>

              <div className="mt-4 h-40 flex items-end space-x-2">
                {engagementData.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center space-y-2"
                  >
                    <div className="w-full bg-gray-50 rounded-lg h-32 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-lg"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed (1/3 width) */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Live Activity Feed
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    Recent Actions
                  </h3>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
              </div>

              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={`${item.username}-${item.timeAgo}`}
                    className="flex items-start space-x-3 rounded-lg border border-gray-50 px-3 py-2.5"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                      {item.username.replace('@', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{item.username}</span>{' '}
                        triggered{' '}
                        <span className="font-semibold">&quot;{item.label}&quot;</span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {item.timeAgo}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-emerald-600">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Top Performing Posts */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Content Performance
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                  Top Performing Posts
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Ranked by DMs triggered
              </span>
            </div>

            <div className="mt-2 divide-y divide-gray-100">
              <div className="grid grid-cols-12 gap-4 py-2 text-xs font-medium text-gray-500">
                <span className="col-span-5">Post</span>
                <span className="col-span-5">Caption</span>
                <span className="col-span-2 text-right">DMs</span>
              </div>

              {topPosts.map((post) => (
                <div
                  key={post.id}
                  className="grid grid-cols-12 gap-4 py-3 items-center"
                >
                  {/* Thumbnail placeholder */}
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500" />
                    <div className="text-xs text-gray-500">
                      <p className="font-medium text-gray-900">
                        IG Reel · Auto DM
                      </p>
                      <p>Tap-through &amp; comment triggers enabled</p>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="col-span-5">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {post.caption}
                    </p>
                  </div>

                  {/* DMs */}
                  <div className="col-span-2 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {post.dms.toLocaleString()} DMs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}