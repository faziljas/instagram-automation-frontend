'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgrade } from '@/hooks/useUpgrade';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UserProfileMenu from '@/components/UserProfileMenu';
import Logo from '@/components/Logo';
import { ToastProvider } from '@/components/Toast';
import GettingStartedModal from '@/components/GettingStartedModal';
import {
  getOnboardingVisitSnapshot,
  markOnboardingCompleted,
  recordOnboardingDestinationVisit,
  shouldShowOnboardingAuto,
} from '@/utils/onboarding';
import {
  AUTOMATIONS_TOUR_DOM_EVENT,
  AUTOMATIONS_TOUR_QUERY,
  markAutomationsTourRunPending,
} from '@/utils/automationsSpotlightTour';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  BoltIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: UserGroupIcon },
  { name: 'Automations', href: '/dashboard/automations', icon: SparklesIcon },
  // Rules view has been merged into Automations; keep backend APIs but hide this tab.
  // { name: 'Rules', href: '/dashboard/rules', icon: BoltIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Usage Details', href: '/dashboard/subscription', icon: BoltIcon },
  // Settings page is accessible from the user menu; hide sidebar entry to avoid duplication.
  // { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, supabaseUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  
  // Use subscription hook with caching to prevent pro users from appearing as free on refresh
  const { hasProPlan: isProOrEnterprise } = useSubscription();
  
  // Upgrade hook for sidebar upgrade button
  const { handleUpgrade, checkoutLoading } = useUpgrade();

  const [visitTick, setVisitTick] = useState(0);
  const visitSnapshot = useMemo(() => getOnboardingVisitSnapshot(), [visitTick]);

  /**
   * Open Getting started when onboarding is pending. Depends on `supabaseUser.id` so we
   * re-check after auth hydrates (first paint can run before session is ready).
   */
  useEffect(() => {
    if (shouldShowOnboardingAuto()) setShowGettingStarted(true);
  }, [supabaseUser?.id]);

  /** Record Accounts / Automations / Analytics visits and finish onboarding when all three were opened. */
  useEffect(() => {
    if (!shouldShowOnboardingAuto()) return;
    const finished = recordOnboardingDestinationVisit(pathname);
    if (finished) setShowGettingStarted(false);
    setVisitTick((t) => t + 1);
  }, [pathname]);

  const launchAutomationsSpotlightTour = useCallback(() => {
    setSidebarOpen(false);
    if (pathname === '/dashboard/automations') {
      window.dispatchEvent(new CustomEvent(AUTOMATIONS_TOUR_DOM_EVENT));
    } else {
      markAutomationsTourRunPending();
      router.push(`/dashboard/automations?tour=${AUTOMATIONS_TOUR_QUERY}`);
    }
  }, [pathname, router]);

  return (
    <ToastProvider>
      <ProtectedRoute>
      <div className="dashboard-main-bg w-full overflow-x-hidden flex flex-col flex-1 min-h-screen" style={{ backgroundColor: 'rgb(243 244 246)' }}>
        <GettingStartedModal
          isOpen={showGettingStarted}
          onClose={() => setShowGettingStarted(false)}
          onFinish={() => {
            markOnboardingCompleted();
            setShowGettingStarted(false);
          }}
          visitedAccounts={visitSnapshot.accounts}
          visitedAutomations={visitSnapshot.automations}
          visitedAnalytics={visitSnapshot.analytics}
          onRequestAutomationsSpotlightTour={launchAutomationsSpotlightTour}
        />
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar for mobile */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-24 px-6 bg-[#0f172a]">
            <Logo size="lg" variant="light" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-4 py-4 space-y-1 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setSidebarOpen(false);
                    startTransition(() => {
                      // Navigation is handled by Next.js Link
                    });
                  }}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${isPending && !isActive ? 'opacity-70' : ''}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
            {/* Upgrade Card - Only show if user is not on Pro or Enterprise */}
            {!isProOrEnterprise && (
              <div className="px-4 pb-4 mt-auto">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">Pro</span>
                    <SparklesIcon className="h-5 w-5 text-white/80" />
                  </div>
                  <p className="text-white/90 text-xs mb-4">
                    Unlock advanced features and unlimited automation
                  </p>
                  <button
                    onClick={async () => {
                      setSidebarOpen(false);
                      try {
                        await handleUpgrade();
                      } catch (error) {
                        // Error handling is done in the hook (redirects for auth errors)
                        // Other errors will be shown via browser console
                        console.error('Upgrade failed:', error);
                      }
                    }}
                    disabled={checkoutLoading}
                    className="block w-full text-center bg-white text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? 'Processing...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            )}
            
            {/* User Profile Menu */}
            <div className="px-4 pb-6 border-t border-gray-800 pt-4">
              <UserProfileMenu />
            </div>
        </div>

        {/* Sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-[#0f172a] overflow-y-auto">
            <div className="flex items-center justify-center h-28 px-6 bg-[#0f172a]">
              <Logo size="lg" variant="light" />
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => {
                      // Prefetch on hover for faster navigation
                      router.prefetch(item.href);
                    }}
                    onClick={() => {
                      startTransition(() => {
                        // Navigation is handled by Next.js Link
                      });
                    }}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    } ${isPending && !isActive ? 'opacity-70' : ''}`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {/* Upgrade Card - Only show if user is not on Pro or Enterprise */}
            {!isProOrEnterprise && (
              <div className="px-4 pb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">Pro</span>
                    <SparklesIcon className="h-5 w-5 text-white/80" />
                  </div>
                  <p className="text-white/90 text-xs mb-4">
                    Unlock advanced features and unlimited automation
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await handleUpgrade();
                      } catch (error) {
                        // Error handling is done in the hook (redirects for auth errors)
                        // Other errors will be shown via browser console
                        console.error('Upgrade failed:', error);
                      }
                    }}
                    disabled={checkoutLoading}
                    className="block w-full text-center bg-white text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? 'Processing...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            )}
            
            {/* User Profile Menu */}
            <div className="px-4 pb-6 border-t border-gray-800 pt-4">
              <UserProfileMenu />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full lg:pl-64 overflow-x-hidden dashboard-main-bg">
          {/* Top header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30 shadow-lg w-full flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Spacer for mobile */}
              <div className="flex-1 lg:hidden" />

              {/* User info */}
              <div className="text-sm text-gray-900 font-semibold">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 py-5 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">{children}</main>
        </div>
      </div>
      </ProtectedRoute>
    </ToastProvider>
  );
}
