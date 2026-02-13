import Link from 'next/link';
import { Metadata } from 'next';
import { getCanonicalBase } from '@/lib/canonical';
import Logo from '@/components/Logo';
import ClientAuthRedirect from '@/components/ClientAuthRedirect';
import { 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'LogicDM - Instagram Automation & Marketing Made Easy',
  description: 'Automate your Instagram DMs, replies, and engagement with powerful automation rules. Get 1,000 free DMs per month. No credit card required. Grow your audience effortlessly.',
  keywords: ['Instagram automation', 'Instagram DM automation', 'Instagram marketing', 'social media automation', 'Instagram growth', 'auto reply', 'Instagram engagement', 'lead generation'],
  openGraph: {
    title: 'LogicDM - Instagram Automation & Marketing Made Easy',
    description: 'Automate your Instagram DMs and engagement with powerful automation rules. Get 1,000 free DMs per month.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LogicDM Instagram Automation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LogicDM - Instagram Automation & Marketing Made Easy',
    description: 'Automate your Instagram DMs and engagement with powerful automation rules. Start free today.',
  },
};

const siteUrl = getCanonicalBase();

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LogicDM',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
    description: '1,000 free DMs per month',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  description: 'Automate your Instagram marketing and engagement with powerful automation rules, scheduled posts, and analytics.',
  url: siteUrl,
  screenshot: `${siteUrl}/og-image.png`,
  featureList: [
    '1,000 Free DMs per month',
    'Unlimited automation rules',
    'Instagram API compliant',
    'Real-time analytics',
    'Lead capture tools',
  ],
};

export default function HomePage() {

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Client-side auth redirect - doesn't block SSR */}
      <ClientAuthRedirect />
    
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

          {/* Creative Dashboard Preview */}
          <div className="w-full max-w-4xl mx-auto relative">
            {/* Dark Background Container */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-3xl shadow-2xl shadow-purple-500/20 border border-purple-500/20 overflow-hidden p-8 md:p-12">
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

              {/* Gradient Blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50" />

              {/* Content */}
              <div className="relative z-10">
                {/* Preview Header */}
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      LD
                    </div>
                    <span className="text-white/60 text-sm font-medium">Dashboard Preview</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                    See What Awaits You
                  </h2>
                  <p className="text-white/70 text-lg">
                    Get instant insights into your Instagram automation performance
                  </p>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Card 1: DMs Sent */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">DMs Sent</h3>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-white mb-3">847</p>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-white/60">Today: <span className="text-white font-medium">23 DMs</span></p>
                      <p className="text-sm text-white/60">This week: <span className="text-white font-medium">156 DMs</span></p>
                    </div>
                  </div>

                  {/* Card 2: Leads Captured */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">Leads</h3>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <BoltIcon className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-white mb-2">42</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-green-400 font-medium">+12 this week</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-white/60">Conversion: <span className="text-white font-medium">4.9%</span></p>
                      <p className="text-sm text-white/60">Avg response: <span className="text-white font-medium">2.3h</span></p>
                    </div>
                  </div>

                  {/* Card 3: Active Rules */}
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">Active Rules</h3>
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-white">3</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">Story Reply</p>
                          <p className="text-xs text-white/50">12 triggers today</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">DM Follow-up</p>
                          <p className="text-xs text-white/50">8 triggers today</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats Bar */}
                <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/80 to-slate-800/90 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white mb-2">5,000+</p>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Active Creators</p>
                    </div>
                    <div className="text-center border-x border-slate-700">
                      <p className="text-3xl font-bold text-white mb-2">2M+</p>
                      <p className="text-xs text-white/60 uppercase tracking-wide">DMs Automated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white mb-2">99.9%</p>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Uptime</p>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-8 text-center">
                  <p className="text-white/80 text-base">
                    Start automating in <span className="text-white font-semibold">60 seconds</span> • No credit card required
                  </p>
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
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Refund Policy
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Contact Us
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
    </>
  );
}
