'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

function LoginPageContent() {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuth();
  const [showConfigError, setShowConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setShowConfigError(true);
      return;
    }

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // Get the current origin (ngrok URL or localhost)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Build the redirect URL - must match exactly what's in Supabase Redirect URLs
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log('Initiating Google OAuth with redirectTo:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('Login failed:', error.message);
        setError(`Login failed: ${error.message}. Please ensure ${redirectTo} is added to Supabase Redirect URLs.`);
        setIsGoogleLoading(false);
      }
      // Note: If successful, user will be redirected, so we don't need to handle success here
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user && data.session) {
        // Sync user to backend and fetch user data
        await fetchUser();
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  // Show configuration error if Supabase is not set up
  if (showConfigError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Supabase Not Configured</h2>
            <p className="text-gray-600 mb-6">
              Please set up Supabase authentication to continue. Add the following environment variables to your <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code> file:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <code className="text-sm text-gray-800">
                NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
              </code>
            </div>
            <p className="text-sm text-gray-500">
              See <code className="bg-gray-100 px-2 py-1 rounded">SUPABASE_SETUP.md</code> for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left Column - Form Area */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-8 lg:px-24 relative">
        {/* Top Navigation */}
        <div className="absolute top-8 left-8 lg:left-24 right-8 lg:right-24 flex items-center justify-between z-10">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Logo - Moved below navigation */}
        <div className="absolute top-20 left-8 lg:left-24 lg:top-24">
          <Logo size="md" variant="dark" />
        </div>

        {/* Form Content */}
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 mb-8">
              Sign in to access your automation dashboard.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign in with Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-10 flex items-center justify-center gap-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full h-10 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Social Proof */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-3">Trusted by 100+ Creators</p>
            <div className="flex items-center justify-center gap-2">
              {/* Avatar faces */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                A
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold -ml-2">
                B
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold -ml-2">
                C
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold -ml-2">
                D
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column - Visual Area */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Gradient Blob - Orange/Purple */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/30 via-pink-500/30 to-purple-600/30 rounded-full blur-3xl opacity-60 animate-pulse" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
          {/* Feature Highlights */}
          <div className="max-w-md space-y-8">
            {/* Headline */}
            <h2 className="text-4xl font-bold text-white leading-tight">
              Turn Comments into Customers.
            </h2>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg text-white/90 leading-relaxed">
                  Automate replies 24/7 without lifting a finger.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg text-white/90 leading-relaxed">
                  Capture leads directly from your Instagram comments.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg text-white/90 leading-relaxed">
                  Safe, secure, and approved by Meta.
                </p>
              </div>
            </div>
          </div>

          {/* Mock Notification Card */}
          <div className="absolute bottom-20 right-12 max-w-xs animate-float">
            <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  IG
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Instagram</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-800">
                  Here is the link you asked for! 🚀
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
