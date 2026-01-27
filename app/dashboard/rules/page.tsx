'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/hooks/useFetch';
import { useDelete, usePut } from '@/hooks/useApi';
import { TableSkeleton } from '@/components/Skeleton';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { mutate } from 'swr';

interface AutomationRuleResponse {
  id: number;
  instagram_account_id: number;
  name: string | null;
  trigger_type: string;
  action_type: string;
  config: Record<string, any>;
  media_id?: string | null; // Media ID from rule (if attached to specific media)
  is_active: boolean;
  created_at: string;
  total_triggers?: number | null;
  last_triggered_at?: string | null;
}

export default function RulesPage() {
  const router = useRouter();
  const { data: rules, isLoading } = useFetch<AutomationRuleResponse[]>('/automation/rules');
  const { execute: deleteRule, loading: deleteLoading } = useDelete();
  const { execute: updateRule, loading: updateLoading } = usePut();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleToggle = async (ruleId: number, currentStatus: boolean) => {
    try {
      await updateRule(`/automation/rules/${ruleId}`, {
        is_active: !currentStatus,
      });
      // Refresh rules list
      mutate('/automation/rules');
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle rule');
    }
  };

  const handleDelete = async (ruleId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      await deleteRule(`/automation/rules/${ruleId}`);
      setDeleteConfirm(null);
      const nextRules = (rules || []).filter((r) => r.id !== ruleId);
      mutate('/automation/rules', nextRules, { revalidate: true });
      void mutate('/users/subscription');
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  };

  const handleEdit = (ruleId: number) => {
    router.push(`/dashboard/rules/${ruleId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to determine media type from rule name (fallback method)
  // This works for rules that already have media type in their name
  const getMediaTypeFromName = (ruleName: string): string => {
    const lowerName = ruleName.toLowerCase();
    if (lowerName.includes('story') || lowerName.includes('stories')) return 'Story';
    if (lowerName.includes('reel') || lowerName.includes('reels')) return 'Reel';
    if (lowerName.includes('post') || lowerName.includes('posts')) return 'Post';
    return '';
  };

  // Enhanced rule name display with media type prefix
  const getRuleDisplayName = (rule: AutomationRuleResponse): string => {
    const baseName = rule.name || `${getTypeLabel(rule.trigger_type)} → ${getTypeLabel(rule.action_type)}`;
    
    // Check if rule has media_id (attached to specific media)
    const hasMediaId = rule.media_id || rule.config?.media_id;
    
    if (hasMediaId) {
      // Try to determine media type from name
      const mediaType = getMediaTypeFromName(baseName);
      
      // If we can determine media type and it's not already at the start, add it
      if (mediaType) {
        // Check if media type is already at the start of the name
        if (!baseName.toLowerCase().startsWith(mediaType.toLowerCase())) {
          return `${mediaType}: ${baseName}`;
        }
      } else {
        // If media_id exists but we can't determine type from name, add generic prefix
        // This helps users know the rule is attached to specific media
        if (!baseName.toLowerCase().includes('reel') && 
            !baseName.toLowerCase().includes('post') && 
            !baseName.toLowerCase().includes('story')) {
          return `[Media]: ${baseName}`;
        }
      }
    }
    
    return baseName;
  };

  return (
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 rounded-2xl mb-8 shadow-xl w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-6 md:py-10 px-4 md:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Automation Rules</h1>
          <p className="text-lg text-white/90">Manage your Instagram automation rules</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
          <p className="mt-2 text-gray-600">Manage your Instagram automation rules</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <TableSkeleton rows={5} columns={6} />}

      {/* Empty State */}
      {!isLoading && (!rules || rules.length === 0) && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl text-center py-16 px-6">
          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full p-6 w-fit mx-auto mb-6">
            <svg
              className="mx-auto h-16 w-16 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-gray-900">No automation rules</h3>
          <p className="mt-2 text-base text-gray-600">
            Get started by creating your first automation rule.
          </p>
        </div>
      )}

      {/* Rules Table */}
      {!isLoading && rules && rules.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rule Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Executions
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {getRuleDisplayName(rule)}
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      Created {formatDate(rule.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 shadow-sm">
                      {getTypeLabel(rule.trigger_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-xl shadow-sm ${
                        rule.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(rule.id, rule.is_active);
                      }}
                      disabled={updateLoading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        rule.is_active ? 'bg-blue-600' : 'bg-gray-200'
                      } ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.last_triggered_at ? (
                      <span className="text-gray-900">{formatDate(rule.last_triggered_at)}</span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {deleteConfirm === rule.id ? (
                      <div className="flex items-center justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                        <span className="text-red-600 text-sm font-semibold">Delete?</span>
                        <button
                          onClick={(e) => handleDelete(rule.id, e)}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 font-semibold rounded-lg border border-red-300 transition-all duration-200"
                        >
                          Yes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(null);
                          }}
                          className="px-3 py-1.5 text-gray-600 hover:text-white hover:bg-gray-600 rounded-lg border border-gray-300 transition-all duration-200"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(rule.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center font-bold hover:scale-105 transition-all duration-200"
                        >
                          <PencilIcon className="h-5 w-5 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(rule.id);
                          }}
                          className="text-red-600 hover:text-red-800 inline-flex items-center font-bold hover:scale-105 transition-all duration-200"
                        >
                          <TrashIcon className="h-5 w-5 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
