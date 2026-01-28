'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card } from '@/components/Card';
import { Table } from '@/components/Table';
import { Spinner } from '@/components/Spinner';
import {
  BoltIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsSummary {
  total_triggers: number;
  total_dms_sent: number;
  leads_collected: number;
  link_clicks: number;
  follow_button_clicks: number;
  im_following_clicks: number;
  follow_confirmed_text: number;
  comment_replies: number;
  top_posts: Array<{
    media_id: string;
    trigger_count: number;
    leads_count: number;
    dms_count: number;
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

interface TopPost {
  media_id: string;
  trigger_count: number;
  leads_count: number;
  dms_count: number;
  permalink?: string;
  media_url?: string;
  media_type?: string;
}

interface Lead {
  id: number;
  email: string | null;
  phone: string | null;
  name: string | null;
  captured_at: string;
  automation_rule_id: number;
}

const LEADS_PAGE_SIZES = [25, 50, 100, 500, 3000] as const;

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPageSize, setLeadsPageSize] = useState(50);
  const { data, error, isLoading, mutate } = useFetch<AnalyticsSummary>(
    `/api/analytics/dashboard?days=${days}`
  );
  const { data: leadsData } = useFetch<Lead[]>('/api/leads');
  const allLeads = leadsData || [];
  const totalLeads = allLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / leadsPageSize));
  const recentLeads = allLeads.slice((leadsPage - 1) * leadsPageSize, leadsPage * leadsPageSize);

  useEffect(() => {
    if (totalPages > 0 && leadsPage > totalPages) setLeadsPage(totalPages);
  }, [totalPages, leadsPage]);

  const stats = [
    {
      name: 'Total Triggers',
      value: data?.total_triggers || 0,
      icon: BoltIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Automation rules triggered',
    },
    {
      name: 'Leads Collected',
      value: data?.leads_collected || 0,
      icon: EnvelopeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Emails captured (verify in Recent leads below)',
    },
    {
      name: 'Followers Gained via AutoDM',
      value: (data?.follow_button_clicks || 0) + (data?.im_following_clicks || 0) + (data?.follow_confirmed_text || 0),
      icon: CursorArrowRaysIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'By Follow / I\'m following button clicks',
    },
    {
      name: 'DMs Sent',
      value: data?.total_dms_sent || 0,
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Direct messages sent',
    },
  ];

  const tableColumns = [
    {
      key: 'media_id',
      header: 'Post/Reel/Story',
      render: (item: TopPost) => (
        <div className="flex items-center">
          {item.media_url ? (
            <img 
              src={item.media_url} 
              alt="Post" 
              className="h-10 w-10 rounded object-cover mr-3 flex-shrink-0"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const icon = target.nextElementSibling as HTMLElement;
                if (icon) icon.style.display = 'block';
              }}
            />
          ) : null}
          <PhotoIcon 
            className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" 
            style={{ display: item.media_url ? 'none' : 'block' }}
          />
          {item.permalink ? (
            <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[200px]">
              {item.media_type === 'STORY' ? 'View Story' : 'View on Instagram'}
            </a>
          ) : (
            <span className="text-xs text-gray-500 truncate max-w-[180px]" title={item.media_id || 'Preview unavailable'}>
              Preview unavailable
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'trigger_count',
      header: 'Triggers',
      render: (item: TopPost) => (
        <span className="font-semibold text-gray-900">{item.trigger_count}</span>
      ),
    },
    {
      key: 'leads_count',
      header: 'Leads',
      render: (item: TopPost) => (
        <span className="text-green-600 font-medium">{item.leads_count}</span>
      ),
    },
    {
      key: 'dms_count',
      header: 'DMs Sent',
      render: (item: TopPost) => (
        <span className="text-blue-600 font-medium">{item.dms_count}</span>
      ),
    },
  ];

  // Use real daily breakdown data from API
  const rawBreakdown = data?.daily_breakdown || [];
  // For 90 days, 90 bars are too narrow and break layout. Bucket into weeks (max ~13 bars).
  const activityData =
    days > 30
      ? (() => {
          const weeks: Array<{ date: string; date_label: string; triggers: number; dms_sent: number; leads: number; total: number }> = [];
          const weekSize = 7;
          for (let i = 0; i < rawBreakdown.length; i += weekSize) {
            const chunk = rawBreakdown.slice(i, i + weekSize);
            const triggers = chunk.reduce((s, d) => s + d.triggers, 0);
            const dms_sent = chunk.reduce((s, d) => s + d.dms_sent, 0);
            const leads = chunk.reduce((s, d) => s + d.leads, 0);
            const total = triggers + dms_sent + leads;
            const first = chunk[0];
            const last = chunk[chunk.length - 1];
            const label = first && last
              ? `${first.date} – ${last.date}`
              : first?.date ?? `Week ${weeks.length + 1}`;
            weeks.push({
              date: label,
              date_label: first?.date_label ?? '',
              triggers,
              dms_sent,
              leads,
              total,
            });
          }
          return weeks;
        })()
      : rawBreakdown;
  const maxActivity = Math.max(...activityData.map((d) => d.total), 1);
  const chartHeightPx = 200;

  return (
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-8 shadow-xl w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-6 md:py-10 px-4 md:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-lg text-white/90">
            Track your automation performance and engagement metrics
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-bold text-gray-900">Time Range:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-5 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md hover:border-blue-400 transition-all duration-200"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-5 shadow-md">
          <p className="text-red-800 text-sm font-semibold">
            Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl border-2 border-gray-200 shadow-lg">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.bgColor} p-4 rounded-xl shadow-md`}>
                    <Icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-gray-500">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">{stat.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity Chart */}
      <Card className="mb-8 rounded-2xl border-2 border-gray-200 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Over Time</h2>
        <div
          className="flex items-end gap-1 px-4 overflow-x-auto pb-1"
          style={{ minHeight: chartHeightPx + 52 }}
        >
          {activityData.length > 0 ? (
            activityData.map((item, index) => {
              const barHeightPx = Math.max(4, (item.total / maxActivity) * chartHeightPx);
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center group flex-1 min-w-[28px] max-w-[80px] ${days > 30 ? 'flex-shrink-0 basis-12' : ''}`}
                >
                  <div
                    className="w-full relative flex flex-col items-center justify-end"
                    style={{ height: chartHeightPx }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer shadow-sm group-hover:shadow-md"
                      style={{
                        height: `${barHeightPx}px`,
                        minHeight: '4px',
                      }}
                      title={`${item.date}: ${item.total} total (${item.triggers} triggers, ${item.dms_sent} DMs, ${item.leads} leads)`}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                      {item.total} total
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        {item.triggers}T, {item.dms_sent}DM, {item.leads}L
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center truncate w-full">
                    {days > 30 ? item.date : item.date.split(' ')[0]}
                  </p>
                  {days <= 30 && (
                    <p className="text-xs text-gray-400 text-center">
                      {item.date.split(' ')[1]}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full text-center py-12 text-gray-500 text-sm">
              No activity data available for the selected time range
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {days > 30
              ? 'Weekly breakdown (triggers, DMs sent, leads). Hover over bars for details.'
              : 'Daily breakdown shows triggers, DMs sent, and leads collected. Hover over bars for details.'}
          </p>
        </div>
      </Card>

      {/* Comment Replies */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-xs">
        <Card className="rounded-2xl border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Comment Replies</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.comment_replies || 0}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-1">Public replies sent to comments</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="mb-8 rounded-2xl border-2 border-gray-200 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Email leads</h2>
          {totalLeads > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                Show
                <select
                  value={leadsPageSize}
                  onChange={(e) => {
                    setLeadsPageSize(Number(e.target.value));
                    setLeadsPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LEADS_PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n === 3000 && totalLeads >= 3000 ? '3000 (all)' : n}
                    </option>
                  ))}
                </select>
                per page
              </label>
              <span className="text-sm text-gray-500">
                Page {leadsPage} of {totalPages} · {totalLeads.toLocaleString()} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                  disabled={leadsPage <= 1}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setLeadsPage((p) => Math.min(totalPages, p + 1))}
                  disabled={leadsPage >= totalPages}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <ul className="space-y-2 max-h-[480px] overflow-y-auto">
          {recentLeads.length === 0 ? (
            <li className="text-sm text-gray-500">No leads yet. They appear here once captured.</li>
          ) : (
            recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-900 truncate mr-2">
                  {lead.email || lead.phone || lead.name || `Lead #${lead.id}`}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(lead.captured_at).toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>

      {/* Top Performing Contents */}
      <Card className="rounded-2xl border-2 border-gray-200 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Contents</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={data?.top_posts || []}
            keyExtractor={(item) => item.media_id}
            emptyMessage="No posts have been triggered yet. Create automation rules to start tracking performance."
          />
        )}
      </Card>
    </div>
  );
}
