'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return null;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">LogicDM</div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Automate Your Instagram Growth
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Powerful automation tools to engage your audience, capture leads, and grow your Instagram presence effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
            <div className="text-gray-700 font-medium">Free Auto-replies</div>
            <div className="text-sm text-gray-500 mt-1">Per month, no credit card</div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
            <div className="text-gray-700 font-medium">Unlimited Rules</div>
            <div className="text-sm text-gray-500 mt-1">Automate everything</div>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-gray-700 font-medium">Instagram Compliant</div>
            <div className="text-sm text-gray-500 mt-1">Official API integration</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to grow your Instagram?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Start for free. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
            >
              View Pricing Plans
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
