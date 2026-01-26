import Image from 'next/image';
import { InstagramAccount } from '@/types';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface AccountCardProps {
  account: InstagramAccount;
  onDelete: (accountId: string) => void;
  onEdit?: (accountId: string) => void;
}

export function AccountCard({ account, onDelete, onEdit }: AccountCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUsernameClick = () => {
    // Open Instagram profile in new tab
    window.open(`https://instagram.com/${account.username}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        {/* Account Info */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Profile Picture */}
          {account.profilePictureUrl ? (
            <Image
              className="h-16 w-16 rounded-full"
              src={account.profilePictureUrl}
              alt={account.username}
              width={64}
              height={64}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {account.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Account Details */}
          <div className="flex-1">
            {/* Username - Clickable */}
            <button
              onClick={handleUsernameClick}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              @{account.username}
            </button>

            {/* Stats */}
            {account.followersCount !== undefined && (
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  <span className="font-medium">{account.followersCount.toLocaleString()}</span>{' '}
                  followers
                </span>
                {account.followingCount !== undefined && (
                  <span>
                    <span className="font-medium">{account.followingCount.toLocaleString()}</span>{' '}
                    following
                  </span>
                )}
                {account.postsCount !== undefined && (
                  <span>
                    <span className="font-medium">{account.postsCount.toLocaleString()}</span>{' '}
                    posts
                  </span>
                )}
              </div>
            )}

            {/* Status Badge */}
            <div className="mt-2 flex items-center space-x-3">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  account.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {account.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500">
                Connected {formatDate(account.connectedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={() => onEdit(account.id)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit account"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(account.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete account"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
