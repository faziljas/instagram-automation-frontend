'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We are sorry for the inconvenience. An unexpected error occurred while loading this page.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 text-left">
              <details className="bg-gray-50 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  <p className="text-red-600 font-mono text-xs break-all">
                    {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  )}
                  {error.digest && (
                    <p className="text-xs text-gray-500">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Link>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-sm text-gray-500">
            If this problem persists, please{' '}
            <a
              href="mailto:support@instagramauto.com"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
