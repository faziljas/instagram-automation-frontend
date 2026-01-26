'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

function UpdatePasswordForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdatePasswordFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof UpdatePasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    const result = updatePasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UpdatePasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof UpdatePasswordFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.password });

      if (error) {
        setSubmitError(error.message);
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      console.error('Update password error:', err);
      setSubmitError('Failed to update password. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <div className="rounded-md bg-green-50 p-6 border border-green-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 mb-2">Password updated</h3>
              <p className="text-sm text-green-700">
                Your password has been changed. Redirecting you to sign in...
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            ← Back to login
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className={`block w-full h-10 px-3 text-sm border rounded-md transition-colors ${
              errors.password
                ? 'border-red-500 focus:ring-2 focus:ring-offset-1 focus:ring-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-offset-1 focus:ring-gray-900'
            }`}
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`block w-full h-10 px-3 text-sm border rounded-md transition-colors ${
              errors.confirmPassword
                ? 'border-red-500 focus:ring-2 focus:ring-offset-1 focus:ring-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-offset-1 focus:ring-gray-900'
            }`}
            placeholder="Confirm your new password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
        {submitError && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-md font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          ← Back to login
        </Link>
      </div>
    </>
  );
}

function UpdatePasswordPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error');
      setErrorMessage('Supabase is not configured.');
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const run = async () => {
      const code = searchParams.get('code');

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }
        } catch (e) {
          console.error('Update password code exchange error:', e);
          setStatus('error');
          setErrorMessage('Invalid or expired reset link.');
          return;
        }
      }

      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('ready');
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      setStatus('error');
      setErrorMessage('Invalid or expired reset link. Please request a new one from the forgot password page.');
    };

    run();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex">
        <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center items-center px-8 lg:px-24">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
        <div className="hidden lg:flex lg:w-[55%] bg-slate-900" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen w-full flex">
        <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-8 lg:px-24 relative">
          <div className="absolute top-8 left-8 lg:left-24">
            <Link href="/login" className="text-2xl font-bold text-slate-900">
              InstagramAuto
            </Link>
          </div>
          <div className="w-full max-w-md mx-auto">
            <div className="rounded-md bg-red-50 p-6 border border-red-200">
              <h3 className="text-sm font-medium text-red-800 mb-2">Unable to reset password</h3>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Request a new reset link
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-[55%] bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex">
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-8 lg:px-24 relative">
        <div className="absolute top-8 left-8 lg:left-24">
          <Link href="/login" className="text-2xl font-bold text-slate-900">
            InstagramAuto
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Set a new password
            </h2>
            <p className="mt-2 text-sm text-gray-500 mb-8">
              Enter your new password below. You’ll use it to sign in from now on.
            </p>
          </div>
          <UpdatePasswordForm />
        </div>
      </div>
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 relative overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900" />
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

export default function UpdatePasswordPage() {
  return <UpdatePasswordPageContent />;
}
