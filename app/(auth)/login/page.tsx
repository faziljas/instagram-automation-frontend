'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiShieldCheck } from 'react-icons/hi';
import { FaInstagram, FaBolt, FaRocket, FaEnvelope, FaChartLine, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import Logo from '@/components/Logo';

// Zod validation schema for signup
const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type ViewState = 'welcome' | 'signup' | 'login';

function LoginPageContent() {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('welcome');
  const [showConfigError, setShowConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Signup form state
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupErrors, setSignupErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

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

  const handleGoogleAuth = async (isSignup: boolean = false) => {
    setIsGoogleLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${currentOrigin}/dashboard`;
      
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
        setError(`Authentication failed: ${error.message}`);
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to authenticate with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

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
        await fetchUser();
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    setError(null);
    setInfoMessage(null);

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
        }
      });
      setSignupErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message?.includes('already registered') || 
            error.message?.includes('already exists') ||
            error.message?.includes('User already registered')) {
          errorMessage = 'This email is already registered. Please log in instead.';
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.user && !data.session) {
        // Clear form fields
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
        });
        setSignupErrors({});
        
        // Show success message
        setInfoMessage('Please check your email to confirm your account.');
        setIsLoading(false);
        
        // Clear any existing timer
        if (redirectTimer) {
          clearTimeout(redirectTimer);
        }
        
        // Redirect to login view after 5 seconds (give user time to read the message)
        const timer = setTimeout(() => {
          setViewState('login');
          // Pre-fill email in login form for convenience
          setEmail(normalizedEmail);
          // Clear message after switching to login view
          setTimeout(() => {
            setInfoMessage(null);
          }, 100);
        }, 5000);
        
        setRedirectTimer(timer);
        
        return;
      }

      if (data.user && data.session) {
        await fetchUser();
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up. Please try again.');
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
      <div className="w-full lg:w-[45%] bg-white flex flex-col px-8 lg:px-24 relative min-h-screen">
        {/* Logo */}
        <div className="absolute top-8 left-8 lg:left-24">
          <Logo size="md" variant="dark" />
        </div>

        {/* Content Container */}
        <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-1 py-12">
          <div className="flex-1 flex flex-col justify-center">
            {/* Welcome State */}
            {viewState === 'welcome' && (
              <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
                  Supercharge your Instagram DMs.
                </h1>
                <p className="text-lg text-gray-600">
                  Join 5,000+ creators turning comments into customers automatically.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setViewState('signup')}
                  className="w-full h-12 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-md font-semibold text-base transition-all shadow-sm"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setViewState('login')}
                  className="w-full h-12 text-slate-700 hover:text-slate-900 font-medium text-base transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>

              {/* Tech & Security Trust Badge */}
              <div className="pt-6 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <HiShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Built on the Official Instagram API</span>
                </div>
                <p className="text-xs text-gray-500">100% Safe & Meta Compliant</p>
              </div>
            </div>
          )}

          {/* Signup Form */}
          {viewState === 'signup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                  Create your account
                </h2>
                <p className="text-sm text-gray-500">
                  Start automating your Instagram DMs today.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {infoMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800 font-medium">{infoMessage}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleGoogleAuth(true)}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-10 flex items-center justify-center gap-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Signing up...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Sign up with Google</span>
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                  {signupErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="At least 6 characters"
                  />
                  {signupErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Confirm your password"
                  />
                  {signupErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full h-10 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setViewState('login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          {viewState === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                  Welcome back
                </h2>
                <p className="text-sm text-gray-500">
                  Sign in to access your automation dashboard.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {infoMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800 font-medium">{infoMessage}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleGoogleAuth(false)}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-10 flex items-center justify-center gap-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                </div>

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

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setViewState('signup')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Footer Links */}
          <div className="mt-auto pt-8 pb-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/terms" className="hover:text-gray-600 transition-colors">
                Terms of Service
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/refund-policy" className="hover:text-gray-600 transition-colors">
                Refund Policy
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/contact" className="hover:text-gray-600 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Visual Area */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 relative overflow-hidden min-h-screen">
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

        {/* Gradient Blob */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/30 via-pink-500/30 to-purple-600/30 rounded-full blur-3xl opacity-60 animate-pulse" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900" />

        {/* Dashboard Preview (for Welcome/Login) */}
        {(viewState === 'welcome' || viewState === 'login') && (
          <div className="relative z-10 flex items-center justify-center h-full px-12 overflow-y-auto py-12">
            <div className="max-w-2xl w-full">
              {/* Preview Header */}
              <div className="text-center mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    LD
                  </div>
                  <span className="text-white/60 text-sm font-medium">Dashboard Preview</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  See What Awaits You
                </h2>
                <p className="text-white/70 text-sm">
                  Get instant insights into your Instagram automation performance
                </p>
              </div>

              {/* Mini Dashboard Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Card 1: DMs Sent */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 animate-fade-in shadow-xl hover:border-blue-500/50 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">DMs Sent</h3>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <FaPaperPlane className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-white">847</p>
                  </div>
                  <div className="mb-2">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/60">Today: <span className="text-white font-medium">23 DMs</span></p>
                    <p className="text-xs text-white/60">This week: <span className="text-white font-medium">156 DMs</span></p>
                  </div>
                </div>

                {/* Card 2: Leads Captured */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 animate-fade-in shadow-xl hover:border-purple-500/50 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">Leads</h3>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <FaBolt className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-white">42</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-green-400 font-medium">+12 this week</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/60">Conversion: <span className="text-white font-medium">4.9%</span></p>
                    <p className="text-xs text-white/60">Avg response: <span className="text-white font-medium">2.3h</span></p>
                  </div>
                </div>

                {/* Card 3: Active Rules */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 animate-fade-in shadow-xl hover:border-green-500/50 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">Active Rules</h3>
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <FaCheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-white">3</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">Story Reply</p>
                        <p className="text-xs text-white/50">12 triggers today</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">DM Follow-up</p>
                        <p className="text-xs text-white/50">8 triggers today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stats Bar */}
              <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/80 to-slate-800/90 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 animate-fade-in shadow-xl" style={{ animationDelay: '0.4s' }}>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-1">5,000+</p>
                    <p className="text-xs text-white/60 uppercase tracking-wide">Active Creators</p>
                  </div>
                  <div className="text-center border-x border-slate-700">
                    <p className="text-2xl font-bold text-white mb-1">2M+</p>
                    <p className="text-xs text-white/60 uppercase tracking-wide">DMs Automated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-1">99.9%</p>
                    <p className="text-xs text-white/60 uppercase tracking-wide">Uptime</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-white/80 text-sm">
                  Start automating in <span className="text-white font-semibold">60 seconds</span> • No credit card required
                </p>
              </div>
            </div>
          </div>
        )}

        {/* How LogicDM Works Timeline (for Signup) */}
        {viewState === 'signup' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
            <div className="max-w-md w-full space-y-8">
              {/* Headline */}
              <h2 className="text-3xl font-bold text-white text-center">
                Launch your first automation in 60 seconds.
              </h2>

              {/* Timeline Steps */}
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/20"></div>

                {/* Step 1: Connect */}
                <div className="relative flex items-start gap-6 mb-8 animate-fade-in" style={{ animationDelay: '0s' }}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white/20">
                    <FaInstagram className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="backdrop-blur-md bg-white/10 p-5 rounded-xl border border-white/20 shadow-lg">
                      <h3 className="text-lg font-semibold text-white mb-1">Connect your Account</h3>
                      <p className="text-sm text-white/80">Securely link your Creator or Business profile via the Official Meta API.</p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Trigger */}
                <div className="relative flex items-start gap-6 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white/20">
                    <FaBolt className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="backdrop-blur-md bg-white/10 p-5 rounded-xl border border-white/20 shadow-lg">
                      <h3 className="text-lg font-semibold text-white mb-1">Set a Keyword</h3>
                      <p className="text-sm text-white/80">Choose a trigger word like 'Price' or 'Link' for your posts.</p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Profit */}
                <div className="relative flex items-start gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg border-2 border-white/20">
                    <FaRocket className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="backdrop-blur-md bg-white/10 p-5 rounded-xl border border-white/20 shadow-lg">
                      <h3 className="text-lg font-semibold text-white mb-1">Watch it Work</h3>
                      <p className="text-sm text-white/80">LogicDM instantly replies and sends the DM while you sleep.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
