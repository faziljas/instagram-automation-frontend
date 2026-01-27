'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useDelete, usePost } from '@/hooks/useApi';
import { TableSkeleton } from '@/components/Skeleton';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { mutate } from 'swr';

interface InstagramAccountResponse {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string | null;
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

// Plan limits (must match backend)
const PLAN_LIMITS: Record<string, { accounts: number; rules: number; dms: number }> = {
  free: { accounts: 1, rules: -1, dms: 1000 }, // High Volume pricing: unlimited rules, 1000 DMs
  basic: { accounts: 3, rules: 10, dms: 500 },
  pro: { accounts: 10, rules: 50, dms: 5000 },
  enterprise: { accounts: -1, rules: -1, dms: -1 }, // unlimited
};

export default function AccountsPage() {
  const { data: accounts, isLoading } = useFetch<InstagramAccountResponse[]>('/users/me/accounts');
  const { data: subscriptionData } = useFetch<SubscriptionResponse>('/users/subscription');
  const { execute: deleteAccount, loading: deleteLoading } = useDelete();
  const { loading: connectLoading } = usePost();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  
  // Handle URL query parameters (for same-tab redirects from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const alreadyConnected = params.get('already_connected') === 'true';
    const message = params.get('message'); // Custom message from backend
    
    if (success === 'true') {
      // Use custom message if provided, otherwise default message
      const successMessage = message ? decodeURIComponent(message) : 
        (alreadyConnected 
          ? 'Instagram account is already connected. Token has been refreshed.' 
          : 'Instagram account connected successfully!');
      
      setConnectSuccess(successMessage);
      setConnectError(null);
      // Mark that user has successfully connected at least once
      localStorage.setItem('instagram_has_connected', 'true');
      // Refresh data
      mutate('/users/me/accounts');
      mutate('/users/subscription');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Clear success message after 5 seconds (longer for already_connected since it's informational)
      setTimeout(() => {
        setConnectSuccess(null);
      }, alreadyConnected ? 8000 : 5000);
    } else if (error) {
      const decodedError = decodeURIComponent(error);
      // Only show error if we don't already have a success message
      if (!connectSuccess) {
        setConnectError(decodedError);
      }
      // Clear URL params immediately to allow retry
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-clear error after timeout (longer for "already connected" since it's informational)
      const isAlreadyConnected = decodedError.includes('already connected to another user') || decodedError.includes('already connected to a different user');
      const clearTimeout = isAlreadyConnected ? 20000 : 15000; // 20 seconds for already connected, 15 for errors
      setTimeout(() => {
        setConnectError(null);
      }, clearTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectSuccess]);
  
  // Check if account limit is reached
  const plan = subscriptionData?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const accountsUsed = subscriptionData?.usage?.accounts || 0;
  const isAccountLimitReached = limits.accounts !== -1 && accountsUsed >= limits.accounts;

  const handleConnectAccount = async () => {
    // Check if this is the first time connecting (no accounts AND never connected before)
    // Use localStorage to track if user has ever successfully connected an account
    const hasAccounts = accounts && accounts.length > 0;
    const hasConnectedBefore = localStorage.getItem('instagram_has_connected') === 'true';
    
    // If no accounts AND user has never connected before → redirect to connect page (first-time onboarding)
    // If no accounts BUT user has connected before → use direct OAuth (user deleted accounts and wants to add again)
    if (!hasAccounts && !hasConnectedBefore) {
      // First time connecting - redirect to connect page for onboarding experience
      console.log('🔄 First time connecting - redirecting to connect page');
      window.location.href = '/dashboard/accounts/connect';
      return;
    }

    // If accounts exist (user deleted and wants to add another), use direct OAuth flow
    // Clear any previous errors/success messages
    setConnectError(null);
    setConnectSuccess(null);

    try {
      // Instagram Business Login scopes (2025)
      const scopes = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish';
      const redirectUri = `${window.location.origin}/dashboard/callback`;
      const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;

      if (!appId) {
        throw new Error('Instagram App ID not configured. Please set NEXT_PUBLIC_INSTAGRAM_APP_ID in environment variables.');
      }

      // Build Instagram Business Login OAuth URL (shows white Instagram login screen)
      // Add state parameter to prevent code reuse (random string)
      // Add prompt=select_account to force account selection screen (allows switching accounts)
      // Add force_reauth=true to force password login every time (breaks cache trap)
      // Add force_authentication=1 to force fresh login screen (breaks cache trap even more aggressively)
      // Add enable_fb_login=0 to force Instagram native login (not Facebook login)
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const url = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${state}&prompt=select_account&force_reauth=true&force_authentication=1&enable_fb_login=0`;

      // Navigate to Instagram OAuth in the same tab (not popup/new tab)
      console.log('🔄 Redirecting to Instagram OAuth...');
      window.location.href = url;

    } catch (error: unknown) {
      console.error('OAuth error:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Failed to initiate OAuth connection. Please try again.';
      setConnectError(errorMessage);
    }
  };

  const handleResetConnection = () => {
    // Reset connection state to allow user to try again
    setConnectError(null);
    setConnectSuccess(null);
    console.log('🔄 Connection state reset - user can try again');
  };

  const handleDelete = async (accountId: number) => {
    try {
      await deleteAccount(`/api/instagram/accounts/${accountId}`);
      // Refresh accounts list and subscription data (to update account limit)
      mutate('/users/me/accounts');
      mutate('/users/subscription');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-10 px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Instagram Accounts</h1>
          <p className="text-lg text-white/90">Manage your connected Instagram accounts</p>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        {isAccountLimitReached && (
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 flex items-center shadow-md">
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
        
        {/* Connect Error/Warning Message */}
        {connectError && (
          <>
            {/* Special handling for "already connected to another user" - show as warning, not error */}
            {connectError.includes('already connected to another user') || connectError.includes('already connected to a different user') ? (
              <div className="mt-2 rounded-md bg-amber-50 p-4 border border-amber-300">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-amber-900 font-semibold">Account Already Connected</p>
                    <p className="mt-2 text-sm text-amber-800">{connectError}</p>
                    
                    <div className="mt-4 p-3 bg-white border border-amber-200 rounded-md">
                      <p className="text-sm font-medium text-amber-900 mb-2">What you can do:</p>
                      <ul className="text-sm text-amber-800 list-disc list-inside space-y-1.5">
                        <li>Use a different Instagram account that hasn&apos;t been connected yet</li>
                        <li>Contact the other user to disconnect this account first</li>
                        <li>If this is your account, log in with that user&apos;s credentials</li>
                      </ul>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={handleResetConnection}
                        className="inline-flex items-center px-3 py-1.5 border border-amber-300 rounded-md text-sm font-medium text-amber-800 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        Try with a Different Account
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectError(null)}
                    className="ml-3 flex-shrink-0 text-amber-600 hover:text-amber-800"
                    aria-label="Dismiss"
        >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Regular error messages (red) */
              <div className="mt-2 rounded-md bg-red-50 p-3 border border-red-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-800 font-medium">Connection Error</p>
                    <p className="mt-1 text-sm text-red-700">{connectError}</p>
                    
                    {/* Special handling for development mode error */}
                    {connectError.includes('development mode') || connectError.includes('test users') ? (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm font-medium text-amber-900 mb-2">⚠️ App in Development Mode</p>
                        <p className="text-xs text-amber-800 mb-2">
                          This Instagram app is currently in development mode and only test users can connect.
                        </p>
                        <p className="text-xs text-amber-800 mb-2">
                          <strong>What you can do:</strong>
                        </p>
                        <ul className="text-xs text-amber-800 list-disc list-inside ml-2 space-y-1">
                          <li>Contact the app administrator to be added as a test user</li>
                          <li>Use an Instagram account that has already been added as a test user</li>
                          <li>Wait until the app is approved and published</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-800">
                          <strong>💡 You can try again:</strong> Click &quot;Connect Account&quot; to retry with a different Instagram account or credentials.
                        </p>
                      </div>
                    )}
                    
                    {/* Stuck? Reset Button */}
                    <div className="mt-3">
                      <button
                        onClick={handleResetConnection}
                        className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        🔄 Stuck on an error? Click here to reset and try again.
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectError(null)}
                    className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800"
                    aria-label="Dismiss error"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Connect Success Message */}
        {connectSuccess && (
          <div className="mt-2 rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">{connectSuccess}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <TableSkeleton rows={3} columns={4} />}

      {/* Empty State */}
      {!isLoading && (!accounts || accounts.length === 0) && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl text-center py-16 px-6">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-6 w-fit mx-auto mb-6">
            <svg
              className="mx-auto h-16 w-16 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-gray-900">No accounts connected</h3>
          <p className="mt-2 text-base text-gray-600">
            Get started by connecting your first Instagram account.
          </p>
          <div className="mt-8">
            {isAccountLimitReached ? (
              <div className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gray-400 cursor-not-allowed opacity-60">
                <PlusIcon className="h-5 w-5 mr-2" />
                Connect Account
              </div>
            ) : (
              <button
                onClick={handleConnectAccount}
                disabled={connectLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
                {connectLoading ? 'Connecting...' : 'Connect Account'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Accounts Table */}
      {!isLoading && accounts && accounts.length > 0 && (
        <div>
          {/* Add Account Button - Only show when accounts exist */}
          <div className="mb-6 flex justify-end">
            {isAccountLimitReached ? (
              <div className="relative group">
                <button
                  disabled
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gray-400 cursor-not-allowed opacity-60"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Account
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                    Upgrade to connect more accounts
                    <div className="absolute top-full right-4 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectAccount}
                disabled={connectLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {connectLoading ? 'Connecting...' : 'Add Account'}
              </button>
            )}
          </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date Connected
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          @{account.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-xl shadow-sm ${
                        account.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.created_at ? formatDate(account.created_at) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {deleteConfirm === account.id ? (
                      <div className="flex items-center justify-end space-x-3">
                        <span className="text-red-600 text-sm font-semibold">Delete?</span>
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 font-semibold rounded-lg border border-red-300 transition-all duration-200"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-gray-600 hover:text-white hover:bg-gray-600 rounded-lg border border-gray-300 transition-all duration-200"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(account.id)}
                        className="text-red-600 hover:text-red-700 inline-flex items-center font-semibold hover:scale-105 transition-all duration-200"
                      >
                        <TrashIcon className="h-5 w-5 mr-1" />
                        Delete
                      </button>
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
