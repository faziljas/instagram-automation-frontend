'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePost } from '@/hooks/useApi';
import { CheckIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type BillingCycle = 'monthly' | 'yearly';

export default function PricingPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { execute: createCheckoutSession, loading: checkoutLoading } = usePost();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Monthly = $9; Yearly = $7/mo = $84/year (7 × 12)
  const monthlyPrice = 9;
  const monthlyYearlyPrice = 7;
  const yearlyPrice = monthlyYearlyPrice * 12; // 84

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/register');
    }
  };

  const handleUpgrade = async () => {
    try {
      // Require a valid session to start upgrade so we can pass auth to backend
      if (!session?.access_token) {
        console.warn('⚠️ No valid session found when trying to upgrade from pricing page');
        router.push('/login?redirect=/dashboard/subscription');
        return;
      }

      const response = await createCheckoutSession('/api/dodo/create-checkout-session', {
        plan: billingCycle,
      }) as { checkout_url?: string } | undefined;
      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (error) {
      console.error('Failed to create checkout session from pricing page:', error);
    }
  };

  const displayPrice = billingCycle === 'yearly' ? monthlyYearlyPrice : monthlyPrice;
  const originalPrice = 29;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple pricing, unlimited growth.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start for free. Scale when you&apos;re ready.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className={`text-sm font-medium transition-colors ${
                billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              aria-label="Toggle billing cycle"
            >
              <span
                className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`text-sm font-medium transition-colors ${
                  billingCycle === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
              </button>
              {billingCycle === 'yearly' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-in fade-in duration-200">
                  Save 2 months
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Plan Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/ mo</span>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="w-full py-3 px-6 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-8"
            >
              Get Started Free
            </button>

            <div className="space-y-4 flex-grow">
              <div className="flex items-start">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">1 Instagram Account</span>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <strong>1,000 Auto-replies</strong> / month
                </span>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Unlimited Automation Rules</span>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic Analytics</span>
              </div>
              <div className="flex items-start">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Safe & Secure</span>
              </div>
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-0 overflow-hidden relative">
            {/* Most Popular Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
              <span className="inline-flex items-center px-4 py-1.5 rounded-b-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                Most Popular
              </span>
            </div>

            {/* Dark Header */}
            <div className="bg-slate-900 text-white py-8 px-8">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-slate-300 text-sm">Everything you need to scale</p>
            </div>

            {/* White Content Area */}
            <div className="p-8">
              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="line-through text-gray-400 text-2xl font-medium">
                    ${originalPrice}
                  </span>
                  <span className="text-5xl font-bold text-gray-900">${displayPrice}</span>
                  <span className="text-gray-600">/ mo</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-gray-500 mb-1">
                    Billed ${yearlyPrice} annually
                  </p>
                )}
                <p className="text-sm font-semibold text-blue-600">Early Adopter Price</p>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? 'Processing...' : 'Upgrade to Pro'}
              </button>

              <p className="text-xs text-gray-500 text-center mb-4">
                Secure payments powered by Dodo Payments. International cards accepted.
              </p>

              {/* Features List */}
              <div className="space-y-2">
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Connect up to <strong>5</strong> Instagram Accounts</span>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Unlimited</strong> AutoDMs across Reels, Posts, Stories &amp; Lives</span>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced AutoDM Flows (Follow-checks, Sequences)</span>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Unlimited</strong> Leads via Lead Magnets</span>
                </div>
                <div className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority Support via Dedicated Channel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <details className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg font-semibold text-gray-900">
                  Do I really get 1,000 DMs for free?
                </span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-600">
                <p>
                  Yes! We&apos;re generous with our free tier. You get 1,000 auto-replies per month completely free, 
                  along with unlimited automation rules. No credit card required.
                </p>
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg font-semibold text-gray-900">
                  Can I cancel anytime?
                </span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-600">
                <p>
                  Absolutely! You can cancel your subscription instantly at any time from your dashboard. 
                  No questions asked, no hidden fees. We offer a 7-day money-back guarantee for initial purchases.
                </p>
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg font-semibold text-gray-900">
                  Is this Instagram compliant?
                </span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-gray-600">
                <p>
                  Yes! We use Instagram&apos;s official Graph API and follow all their terms of service. 
                  Your account is safe, and all automation is compliant with Instagram&apos;s policies.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
