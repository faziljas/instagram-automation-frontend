'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

// Zod validation schema
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

function RegisterPageContent() {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuth();
  const [showConfigError, setShowConfigError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
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

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // Get the current origin (ngrok URL or localhost)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Build the redirect URL - must match exactly what's in Supabase Redirect URLs
      const redirectTo = `${currentOrigin}/dashboard`;
      
      console.log('Initiating Google OAuth signup with redirectTo:', redirectTo);
      
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
        console.error('Signup failed:', error.message);
        setError(`Signup failed: ${error.message}. Please ensure ${redirectTo} is added to Supabase Redirect URLs.`);
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to sign up with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError(null);

    // Validate form data
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: 'https://www.logicdm.app/auth/callback',
        },
      });

      if (error) {
        // Handle specific Supabase errors
        let errorMessage = error.message;
        
        // Check if user already exists
        if (error.message?.includes('already registered') || 
            error.message?.includes('already exists') ||
            error.message?.includes('User already registered')) {
          // Try to check if it's a Google OAuth user by attempting to get user info
          // Note: We can't directly check providers without admin access, but we can provide helpful message
          errorMessage = 'An account with this email already exists. If you signed up with Google, please use "Sign up with Google" instead. Otherwise, please sign in.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // IMPORTANT: Supabase doesn't return an error for duplicate emails (security feature)
      // Instead, it returns success with user but NO session when email already exists
      // Check if user exists but session is null - this means email is already registered
      // We can detect existing users by checking:
      // 1. If user is confirmed (confirmed_at is not null)
      // 2. If user has logged in before (last_sign_in_at exists)
      // 3. If user was created more than a few seconds ago (not a fresh signup)
      if (data.user && !data.session) {
        const userCreatedAt = data.user.created_at ? new Date(data.user.created_at) : null;
        const now = new Date();
        const isRecentlyCreated = userCreatedAt && (now.getTime() - userCreatedAt.getTime()) <= 5000;
        
        // If user is confirmed, has logged in before, or was created more than 5 seconds ago, it's a duplicate
        if (data.user.confirmed_at || data.user.last_sign_in_at || !isRecentlyCreated) {
          setError('An account with this email already exists. If you signed up with Google, please use "Sign up with Google" instead. Otherwise, please sign in.');
          setIsLoading(false);
          return;
        }
        
        // Otherwise, it's a new user waiting for email confirmation
        // Fall through to show success message below
      }

      if (data.user && data.session) {
        // New user successfully created with session (email confirmation not required)
        await fetchUser();
        router.push('/dashboard');
      } else if (data.user && !data.session) {
        // New user created but waiting for email confirmation
        setError(null);
        // Show success message - email confirmation sent
        alert('Account created successfully! Please check your email to confirm your account before signing in.');
        router.push('/login');
      } else {
        // No user returned - this shouldn't happen but handle it
        setError('Failed to create account. Please try again.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear general error
    if (error) {
      setError(null);
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
    <div className="min-h-screen w-full flex">
      {/* Left Column - Form Area */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-8 lg:px-24 relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 lg:left-24">
          <div className="text-2xl font-bold text-slate-900">
            InstagramAuto
          </div>
        </div>

        {/* Form Content */}
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-500 mb-8">
              Sign up to start automating your Instagram DMs.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign up with Google Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-10 flex items-center justify-center gap-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span>Signing up...</span>
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
                <span>Sign up with Google</span>
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
          <form onSubmit={handleEmailSignup} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading || isGoogleLoading}
                className={`w-full h-10 px-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading || isGoogleLoading}
                className={`w-full h-10 px-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="At least 6 characters"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading || isGoogleLoading}
                className={`w-full h-10 px-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
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

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900" />

        {/* Quote Card */}
        <div className="relative z-10 flex items-center justify-center h-full px-12">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 max-w-md">
            <p className="text-2xl font-semibold text-white leading-relaxed mb-4">
              "Automating my DMs saved me 20 hours a week."
            </p>
            <p className="text-lg text-white/80">— Creator Name</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterPageContent />;
}
