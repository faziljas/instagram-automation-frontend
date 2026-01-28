'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ConnectAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Check for OAuth callback success/error
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'true') {
      setSuccessMessage('Instagram account connected successfully!');
      // Mark that user has successfully connected at least once
      localStorage.setItem('instagram_has_connected', 'true');
      setTimeout(() => {
        router.push('/dashboard/accounts');
      }, 2000);
    } else if (error) {
      let errorMsg = 'OAuth connection failed. Please try again.';
      if (error === 'no_user_id') {
        errorMsg = 'Authentication error. Please log in again.';
      } else if (error === 'oauth_failed') {
        errorMsg = 'Failed to connect Instagram account. Please try again.';
      } else if (error === 'personal_account') {
        errorMsg = '⚠️ Account Type Error: You are using a Personal account. Please switch to \'Creator\' or \'Business\' in your Instagram Settings to enable automation.';
      }
      setErrorMessage(errorMsg);
    }
  }, [searchParams, router]);

  const handleOAuthConnect = async () => {
    setOauthLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Instagram Business Login scopes (2025)
      const scopes = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments';
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
      
      // Navigate to Instagram OAuth in the same tab
      console.log('🔄 Redirecting to Instagram OAuth...');
      window.location.href = url;
    } catch (error: any) {
      console.error('OAuth error:', error);
      setErrorMessage(error?.message || 'Failed to initiate OAuth connection. Please try again.');
      setOauthLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/accounts"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Accounts
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connect Instagram Account</h1>
        <p className="mt-2 text-gray-600">
          Log in with Instagram to connect your Business or Creator account.
        </p>
      </div>

      {/* OAuth Connection */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                Log in with Instagram
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Connect your Instagram Business or Creator account to enable automation features. 
                Personal accounts are not supported.
              </p>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800 mb-2">Connection Failed</p>
                      <p className="text-sm text-red-700">{errorMessage}</p>
                      
                      {/* Special handling for development mode error */}
                      {(errorMessage.includes('development mode') || errorMessage.includes('test users')) && (
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
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success Message */}
              {successMessage && (
                <div className="mt-4 rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleOAuthConnect}
                  disabled={oauthLoading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  {oauthLoading ? 'Redirecting to Instagram...' : 'Log in with Instagram'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
