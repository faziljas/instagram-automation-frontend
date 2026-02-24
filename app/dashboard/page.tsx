'use client';

import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useParallelFetch } from '@/hooks/useParallelFetch';
import { GridStatsSkeleton } from '@/components/Skeleton';
import { useMemo } from 'react';
import {
  UserGroupIcon,
  BoltIcon,
  PaperAirplaneIcon,
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

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Use subscription hook with caching to prevent pro users from appearing as free on refresh
  useSubscription();

  // Fetch critical data first (dashboard stats) - keep dashboard feeling live
  const { data } = useFetch<DashboardResponse>('/users/me/dashboard', {
    // Short dedupe and periodic refresh so counts update quickly when user is active
    dedupingInterval: 15_000,
    refreshInterval: 15_000,
  });
  
  // Fetch analytics and leads immediately (no delay) so values display as fast as possible
  const shouldLoadSecondaryData = true;

  // Fetch analytics and leads in parallel
  const { data: secondaryData } = useParallelFetch<{
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
  // Fallback: when aggregate metrics show activity but daily_breakdown has no per-day data
  // (e.g. date mismatch or cache), synthesize a fallback so the graph displays
  const { dailyBreakdown, engagementData, hasAnyActivity } = useMemo(() => {
    let breakdown = Array.isArray(analyticsData?.daily_breakdown) ? analyticsData.daily_breakdown : [];
    let hasActivity = breakdown.some((d) => (d.total || 0) > 0);

    const totalDms = analyticsData?.total_dms_sent || 0;
    const totalLeads = analyticsData?.leads_collected || 0;
    const totalTriggers = analyticsData?.total_triggers || 0;
    const hasAggregateActivity = totalDms + totalLeads + totalTriggers > 0;

    if (!hasActivity && hasAggregateActivity && breakdown.length > 0) {
      // Put aggregate totals in the last day (most recent) so graph shows activity
      const fallbackTotal = totalTriggers + totalDms + totalLeads;
      breakdown = breakdown.map((d, i) => {
        const isLastDay = i === breakdown.length - 1;
        return isLastDay
          ? {
              ...d,
              triggers: totalTriggers,
              dms_sent: totalDms,
              leads: totalLeads,
              total: fallbackTotal,
            }
          : d;
      });
      hasActivity = true;
    }

    const maxTotal = Math.max(...breakdown.map((d) => d.total || 0), 1);
    const engagement = breakdown.map((day) => {
      const dayTotal = day.total || 0;
      return maxTotal > 0 ? (dayTotal / maxTotal) * 100 : 0;
    });
    return { dailyBreakdown: breakdown, engagementData: engagement, hasAnyActivity: hasActivity };
  }, [analyticsData?.daily_breakdown, analyticsData?.total_dms_sent, analyticsData?.leads_collected, analyticsData?.total_triggers]);

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
    <div className="w-full overflow-x-hidden">
      {/* Hero Banner - compact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl mb-6 shadow-lg w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-4 md:py-5 px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-sm text-white/90">
            Here&apos;s what&apos;s happening with your Instagram automation today.
          </p>
        </div>
      </div>

      {/* Show content immediately - don't block on loading */}
      {data ? (
        <div className="grid gap-4 mb-8">
          {/* Row 1: Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total DMs Sent */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total DMs Sent
                    </p>
                    <p className="mt-0.5 text-xl font-semibold text-gray-900">
                      {totalDMs === 0 ? '-' : totalDMs.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Your automation has handled every DM without you needing to touch the inbox.
              </p>
            </div>

            {/* Leads Captured */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Leads Captured
                    </p>
                    <p className="mt-0.5 text-xl font-semibold text-gray-900">
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
              <p className="mt-2 text-xs text-gray-500">
                People who replied or clicked through from your automation flows.
              </p>
            </div>

            {/* Active Automations */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center">
                    <BoltIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Active Automations
                    </p>
                    <p className="mt-0.5 text-xl font-semibold text-gray-900">
                      {activeRules} Active
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Rules currently watching your posts, stories, and inbox.
              </p>
            </div>

            {/* Time Saved */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Time Saved
                    </p>
                    <p className="mt-0.5 text-xl font-semibold text-gray-900">
                      {timeSavedHours} Hours
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Based on ~2 minutes saved per DM your bot sends.
              </p>
            </div>
          </div>

          {/* Row 2: Engagement Overview + Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Engagement Overview (2/3 width) */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Engagement Overview
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-gray-900">
                    Automation Activity (Last 7 Days)
                  </h3>
                </div>
                <span className="text-xs text-gray-400">DMs / day</span>
              </div>

              {dailyBreakdown.length === 0 || !hasAnyActivity ? (
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
                    const dayName = day?.date?.split(' ')[0] || day?.date_label?.split('/')[1] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
                    // Check if this day has any activity
                    const dayTotal = day?.total || 0;
                    const hasDayActivity = dayTotal > 0;
                    // Calculate bar height: if there's activity, ensure it's visible (minimum 20% when data exists)
                    const barHeight = hasDayActivity ? Math.max(value, 20) : 0;
                    return (
                      <div
                        key={index}
                        className="group flex-1 flex flex-col items-center space-y-2"
                      >
                        <div className="w-full bg-gray-50 rounded-lg h-32 flex items-end overflow-visible relative">
                          {barHeight > 0 && (
                            <>
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-lg transition-colors cursor-pointer hover:from-blue-600 hover:to-indigo-500 relative z-0"
                                style={{ height: `${barHeight}%`, minHeight: '20px' }}
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                {dayTotal} total
                                <div className="text-[10px] text-gray-300 mt-0.5">
                                  {day?.triggers || 0}T, {day?.dms_sent || 0}DM, {day?.leads || 0}L
                                </div>
                              </div>
                            </>
                          )}
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
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Live Activity Feed
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-gray-900">
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
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Content Performance
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-gray-900">
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