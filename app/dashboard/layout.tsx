'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UserProfileMenu from '@/components/UserProfileMenu';
import Logo from '@/components/Logo';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  BoltIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionResponse {
  plan_tier: string;
  status: string;
  stripe_subscription_id: string | null;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: UserGroupIcon },
  { name: 'Automations', href: '/dashboard/automations', icon: SparklesIcon },
  { name: 'Rules', href: '/dashboard/rules', icon: BoltIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCardIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: subscriptionData } = useFetch<SubscriptionResponse>('/users/subscription');


  // Check if user is on Pro or Enterprise plan
  const isProOrEnterprise = subscriptionData?.plan_tier === 'pro' || subscriptionData?.plan_tier === 'enterprise';

  return (
    <ProtectedRoute>
      <div className="min-h-screen dashboard-main-bg">
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
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
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
                  <Link
                    href="/dashboard/subscription"
                    onClick={() => setSidebarOpen(false)}
                    className="block w-full text-center bg-white text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Upgrade
                  </Link>
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
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
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
                  <Link
                    href="/dashboard/subscription"
                    className="block w-full text-center bg-white text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Upgrade
                  </Link>
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
        <div className="lg:pl-64">
          {/* Top header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30 shadow-lg">
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
          <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
