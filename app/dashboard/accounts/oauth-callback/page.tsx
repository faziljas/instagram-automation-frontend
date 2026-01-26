'use client';

import { useEffect } from 'react';

/**
 * OAuth callback page for popup window.
 * Extracts access token from URL hash and sends it to parent window via postMessage.
 */
export default function OAuthCallbackPage() {
  useEffect(() => {
    try {
      // Extract token from URL hash (response_type=token returns hash, not query params)
      const hash = window.location.hash.substring(1); // Remove '#'
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get('access_token');
      const error = params.get('error');
      const errorReason = params.get('error_reason');
      const errorDescription = params.get('error_description');

      // Send message to parent window (the accounts page)
      if (accessToken) {
        console.log('✅ OAuth success, access token received');
        window.opener?.postMessage(
          {
            type: 'INSTAGRAM_OAUTH_SUCCESS',
            access_token: accessToken
          },
          window.location.origin
        );
        // Close popup
        window.close();
      } else if (error) {
        console.error('❌ OAuth error:', error, errorReason, errorDescription);
        window.opener?.postMessage(
          {
            type: 'INSTAGRAM_OAUTH_ERROR',
            error: errorDescription || errorReason || error || 'OAuth authentication failed'
          },
          window.location.origin
        );
        // Close popup
        window.close();
      } else {
        // No token or error - might still be loading
        console.log('⏳ OAuth callback loaded, waiting for redirect...');
      }
    } catch (err) {
      console.error('❌ Error processing OAuth callback:', err);
      window.opener?.postMessage(
        {
          type: 'INSTAGRAM_OAUTH_ERROR',
          error: 'Failed to process OAuth callback'
        },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
