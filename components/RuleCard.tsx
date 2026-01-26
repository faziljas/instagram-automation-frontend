import { AutomationRule } from '@/types';
import { PencilIcon, TrashIcon, BoltIcon } from '@heroicons/react/24/outline';

interface RuleCardProps {
  rule: AutomationRule;
  onEdit: (ruleId: string) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, currentStatus: boolean) => void;
}

export function RuleCard({ rule, onEdit, onDelete, onToggle }: RuleCardProps) {
  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTypeBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      auto_like: 'bg-pink-100 text-pink-800',
      auto_comment: 'bg-purple-100 text-purple-800',
      auto_follow: 'bg-blue-100 text-blue-800',
      auto_unfollow: 'bg-gray-100 text-gray-800',
      scheduled_post: 'bg-green-100 text-green-800',
    };
    return colorMap[type] || 'bg-blue-100 text-blue-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        {/* Left Section - Rule Info */}
        <div className="flex-1">
          {/* Rule Name */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BoltIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
            </div>
          </div>

          {/* Type and Status Badges */}
          <div className="flex items-center space-x-2 mb-3">
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(
                rule.type
              )}`}
            >
              {getTypeLabel(rule.type)}
            </span>
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                rule.status
              )}`}
            >
              {getTypeLabel(rule.status)}
            </span>
          </div>

          {/* Execution Count */}
          {rule.executionCount !== undefined && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{rule.executionCount.toLocaleString()}</span>{' '}
              {rule.executionCount === 1 ? 'execution' : 'executions'}
            </div>
          )}

          {/* Last Executed */}
          {rule.lastExecutedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Last executed: {new Date(rule.lastExecutedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col items-end space-y-3 ml-4">
          {/* Toggle Switch */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              {rule.isActive ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => onToggle(rule.id, rule.isActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                rule.isActive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  rule.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Edit Button */}
            <button
              onClick={() => onEdit(rule.id)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit rule"
            >
              <PencilIcon className="h-5 w-5" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(rule.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete rule"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
