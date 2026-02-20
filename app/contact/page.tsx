'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-10">
          Get in touch with our team for support, billing, or general inquiries.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <EnvelopeIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Support Email</h2>
              <a href="mailto:admin@logicdm.app" className="text-blue-600 hover:text-blue-800 font-medium underline">
                admin@logicdm.app
              </a>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm text-gray-800">
              <strong className="font-semibold text-gray-900">Grievance Officer:</strong> For unresolved queries or complaints, please contact{' '}
              <a href="mailto:admin@logicdm.app" className="text-blue-600 hover:text-blue-800 font-medium underline">
                admin@logicdm.app
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
