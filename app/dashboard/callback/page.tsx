'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { post } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

/**
 * Instagram OAuth callback page (same-tab flow).
 * Extracts authorization code from URL, exchanges it with backend for token,
 * and redirects back to accounts page with success/error.
 */
export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error');
  const [isProcessing, setIsProcessing] = useState(true);
  
  // Ref guard to prevent duplicate API calls (React Strict Mode double render)
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    // IMMEDIATE ERROR HANDLING: Check window.location.search directly first (works even if searchParams hasn't loaded)
    const urlParams = new URLSearchParams(window.location.search);
    const directErrorParam = urlParams.get('error');
    const directErrorMessage = urlParams.get('message');
    const directErrorDescription = urlParams.get('error_description');
    const directErrorReason = urlParams.get('error_reason');
    
    // If error detected, redirect immediately (before any other processing)
    if (directErrorParam || directErrorMessage) {
      const errorMsg = directErrorMessage || directErrorDescription || directErrorReason || directErrorParam || 'OAuth authentication failed';
      
      // Make error messages more user-friendly with actionable guidance
      let friendlyErrorMsg = errorMsg;
      let errorType = 'generic';
      
      if (errorMsg.includes('Insufficient Developer Role') || errorMsg.includes('Insufficient developer role') || errorMsg.includes('insufficient developer role')) {
        friendlyErrorMsg = 'This Instagram app is currently in development mode. Only test users added to the app can connect their accounts. Please contact the app administrator to be added as a test user, or wait until the app is approved and published.';
        errorType = 'development_mode';
      } else if (directErrorParam === 'access_denied') {
        friendlyErrorMsg = 'Access denied. You may need to grant permissions or try with a different account.';
        errorType = 'access_denied';
      } else if (errorMsg.includes('development mode') || errorMsg.includes('test users')) {
        // Catch variations of development mode error
        friendlyErrorMsg = 'This Instagram app is currently in development mode. Only test users added to the app can connect their accounts. Please contact the app administrator to be added as a test user, or wait until the app is approved and published.';
        errorType = 'development_mode';
      }
      
      console.error('❌ Instagram OAuth error detected - redirecting immediately:', { directErrorParam, directErrorMessage, directErrorReason, directErrorDescription });
      
      // Redirect immediately - use window.location.replace for immediate redirect (no history entry, no delay)
      // Include error_type in URL for special handling on accounts page
      window.location.replace(`/dashboard/accounts?error=${encodeURIComponent(friendlyErrorMsg)}&error_type=${errorType}&retry=true`);
      return; // Exit early, don't process anything else
    }
    
    // Extract code from URL query parameters (only if no error)
    const code = searchParams.get('code');

    // STRICT CHECK: If no code OR if we already called the API, stop immediately
    if (!code) {
      console.log('⚠️ No code found in URL, waiting...');
      return;
    }

    // CRITICAL: Wait for Supabase session to be loaded before making API call
    if (authLoading) {
      console.log('⚠️ Waiting for authentication session to load...');
      return;
    }

    // CRITICAL: Check if session exists and has access token
    if (!session?.access_token) {
      const errorMsg = 'Not authenticated. Please log in first.';
      console.error('❌', errorMsg);
      window.location.replace(`/dashboard/accounts?error=${encodeURIComponent(errorMsg)}&retry=true`);
      return;
    }

    // Prevent duplicate calls - if we already called the API, skip
    if (hasCalledAPI.current) {
      console.log('⚠️ API call already in progress or completed, skipping duplicate call');
      return;
    }

    // Mark as called BEFORE the async operation starts
    hasCalledAPI.current = true;
    console.log('🔄 Starting OAuth code exchange process...');

    const exchangeCode = async () => {
      try {
        // Note: Error handling is done above in useEffect before this function is called
        
        // Validate code exists (should already be checked above, but double-check)
        if (!code) {
          const errorMsg = 'No authorization code received from Instagram';
          console.error('❌', errorMsg);
          // Redirect immediately - no delay
          window.location.href = `/dashboard/accounts?error=${encodeURIComponent(errorMsg)}&retry=true`;
          return;
        }

        // Double-check session is still available before making request
        if (!session?.access_token) {
          throw new Error('Session expired. Please log in again.');
        }

        console.log('✅ Instagram OAuth code received, exchanging with backend...');

        // Send the exact redirect_uri used in the OAuth dialog so backend matches (fixes www vs non-www mismatch)
        const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/callback` : undefined;

        // Exchange code for token via backend using API helper (handles token injection automatically)
        const response = await post<{ success: boolean; already_connected?: boolean; message?: string }>(
          '/api/instagram/exchange-code',
          { code, redirect_uri: redirectUri }
        );

        if (response && response.success) {
          console.log('✅ Instagram account connected successfully!', response);
          
          // Check if account was already connected
          const alreadyConnected = response.already_connected || false;
          const message = response.message || 'Instagram account connected successfully!';
          
          // Redirect back to accounts page with success (same-tab flow)
          // Include already_connected flag and message for graceful handling
          console.log('✅ Connection successful - redirecting to accounts page');
          const params = new URLSearchParams({
            success: 'true',
            already_connected: alreadyConnected.toString(),
            message: encodeURIComponent(message)
          });
          window.location.href = `/dashboard/accounts?${params.toString()}`;
        } else {
          throw new Error('Failed to connect Instagram account: Invalid response from server');
        }
      } catch (err: unknown) {
        console.error('❌ Error exchanging Instagram OAuth code:', err);
        
        let errorMsg = 'Failed to connect Instagram account. Please try again.';
        let errorType = 'generic';
        
        // Extract error message from Error object (API helper throws Error objects)
        if (err instanceof Error) {
          errorMsg = err.message || errorMsg;
        } else if (typeof err === 'string') {
          errorMsg = err;
        }
        
        // Check for specific error types from backend
        // Handle 409 Conflict (account already connected to different user) - PRIORITY CHECK
        // Check this FIRST before other error types
        const isAlreadyConnected = errorMsg.includes('already connected to another user') || 
                                   errorMsg.includes('already connected to a different user');
        
        if (isAlreadyConnected) {
          errorType = 'already_connected_other_user';
          // Backend already provides user-friendly message, use it as-is
          // For "already connected" errors, redirect immediately (no delay) - they're informational
          // Don't show error on callback page, go straight to accounts page
          console.log('⚠️ Account already connected - redirecting immediately to accounts page');
          window.location.replace(`/dashboard/accounts?error=${encodeURIComponent(errorMsg)}&error_type=${errorType}&retry=true`);
          return; // Exit early, don't show error on callback page
        } else if (errorMsg.includes('development mode') || errorMsg.includes('test users')) {
          errorType = 'development_mode';
          // Backend should already provide user-friendly message, but ensure it's helpful
          if (!errorMsg.includes('contact') && !errorMsg.includes('test user')) {
            errorMsg = 'This Instagram app is currently in development mode. Only test users added to the app can connect their accounts. Please contact the app administrator to be added as a test user, or wait until the app is approved and published.';
          }
        } else if (errorMsg.includes('Insufficient Developer Role') || errorMsg.includes('Insufficient developer role')) {
          errorType = 'development_mode';
          errorMsg = 'This Instagram app is currently in development mode. Only test users added to the app can connect their accounts. Please contact the app administrator to be added as a test user, or wait until the app is approved and published.';
        }
        
        // For all other errors, show on callback page and redirect after delay
        setError(errorMsg);
        setErrorType('error');
        setIsProcessing(false);
        
        // Redirect back to accounts page with error (same-tab flow)
        // Include error_type for special UI handling
        console.log('⚠️ API error - redirecting to accounts page');
        setTimeout(() => {
          window.location.href = `/dashboard/accounts?error=${encodeURIComponent(errorMsg)}&error_type=${errorType}&retry=true`;
        }, 2000);
      }
    };

    exchangeCode();
  }, [searchParams, router, session, authLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
        {isProcessing ? (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Connecting your Instagram account...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait, redirecting you back...</p>
          </>
        ) : error ? (
          <>
            {errorType === 'warning' ? (
              // Warning styling for "already connected" errors
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-amber-900">Account Already Connected</h3>
                <p className="mt-2 text-sm text-amber-800">{error}</p>
                <div className="mt-4 p-3 bg-white border border-amber-200 rounded-md">
                  <p className="text-sm font-medium text-amber-900 mb-2">What you can do:</p>
                  <ul className="text-sm text-amber-800 list-disc list-inside space-y-1.5 text-left">
                    <li>Use a different Instagram account that hasn&apos;t been connected yet</li>
                    <li>Contact the other user to disconnect this account first</li>
                    <li>If this is your account, log in with that user&apos;s credentials</li>
                  </ul>
                </div>
              </>
            ) : (
              // Error styling for other errors
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Connection Failed</h3>
                <p className="mt-2 text-sm text-red-600">{error}</p>
                <p className="mt-3 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                  💡 <strong>You can try again:</strong> Click &quot;Connect Account&quot; to retry with a different Instagram account or credentials.
                </p>
              </>
            )}
            <p className="mt-4 text-xs text-gray-500">Redirecting you back to accounts page...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
