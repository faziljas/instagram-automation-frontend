'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/hooks/useFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { useDelete, usePost } from '@/hooks/useApi';
import { TableSkeleton } from '@/components/Skeleton';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { mutate } from 'swr';

interface InstagramAccountResponse {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string | null;
}

// Plan limits (must match backend)
const PLAN_LIMITS: Record<string, { accounts: number; rules: number; dms: number }> = {
  free: { accounts: 1, rules: -1, dms: 1000 }, // High Volume pricing: unlimited rules, 1000 DMs
  basic: { accounts: 3, rules: 10, dms: 500 },
  pro: { accounts: 10, rules: 50, dms: 5000 },
  enterprise: { accounts: -1, rules: -1, dms: -1 }, // unlimited
};

export default function AccountsPage() {
  const router = useRouter();
  const { data: accountsData, error: accountsError, isLoading, mutate: mutateAccounts } = useFetch<InstagramAccountResponse[]>('/users/me/accounts');
  
  // Use subscription hook with caching to prevent pro users from appearing as free on refresh
  const { data: subscriptionData, isLoading: subscriptionLoading, mutate: mutateSubscription, planTier } = useSubscription();
  
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
      // Auto-clear error after timeout:
      // - "already connected" info: 20s
      // - upgrade to Pro / plan limit messages: ~3 minutes (180s) so user has time to decide
      // - other errors: 15s
      const isAlreadyConnected =
        decodedError.includes('already connected to another user') ||
        decodedError.includes('already connected to a different user');
      const isUpgradeOrLimit =
        decodedError.toLowerCase().includes('upgrade to pro') ||
        decodedError.toLowerCase().includes('connect more accounts') ||
        decodedError.toLowerCase().includes('rule limit') ||
        decodedError.toLowerCase().includes('dm limit');
      const clearTimeoutMs = isUpgradeOrLimit ? 180000 : isAlreadyConnected ? 20000 : 15000;
      setTimeout(() => {
        setConnectError(null);
      }, clearTimeoutMs);
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
  // Use planTier from subscription hook (handles caching and fallbacks)
  const plan = planTier;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const accountsUsed = subscriptionData?.usage?.accounts || 0;
  const isAccountLimitReached = limits.accounts !== -1 && accountsUsed >= limits.accounts;

  // If subscription says user has accounts but list is empty, treat as loading (never show Connect section)
  const hasAccountsFromUsage = accountsUsed > 0;
  // Only show Connect section when both requests have loaded and we're sure user has 0 accounts (avoids flash on refresh). Don't show when accounts fetch failed (show error + retry instead).
  const showConnectEmptyState =
    !accountsError &&
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
      // Clear subscription cache to force refresh
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('logicdm_subscription_cache');
        } catch {
          // Ignore cache errors
        }
      }
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
    <div className="w-full overflow-x-hidden">
      {/* Hero Banner - compact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl mb-6 shadow-lg w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-4 md:py-5 px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Instagram Accounts</h1>
          <p className="text-sm text-white/90">Manage your connected Instagram accounts</p>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-6">
        {isAccountLimitReached && (
          <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 flex items-center shadow-sm">
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
            {/* "Already connected elsewhere" – show as friendly info, not an error */}
            {connectError.includes('already connected to another user') || connectError.includes('already connected to a different user') ? (
              <div className="mt-2 rounded-xl bg-sky-50/80 p-5 border border-sky-200/80 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                    <InformationCircleIcon className="h-6 w-6 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-sky-900">This account is already connected</p>
                    <p className="mt-1.5 text-sm text-sky-800/90">
                      This Instagram account is linked to another LogicDM user. To use it here, disconnect it from that account first—or connect a different Instagram account.
                    </p>
                    <div className="mt-4 p-3.5 bg-white/70 border border-sky-100 rounded-lg">
                      <p className="text-sm font-medium text-sky-900 mb-2">What you can do</p>
                      <ul className="text-sm text-sky-800 space-y-1.5 list-disc list-inside">
                        <li>Connect a different Instagram account that isn&apos;t linked yet</li>
                        <li>Ask the other user to disconnect this account, then connect it here</li>
                        <li>If it&apos;s your account, sign in with that user&apos;s credentials</li>
                      </ul>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleResetConnection}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                      >
                        Try with a different account
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectError(null)}
                    className="flex-shrink-0 p-1 text-sky-500 hover:text-sky-700 rounded hover:bg-sky-100/80"
                    aria-label="Dismiss"
                  >
                    <span className="text-xl leading-none">×</span>
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
                    {(connectError.includes('development mode') || connectError.includes('test users')) && (
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
                    )}

                    {/* Upgrade link when backend suggests upgrading to Pro */}
                    {connectError.toLowerCase().includes('upgrade to pro') && (
                      <div className="mt-3">
                        <button
                          onClick={() => router.push('/dashboard/subscription')}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        >
                          Go to Upgrade page
                        </button>
                      </div>
                    )}
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

      {/* Error State - accounts fetch failed: show retry instead of infinite loading */}
      {accountsError && !isLoading && (
        <div className="bg-white rounded-xl border border-red-200 shadow p-6">
          <div className="max-w-xl mx-auto text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Couldn&apos;t load accounts</h3>
            <p className="text-sm text-gray-600 mb-3">{accountsError.message}</p>
            <button
              onClick={() => mutateAccounts(undefined, { revalidate: true })}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State - show while loading (accounts or subscription), refetching after OAuth, or when usage says we have accounts but list not yet loaded). Don't show when there's an error (show retry above). */}
      {!accountsError && (isLoading || subscriptionLoading || refreshingAfterConnect || (hasAccountsFromUsage && accounts.length === 0)) && (
        <TableSkeleton rows={3} columns={4} />
      )}

      {/* Empty State - only when we're sure user has zero accounts (never show when they have accounts) */}
      {showConnectEmptyState && (
        <div className="bg-white rounded-xl border border-gray-200 shadow p-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1.5">Connect Instagram Account</h3>
              <p className="text-sm text-gray-600">
                Log in with Instagram to connect your Business or Creator account.
              </p>
            </div>

            {/* OAuth Connection Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-base font-medium text-gray-900 mb-1.5">
                    Log in with Instagram
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Instagram Business or Creator account to enable automation features. 
                    Personal accounts are not supported.
                  </p>
                  
                  <div className="mt-4">
                    {isAccountLimitReached ? (
                      <div className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-gray-400 cursor-not-allowed opacity-60">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Account Limit Reached
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectAccount}
                        disabled={connectLoading}
                        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="mb-4 flex justify-end">
            {isAccountLimitReached ? (
              <div className="relative group">
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-gray-400 cursor-not-allowed opacity-60"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {connectLoading ? 'Connecting...' : 'Add Account'}
              </button>
            )}
          </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Date Connected
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-normal md:whitespace-nowrap align-top">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900">
                          @{account.username}
                        </div>
                        {/* Mobile-only extra info so columns aren't lost */}
                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 block md:hidden">
                          {account.created_at && (
                            <div>
                              <span className="font-semibold text-gray-700">Connected:</span>{' '}
                              {formatDate(account.created_at)}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(account.id)}
                            className="text-red-600 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${
                        account.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {account.created_at ? formatDate(account.created_at) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell">
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
