import { AxiosError } from 'axios';

interface ApiErrorResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Parse API error response and return user-friendly message
 * @param error - Error object from API call
 * @returns User-friendly error message
 */
export function parseApiError(error: unknown): string {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;

    // API returned structured error
    if (response?.error?.message) {
      return response.error.message;
    }

    // HTTP status code errors
    if (error.response?.status) {
      return getHttpErrorMessage(error.response.status);
    }

    // Network errors
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get user-friendly message for HTTP status codes
 * @param status - HTTP status code
 * @returns Error message
 */
function getHttpErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Server is temporarily unavailable. Please try again.',
    503: 'Service is under maintenance. Please try again later.',
  };

  return messages[status] || `Request failed with status ${status}`;
}

/**
 * Handle form validation errors
 * @param error - Error object
 * @returns Object with field-specific errors
 */
export function parseValidationError(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;

    if (response?.error?.details) {
      // Convert API validation errors to field-specific errors
      const fieldErrors: Record<string, string> = {};

      Object.entries(response.error.details).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          fieldErrors[field] = messages[0];
        } else if (typeof messages === 'string') {
          fieldErrors[field] = messages;
        }
      });

      return fieldErrors;
    }
  }

  return {};
}

/**
 * Log error to console (in development) or error tracking service (in production)
 * @param error - Error object
 * @param context - Additional context about where error occurred
 */
export function logError(error: unknown, context?: string): void {
  const errorMessage = parseApiError(error);
  const timestamp = new Date().toISOString();

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${timestamp}] ${context ? `[${context}]` : ''} ${errorMessage}`, error);
  }

  // In production, send to error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
  }
}

/**
 * Handle error with toast notification
 * Requires ToastProvider to be set up in app
 * @param error - Error object
 * @param showToast - Toast function from useToast hook
 * @param context - Optional context for logging
 */
export function handleErrorWithToast(
  error: unknown,
  showToast?: (type: string, message: string) => void,
  context?: string
): void {
  const errorMessage = parseApiError(error);

  // Log error
  logError(error, context);

  // Show toast notification if function provided
  if (showToast) {
    showToast('error', errorMessage);
  }
}

/**
 * Check if error is authentication error (401)
 * @param error - Error object
 * @returns True if authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is permission error (403)
 * @param error - Error object
 * @returns True if permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Check if error is validation error (422)
 * @param error - Error object
 * @returns True if validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 422;
  }
  return false;
}
