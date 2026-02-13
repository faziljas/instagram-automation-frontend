'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { data: accountsData, isLoading, mutate: mutateAccounts } = useFetch<InstagramAccountResponse[]>('/users/me/accounts');
  const { data: subscriptionData, isLoading: subscriptionLoading, mutate: mutateSubscription } = useFetch<SubscriptionResponse>('/users/subscription');
  
  // Ensure accounts is always an array - handle cases where API returns error object
  const accounts = Array.isArray(accountsData) ? accountsData : [];
  const { execute: deleteAccount, loading: deleteLoading } = useDelete();
  const { loading: connectLoading } = usePost();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  // After OAuth success redirect, keep showing loading until refetch completes (avoids flash of "Connect Instagram")
  const [refreshingAfterConnect, setRefreshingAfterConnect] = useState(false);
  const hasRefetchedForUsageRef = useRef(false);
  
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
      setRefreshingAfterConnect(true); // Show loading until refetch completes
      // Mark that user has successfully connected at least once
      localStorage.setItem('instagram_has_connected', 'true');
      // Force refetch so the new account appears (don't show empty state before this completes)
      void mutateAccounts(undefined, { revalidate: true });
      void mutateSubscription(undefined, { revalidate: true });
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

  // Clear "refreshing after connect" when accounts have loaded or after timeout
  useEffect(() => {
    if (!refreshingAfterConnect) return;
    if (accounts.length > 0) {
      setRefreshingAfterConnect(false);
      return;
    }
    const t = setTimeout(() => setRefreshingAfterConnect(false), 5000);
    return () => clearTimeout(t);
  }, [refreshingAfterConnect, accounts.length]);

  // Check if account limit is reached (needed before effects below)
  const plan = subscriptionData?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const accountsUsed = subscriptionData?.usage?.accounts || 0;
  const isAccountLimitReached = limits.accounts !== -1 && accountsUsed >= limits.accounts;

  // If subscription says user has accounts but list is empty, treat as loading (never show Connect section)
  const hasAccountsFromUsage = accountsUsed > 0;
  // Only show Connect section when both requests have loaded and we're sure user has 0 accounts (avoids flash on refresh)
  const showConnectEmptyState =
    !isLoading &&
    !subscriptionLoading &&
    !refreshingAfterConnect &&
    accounts.length === 0 &&
    !hasAccountsFromUsage;

  // When subscription says user has accounts but list is empty, refetch once so we show account details (like ss3)
  useEffect(() => {
    if (!hasAccountsFromUsage || accounts.length > 0 || isLoading || hasRefetchedForUsageRef.current) return;
    hasRefetchedForUsageRef.current = true;
    const t = setTimeout(() => {
      void mutateAccounts(undefined, { revalidate: true });
      void mutateSubscription(undefined, { revalidate: true });
    }, 300);
    return () => clearTimeout(t);
  }, [hasAccountsFromUsage, accounts.length, isLoading, mutateAccounts, mutateSubscription]);

  const handleConnectAccount = async () => {
    // Clear any previous errors/success messages
    setConnectError(null);
    setConnectSuccess(null);

    try {
      // Instagram Business Login scopes (2025)
      const scopes = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';
      const redirectUri = `${window.location.origin}/dashboard/callback`;
      const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;

      if (!appId) {
        throw new Error('Instagram App ID not configured. Please set NEXT_PUBLIC_INSTAGRAM_APP_ID in environment variables.');
      }

      // Encode redirect_uri in state so callback can recover it after domain redirect (logicdm.app -> www); sessionStorage is per-origin and is lost
      const statePayload = { r: redirectUri, s: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) };
      const state = typeof btoa !== 'undefined'
        ? btoa(JSON.stringify(statePayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        : statePayload.s;

      // Build Instagram Business Login OAuth URL (shows white Instagram login screen)
      // Add prompt=select_account to force account selection screen (allows switching accounts)
      // Add force_reauth=true to force password login every time (breaks cache trap)
      // Add force_authentication=1 to force fresh login screen (breaks cache trap even more aggressively)
      // Add enable_fb_login=0 to force Instagram native login (not Facebook login)
      const url = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&state=${encodeURIComponent(state)}&prompt=select_account&force_reauth=true&force_authentication=1&enable_fb_login=0`;

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
    <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-8 shadow-xl w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-6 md:py-10 px-4 md:px-8">
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

      {/* Loading State - show while loading (accounts or subscription), refetching after OAuth, or when usage says we have accounts but list not yet loaded */}
      {(isLoading || subscriptionLoading || refreshingAfterConnect || (hasAccountsFromUsage && accounts.length === 0)) && (
        <TableSkeleton rows={3} columns={4} />
      )}

      {/* Empty State - only when we're sure user has zero accounts (never show when they have accounts) */}
      {showConnectEmptyState && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Instagram Account</h3>
              <p className="text-base text-gray-600">
                Log in with Instagram to connect your Business or Creator account.
              </p>
            </div>

            {/* OAuth Connection Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Log in with Instagram
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Connect your Instagram Business or Creator account to enable automation features. 
                    Personal accounts are not supported.
                  </p>
                  
                  <div className="mt-6">
                    {isAccountLimitReached ? (
                      <div className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gray-400 cursor-not-allowed opacity-60">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Account Limit Reached
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectAccount}
                        disabled={connectLoading}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {connectLoading ? 'Redirecting to Instagram...' : 'Log in with Instagram'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      {!isLoading && !refreshingAfterConnect && accounts.length > 0 && (
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
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
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
        </div>
      )}
    </div>
  );
}
