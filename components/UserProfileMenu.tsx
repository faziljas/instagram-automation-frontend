'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  UserCircleIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import ReportIssueModal from '@/components/ReportIssueModal';

export default function UserProfileMenu({
  onStartTour,
  onStartAutomationsSpotlightTour,
}: {
  onStartTour?: () => void;
  onStartAutomationsSpotlightTour?: () => void;
}) {
  const { user, supabaseUser, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleAccountSettings = () => {
    setIsOpen(false);
    router.push('/dashboard/settings');
  };

  const handleReportIssue = () => {
    setIsOpen(false);
    setShowReportModal(true);
  };

  const handleStartTour = () => {
    setIsOpen(false);
    onStartTour?.();
  };

  const handleAutomationsSpotlightTour = () => {
    setIsOpen(false);
    onStartAutomationsSpotlightTour?.();
  };

  // Prefer backend user name, then Supabase metadata, then email username as a fallback.
  const fullNameFromBackend =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : null;

  const fullNameFromSupabase =
    (supabaseUser?.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined ||
    (supabaseUser?.user_metadata as Record<string, unknown> | undefined)?.name as string | undefined ||
    undefined;

  const userName =
    fullNameFromBackend ||
    fullNameFromSupabase ||
    user?.email?.split('@')[0] ||
    supabaseUser?.email?.split('@')[0] ||
    'User';

  const displayName = userName.length > 20 ? `${userName.substring(0, 17)}...` : userName;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt="Profile"
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover bg-gray-600"
              />
            ) : (
              <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="truncate">{displayName}</span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            {/* Getting started */}
            {onStartTour && (
              <button
                onClick={handleStartTour}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <QuestionMarkCircleIcon className="h-5 w-5 mr-3 text-blue-600" />
                Getting started
              </button>
            )}

            {onStartAutomationsSpotlightTour && (
              <button
                onClick={handleAutomationsSpotlightTour}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CursorArrowRaysIcon className="h-5 w-5 mr-3 text-indigo-600" />
                Automations spotlight tour
              </button>
            )}

            {/* Account Settings */}
            <button
              onClick={handleAccountSettings}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-500" />
              Account settings
            </button>

            {/* Report an Issue */}
            <button
              onClick={handleReportIssue}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-3 text-orange-500" />
              Report an issue
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssueModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          userEmail={user?.email || ''}
          userName={userName}
        />
      )}
    </>
  );
}
