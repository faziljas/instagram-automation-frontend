'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { markOnboardingPending } from '@/utils/onboarding';

/**
 * Supabase auth callback page for email confirmation (signup verify).
 * Users land here after clicking "Verify Email" in the signup email.
 * Handles both hash-based (#access_token=...) and code-based (?code=...) redirects.
 * Establishes session and redirects to /dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured.');
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const run = async () => {
      const code = searchParams.get('code');

      if (code) {
        // PKCE flow: exchange code for session
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Auth callback exchange error:', exchangeError);
            setError(exchangeError.message);
            setTimeout(() => router.replace('/login?error=session_exchange_failed'), 2000);
            return;
          }
        } catch (e) {
          console.error('Auth callback error:', e);
          setError('Failed to complete sign in.');
          setTimeout(() => router.replace('/login?error=session_exchange_failed'), 2000);
          return;
        }
      }
      // Hash flow: Supabase client parses #access_token=... automatically (detectSessionInUrl).
      // Session may already be set or will be shortly.

      // Wait briefly for session (hash parsing or exchange) then redirect
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If the user came from email verification, ensure we still show the getting started guide.
          markOnboardingPending();
          router.replace('/dashboard');
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      setError('Could not establish session. The link may have expired.');
      setTimeout(() => router.replace('/login?error=session_timeout'), 2500);
    };

    run();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification failed</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
        <p className="mt-1 text-sm text-gray-500">Redirecting you to the dashboard.</p>
      </div>
    </div>
  );
}
