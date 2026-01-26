import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Handle success with toast notification
 * @param message - Success message to display
 * @param showToast - Toast function from useToast hook
 */
export function handleSuccessWithToast(
  message: string,
  showToast?: (type: string, message: string) => void
): void {
  if (showToast) {
    showToast('success', message);
  }
}

/**
 * Handle success with toast and redirect
 * @param message - Success message to display
 * @param redirectPath - Path to redirect to
 * @param router - Next.js router instance
 * @param showToast - Toast function from useToast hook
 * @param delay - Delay before redirect in milliseconds (default: 1500)
 */
export function handleSuccessWithRedirect(
  message: string,
  redirectPath: string,
  router: AppRouterInstance,
  showToast?: (type: string, message: string) => void,
  delay: number = 1500
): void {
  // Show success toast
  if (showToast) {
    showToast('success', message);
  }

  // Redirect after delay
  setTimeout(() => {
    router.push(redirectPath);
  }, delay);
}

/**
 * Handle success with toast and page reload
 * @param message - Success message to display
 * @param showToast - Toast function from useToast hook
 * @param delay - Delay before reload in milliseconds (default: 1500)
 */
export function handleSuccessWithReload(
  message: string,
  showToast?: (type: string, message: string) => void,
  delay: number = 1500
): void {
  // Show success toast
  if (showToast) {
    showToast('success', message);
  }

  // Reload page after delay
  setTimeout(() => {
    window.location.reload();
  }, delay);
}

/**
 * Handle success with custom callback
 * @param message - Success message to display
 * @param callback - Custom callback function to execute
 * @param showToast - Toast function from useToast hook
 * @param delay - Delay before callback in milliseconds (default: 0)
 */
export function handleSuccessWithCallback(
  message: string,
  callback: () => void,
  showToast?: (type: string, message: string) => void,
  delay: number = 0
): void {
  // Show success toast
  if (showToast) {
    showToast('success', message);
  }

  // Execute callback after optional delay
  if (delay > 0) {
    setTimeout(callback, delay);
  } else {
    callback();
  }
}

/**
 * Get success message for common operations
 * @param operation - Operation type
 * @param resourceName - Name of resource (optional)
 * @returns Success message
 */
export function getSuccessMessage(
  operation: 'create' | 'update' | 'delete' | 'save',
  resourceName?: string
): string {
  const resource = resourceName || 'Item';

  const messages = {
    create: `${resource} created successfully!`,
    update: `${resource} updated successfully!`,
    delete: `${resource} deleted successfully!`,
    save: `${resource} saved successfully!`,
  };

  return messages[operation];
}

/**
 * Handle CRUD operation success
 * @param operation - CRUD operation type
 * @param resourceName - Name of resource
 * @param showToast - Toast function from useToast hook
 * @param onSuccess - Optional callback after showing toast
 */
export function handleCrudSuccess(
  operation: 'create' | 'update' | 'delete' | 'save',
  resourceName: string,
  showToast?: (type: string, message: string) => void,
  onSuccess?: () => void
): void {
  const message = getSuccessMessage(operation, resourceName);

  if (showToast) {
    showToast('success', message);
  }

  if (onSuccess) {
    onSuccess();
  }
}

/**
 * Handle form submission success
 * @param message - Success message
 * @param resetForm - Function to reset form
 * @param showToast - Toast function from useToast hook
 */
export function handleFormSuccess(
  message: string,
  resetForm?: () => void,
  showToast?: (type: string, message: string) => void
): void {
  // Show success toast
  if (showToast) {
    showToast('success', message);
  }

  // Reset form if function provided
  if (resetForm) {
    resetForm();
  }
}

/**
 * Show info message with toast
 * @param message - Info message to display
 * @param showToast - Toast function from useToast hook
 */
export function showInfoMessage(
  message: string,
  showToast?: (type: string, message: string) => void
): void {
  if (showToast) {
    showToast('info', message);
  }
}

/**
 * Show warning message with toast
 * @param message - Warning message to display
 * @param showToast - Toast function from useToast hook
 */
export function showWarningMessage(
  message: string,
  showToast?: (type: string, message: string) => void
): void {
  if (showToast) {
    showToast('warning', message);
  }
}
