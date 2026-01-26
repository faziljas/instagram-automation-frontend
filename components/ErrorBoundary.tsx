'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log error to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { extra: errorInfo });
      this.logErrorToService(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Placeholder for error logging service
    // In production, you would send this to Sentry, LogRocket, etc.
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    console.error('Error logged:', errorLog);
  }

  handleRefresh = () => {
    // Clear error state and reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  handleReset = () => {
    // Clear error state without reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
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
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-gray-50 rounded-lg p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="space-y-2">
                      <p className="text-red-600 font-mono text-xs break-all">
                        {this.state.error.message}
                      </p>
                      {this.state.error.stack && (
                        <pre className="text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh Page
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

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for specific sections
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

export function SectionErrorBoundary({
  children,
  sectionName = 'section',
  onReset,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-900 mb-2">
            Failed to load {sectionName}
          </p>
          <p className="text-xs text-red-700 mb-4">
            An error occurred while rendering this section.
          </p>
          <button
            onClick={() => {
              if (onReset) onReset();
              window.location.reload();
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
