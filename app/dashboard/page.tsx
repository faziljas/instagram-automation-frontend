'use client';

import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useParallelFetch } from '@/hooks/useParallelFetch';
import { GridStatsSkeleton } from '@/components/Skeleton';
import { useState, useEffect, useMemo, memo } from 'react';
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

interface AnalyticsSummary {
  total_triggers: number;
  total_dms_sent: number;
  leads_collected: number;
  link_clicks: number;
  follow_button_clicks: number;
  im_following_clicks: number;
  profile_visits: number;
  comment_replies: number;
  top_posts: Array<{
    media_id: string;
    trigger_count: number;
    leads_count: number;
    dms_count: number;
    permalink?: string;
    media_url?: string;
    media_type?: string;
  }>;
  daily_breakdown: Array<{
    date: string;
    date_label: string;
    triggers: number;
    dms_sent: number;
    leads: number;
    total: number;
  }>;
}

interface Lead {
  id: number;
  email: string | null;
  phone: string | null;
  name: string | null;
  captured_at: string;
  automation_rule_id: number;
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
  
  // Use subscription hook with caching to prevent pro users from appearing as free on refresh
  const { planTier: plan } = useSubscription();
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Fetch critical data first (dashboard stats)
  const { data, isLoading } = useFetch<DashboardResponse>('/users/me/dashboard');
  
  // Lazy load non-critical data (analytics and leads) after initial render
  const [shouldLoadSecondaryData, setShouldLoadSecondaryData] = useState(false);
  
  useEffect(() => {
    // Load secondary data after a short delay to prioritize critical content
    const timer = setTimeout(() => {
      setShouldLoadSecondaryData(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch analytics and leads in parallel (only after initial render)
  const {
    data: secondaryData,
    isLoading: isSecondaryLoading,
  } = useParallelFetch<{
    analytics: AnalyticsSummary;
    leads: Lead[];
  }>(
    {
      analytics: shouldLoadSecondaryData ? '/api/analytics/dashboard?days=7' : null,
      leads: shouldLoadSecondaryData ? '/api/leads' : null,
    },
    { enabled: shouldLoadSecondaryData }
  );

  const analyticsData = secondaryData.analytics;
  const leadsData = secondaryData.leads;
  const isAnalyticsLoading = isSecondaryLoading;

  // OPTIMIZED: Memoize expensive computations to prevent recalculation on every render
  const metrics = useMemo(() => {
    const totalDMs = analyticsData?.total_dms_sent || 0;
    const leadsCaptured = analyticsData?.leads_collected || 0;
    const activeRules = data?.stats?.active_rules_count || 0;
    const timeSavedHours = totalDMs > 0 ? Math.ceil((totalDMs * 2) / 60) : 0;
    
    return { totalDMs, leadsCaptured, activeRules, timeSavedHours };
  }, [analyticsData?.total_dms_sent, analyticsData?.leads_collected, data?.stats?.active_rules_count]);

  const { totalDMs, leadsCaptured, activeRules, timeSavedHours } = metrics;

  // OPTIMIZED: Memoize daily breakdown processing
  const { dailyBreakdown, engagementData } = useMemo(() => {
    const breakdown = Array.isArray(analyticsData?.daily_breakdown) ? analyticsData.daily_breakdown : [];
    const maxTotal = Math.max(...breakdown.map((d) => d.total), 1);
    const engagement = breakdown.map((day) =>
      maxTotal > 0 ? (day.total / maxTotal) * 100 : 0
    );
    return { dailyBreakdown: breakdown, engagementData: engagement };
  }, [analyticsData?.daily_breakdown]);

  // OPTIMIZED: Memoize recent activity processing
  const recentActivity = useMemo(() => {
    const recentLeads = Array.isArray(leadsData) ? leadsData.slice(0, 5) : [];
    return recentLeads.map((lead) => ({
      id: lead.id,
      username: lead.email?.split('@')[0] || lead.name || 'Anonymous',
      label: 'Lead Captured',
      created_at: lead.captured_at,
    }));
  }, [leadsData]);

  // OPTIMIZED: Memoize top posts processing
  const topPosts = useMemo(() => {
    return Array.isArray(analyticsData?.top_posts) 
      ? analyticsData.top_posts.slice(0, 3).map((post) => ({
          id: post.media_id,
          caption: post.permalink
            ? `View on ${post.media_type === 'STORY' ? 'Story' : 'Instagram'}`
            : `Media ${post.media_id.substring(0, 18)}...`,
          dms: post.dms_count,
          media_url: post.media_url,
          media_type: post.media_type,
        }))
      : [];
  }, [analyticsData?.top_posts]);

  const formatTimeAgo = (isoDate: string) => {
    const created = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  return (
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Banner - More Vibrant */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-8 shadow-xl w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-6 md:py-10 px-4 md:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-lg text-white/90">
            Here&apos;s what&apos;s happening with your Instagram automation today.
          </p>
        </div>
      </div>

      {/* Show content immediately - don't block on loading */}
      {data ? (
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
                      {totalDMs === 0 ? '-' : totalDMs.toLocaleString()}
                    </p>
                  </div>
                </div>
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
                      {leadsCaptured}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    leadsCaptured > 0
                      ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  {leadsCaptured > 0 ? '+ Leads' : 'No leads yet'}
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
                      {activeRules} Active
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

              {dailyBreakdown.length === 0 || totalDMs === 0 ? (
                <div className="mt-6 h-40 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Waiting for data...
                  </p>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm">
                    Connect an account and create a rule to see your automation stats grow here.
                  </p>
                  <div className="mt-4 h-1.5 w-40 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                </div>
              ) : (
                <div className="mt-4 h-40 flex items-end space-x-2">
                  {engagementData.map((value, index) => {
                    const day = dailyBreakdown[index];
                    const dayName = day?.date.split(' ')[0] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center space-y-2"
                      >
                        <div className="w-full bg-gray-50 rounded-lg h-32 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-lg"
                            style={{ height: `${Math.max(value, 2)}%` }}
                            title={`${day?.date || ''}: ${day?.total || 0} total (${day?.triggers || 0} triggers, ${day?.dms_sent || 0} DMs, ${day?.leads || 0} leads)`}
                          />
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          {dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
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

              {recentActivity.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    No activity yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-500 max-w-xs">
                    Your recent automations will appear here as soon as your rules start sending DMs.
                  </p>
                </div>
              ) : (
                <div className="mt-2 space-y-3">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 rounded-lg border border-gray-50 px-3 py-2.5"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {item.username.replace('@', '').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">
                            {item.username || 'Anonymous'}
                          </span>{' '}
                          triggered{' '}
                          <span className="font-semibold">
                            &quot;{item.label || 'Automation'}&quot;
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-medium text-emerald-600">
                          Success
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

              {topPosts.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No posts have been triggered yet. Create automation rules to start tracking performance.
                </div>
              ) : (
                topPosts.map((post) => (
                  <div
                    key={post.id}
                    className="grid grid-cols-12 gap-4 py-3 items-center"
                  >
                    {/* Thumbnail */}
                    <div className="col-span-5 flex items-center space-x-3">
                      {post.media_url ? (
                        <img
                          src={post.media_url}
                          alt="Post"
                          className="h-10 w-10 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500" />
                      )}
                      <div className="text-xs text-gray-500">
                        <p className="font-medium text-gray-900">
                          {post.media_type === 'STORY' ? 'IG Story' : 'IG Post'} · Auto DM
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
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Show skeleton only if no data at all (first load)
        <div className="mb-8">
          <GridStatsSkeleton />
        </div>
      )}
    </div>
  );
}