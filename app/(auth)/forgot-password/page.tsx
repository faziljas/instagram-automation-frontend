'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { get } from '@/utils/api';

// Zod validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof ForgotPasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSuccess(false);

    // Validate form data
    const result = forgotPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ForgotPasswordFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit password reset request using Supabase
    setIsSubmitting(true);
    try {
      // First, check if user exists in our backend database
      const normalizedEmail = formData.email.trim().toLowerCase();
      try {
        const backendCheck = await get(`/auth/check-email/${encodeURIComponent(normalizedEmail)}`).catch(() => null);
        
        // If user doesn't exist in backend, inform them to sign up
        if (!backendCheck?.exists) {
          setSubmitError('This email is not registered. Please sign up to create an account.');
          setIsSubmitting(false);
          return;
        }
      } catch (backendError) {
        // If backend check fails, continue with Supabase reset (don't block user)
        console.warn('Backend email check failed, continuing with Supabase:', backendError);
      }

      // User exists in backend, proceed with Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
        redirectTo: 'https://www.logicdm.app/update-password',
      });

      if (error) {
        console.error('Password reset request failed:', error);
        
        // Check if the error indicates the user doesn't exist in Supabase
        // This can happen if user was deleted from Supabase but still exists in our DB
        const errorMessage = error.message?.toLowerCase() || '';
        const isUserNotFound = 
          errorMessage.includes('user not found') ||
          errorMessage.includes('email not found') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('no user found') ||
          error.code === 'user_not_found';
        
        if (isUserNotFound) {
          // User exists in our DB but not in Supabase (deleted from Supabase)
          setSubmitError('This email is not registered. Please sign up to create an account.');
          setIsSubmitting(false);
          return;
        }
        
        // For other errors, still show success to prevent email enumeration
        // (but log the error for debugging)
        setIsSuccess(true);
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      // Even on error, show success to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        {/* Success Message */}
        <div className="rounded-md bg-green-50 p-6 border border-green-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                Check your email
              </h3>
              <p className="text-sm text-green-700">
                We've sent a password reset link to <strong>{formData.email}</strong>. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to login
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={`block w-full h-10 px-3 text-sm border rounded-md transition-colors ${
              errors.email
                ? 'border-red-500 focus:ring-2 focus:ring-offset-1 focus:ring-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-offset-1 focus:ring-gray-900'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800 mb-2">{submitError}</p>
            {submitError.includes('not registered') && (
              <Link
                href="/register"
                className="text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Sign up here →
              </Link>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-md font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          ← Back to login
        </Link>
      </div>
    </>
  );
}

function ForgotPasswordPageContent() {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left Column - Form Area */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-8 lg:px-24 relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 lg:left-24">
          <Link href="/login">
            <img 
              src="/logo.png" 
              alt="LogicDM" 
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Form Content */}
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-500 mb-8">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <ForgotPasswordForm />
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

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}
