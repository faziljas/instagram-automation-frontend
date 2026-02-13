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
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
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

          {/* Creative Dashboard Preview - Business Tips */}
          <div className="w-full max-w-4xl mx-auto relative">
            {/* Instagram Gradient Background Container */}
            <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl shadow-2xl shadow-purple-500/30 border border-white/20 overflow-hidden p-8 md:p-12 relative" style={{ background: 'linear-gradient(to bottom right, #9333ea, #ec4899, #f97316, #eab308)' }}>
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
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

              {/* Content */}
              <div className="relative z-10">
                {/* Preview Header */}
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <Logo size="md" variant="light" />
                    <span className="text-white/90 text-sm font-medium">How We Help Your Business</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                    Grow Your Instagram Business
                  </h2>
                  <p className="text-white/90 text-lg">
                    Discover how automation can transform your Instagram presence
                  </p>
                </div>

                {/* Business Improvement Cards - Visual Focus */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Card 1: Save Time */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:border-white/40 transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                        <BoltIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Save Time</h3>
                      <div className="w-full mb-4">
                        <div className="text-4xl font-bold text-white mb-2">20+</div>
                        <div className="text-sm text-white/80 mb-3">hours/week saved</div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Never miss a DM</p>
                    </div>
                  </div>

                  {/* Card 2: Boost Engagement */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:border-white/40 transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Boost Engagement</h3>
                      <div className="w-full mb-4">
                        <div className="text-4xl font-bold text-white mb-2">300%</div>
                        <div className="text-sm text-white/80 mb-3">faster responses</div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Instant replies</p>
                    </div>
                  </div>

                  {/* Card 3: Generate Leads */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:border-white/40 transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                        <ShieldCheckIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Generate Leads</h3>
                      <div className="w-full mb-4">
                        <div className="text-4xl font-bold text-white mb-2">Auto</div>
                        <div className="text-sm text-white/80 mb-3">capture contacts</div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Comments → Customers</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Benefits Bar - Visual */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <ClockIcon className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-xl font-bold text-white mb-1">24/7</p>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Always Active</p>
                    </div>
                    <div className="text-center border-y md:border-y-0 md:border-x border-white/20 py-4 md:py-0">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <UserGroupIcon className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-xl font-bold text-white mb-1">Scale</p>
                      <p className="text-xs text-white/70 uppercase tracking-wide">No Limits</p>
                    </div>
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <ChartBarIcon className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-xl font-bold text-white mb-1">Data</p>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Track Growth</p>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-8 text-center">
                  <p className="text-white text-lg font-medium">
                    Ready to transform your Instagram business? <span className="font-bold">Start free today</span> • No credit card required
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
