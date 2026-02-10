'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header with Logo */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-block">
            <Logo size="md" variant="dark" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
        </div>
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: February 10, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancellation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Subscriptions can be cancelled at any time through the user dashboard. After cancellation, you will retain access to paid features until the end of your current billing period. No further charges will be made after you cancel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Money-Back Guarantee</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We offer a <strong className="font-semibold text-gray-900">7-day money-back guarantee</strong> for initial purchases. If you are not satisfied with your subscription within the first 7 days, contact us at{' '}
              <a href="mailto:admin@logicdm.app" className="text-blue-600 hover:text-blue-800 underline">
                admin@logicdm.app
              </a>
              {' '}to request a full refund. Please contact our support team at{' '}
              <a href="mailto:admin@logicdm.app" className="text-blue-600 hover:text-blue-800 underline">admin@logicdm.app</a>
              {' '}before initiating a dispute or chargeback with your bank. We are committed to resolving all valid refund requests within 24-48 hours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Refunds are processed to the original payment method within <strong className="font-semibold text-gray-900">5–10 business days</strong>. Depending on your bank or card issuer, it may take additional time for the refund to appear on your statement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For refund requests or questions about cancellation, contact us at{' '}
              <a href="mailto:admin@logicdm.app" className="text-blue-600 hover:text-blue-800 underline">
                admin@logicdm.app
              </a>
              {' '}or visit our{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                Contact
              </Link>
              {' '}page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
