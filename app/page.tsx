'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-white">
      {/* Sticky Glassy Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" variant="dark" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden">
        {/* Gradient Blob Background */}
        <div className="absolute top-[-20%] left-[50%] w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Automate
            </span>{' '}
            Your Instagram Growth
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Powerful automation tools to engage your audience, capture leads, and grow your Instagram presence effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all"
            >
              View Pricing
            </Link>
          </div>

          {/* Dashboard Mockup Preview */}
          <div className="w-full max-w-5xl mx-auto aspect-video bg-gray-900 rounded-xl shadow-2xl shadow-purple-500/20 border border-gray-200/50 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
            <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 p-6 flex flex-col">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">LD</span>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">Dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">fazil.jas</span>
                  <div className="h-8 w-8 bg-gray-700/80 rounded-full"></div>
                </div>
              </div>
              
              {/* Mock Dashboard Content */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                {/* Stats Card 1 - DMs Sent */}
                <div className="bg-gray-800/60 rounded-lg p-5 border border-gray-700/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-xs font-medium">DMs Sent</span>
                    <div className="h-5 w-5 bg-blue-500/50 rounded flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="h-3 w-3 text-blue-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-white mb-2">847</div>
                    <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full w-[75%] bg-gradient-to-r from-blue-500 to-blue-400"></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">75% of 1,000 limit</div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">Today: 23 DMs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">This week: 156 DMs</span>
                    </div>
                  </div>
                </div>
                
                {/* Stats Card 2 - Leads Captured */}
                <div className="bg-gray-800/60 rounded-lg p-5 border border-gray-700/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-xs font-medium">Leads Captured</span>
                    <div className="h-5 w-5 bg-purple-500/50 rounded flex items-center justify-center">
                      <BoltIcon className="h-3 w-3 text-purple-400" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-white mb-2">42</div>
                    <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-to-r from-purple-500 to-purple-400"></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">+12 this week</div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-purple-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">Conversion: 4.9%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-purple-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">Avg response: 2.3h</span>
                    </div>
                  </div>
                </div>
                
                {/* Automation Rules Card */}
                <div className="bg-gray-800/60 rounded-lg p-5 border border-gray-700/30 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-xs font-medium">Active Rules</span>
                    <div className="h-5 w-5 bg-green-500/50 rounded flex items-center justify-center">
                      <ShieldCheckIcon className="h-3 w-3 text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-3 p-2.5 bg-gray-700/40 rounded-lg border border-gray-600/30">
                      <div className="h-2.5 w-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-200 mb-1">Story Reply Rule</div>
                        <div className="text-xs text-gray-500">Triggers: 12 today</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-700/40 rounded-lg border border-gray-600/30">
                      <div className="h-2.5 w-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-200 mb-1">DM Follow-up</div>
                        <div className="text-xs text-gray-500">Triggers: 8 today</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-700/40 rounded-lg border border-gray-600/30">
                      <div className="h-2.5 w-2.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-200 mb-1">Comment Response</div>
                        <div className="text-xs text-gray-500">Triggers: 5 today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-blue-50 p-3 rounded-lg w-fit mb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">1,000 Free DMs</h3>
            <p className="text-gray-600">
              Get started with 1,000 auto-replies per month completely free. No credit card required.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-purple-50 p-3 rounded-lg w-fit mb-4">
              <BoltIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited Rules</h3>
            <p className="text-gray-600">
              Create as many automation rules as you need. Automate everything from DMs to story replies.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-green-50 p-3 rounded-lg w-fit mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">100% Safe</h3>
            <p className="text-gray-600">
              Built on Instagram&apos;s official API. Fully compliant with Instagram&apos;s terms of service.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Terms
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} LogicDM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
