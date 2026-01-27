'use client';

import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { WebhookLog } from '@/types';
import { ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { mutate } from 'swr';

type StatusFilter = 'all' | 'success' | 'failed';

export default function WebhookLogsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data: logs, isLoading } = useFetch<WebhookLog[]>(
    `/webhooks/logs${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`
  );

  const handleRefresh = () => {
    mutate(`/webhooks/logs${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getResponseCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 400 && code < 500) return 'text-yellow-600';
    if (code >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Webhook Logs</h1>
        <p className="mt-2 text-gray-600">View recent webhook events and their status</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !logs && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading webhook logs...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!logs || logs.length === 0) && (
        <div className="bg-white rounded-lg shadow text-center py-12 px-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No webhook logs</h3>
          <p className="mt-2 text-sm text-gray-500">
            {statusFilter === 'all'
              ? 'No webhook events have been received yet.'
              : `No ${statusFilter} webhook events found.`}
          </p>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && logs && logs.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  {/* Event Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.eventType}</div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>

                  {/* Response Code */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getResponseCodeColor(log.responseCode)}`}>
                      {log.responseCode}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.error ? (
                      <span className="text-red-600" title={String(log.error)}>
                        Error
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Table Footer with Count */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{logs.length}</span> webhook{' '}
              {logs.length === 1 ? 'event' : 'events'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
