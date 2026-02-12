'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useFetch } from '@/hooks/useFetch';
import { usePut, useDelete, usePost } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { mutate } from 'swr';

// Zod validation schemas
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface SubscriptionSummary {
  plan_tier: string;
  effective_plan_tier: string;
  status: string;
  stripe_subscription_id: string | null;
  cancellation_end_date: string | null;
  usage: {
    accounts: number;
    rules: number;
    dms_sent_this_month: number;
  };
}

interface Invoice {
  id: number;
  amount: number; // minor units (e.g. cents)
  currency: string;
  status: string;
  invoice_url?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
}

interface BillingSettingsProps {
  isLoading: boolean;
  subscription: SubscriptionSummary | undefined;
  invoices: Invoice[] | undefined;
  invoicesLoading: boolean;
  invoicesError: Error | undefined;
  onUpgrade: () => void;
  onCancelPlan: () => void;
  cancelLoading: boolean;
  onOpenInvoicePortal: () => void;
  portalLoading: boolean;
  onSyncInvoices: () => void;
  syncInvoicesLoading: boolean;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({
  isLoading,
  subscription,
  invoices,
  invoicesLoading,
  invoicesError,
  onUpgrade,
  onCancelPlan,
  portalLoading,
  cancelLoading,
  onOpenInvoicePortal,
  onSyncInvoices,
  syncInvoicesLoading,
}) => {
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="text-sm text-gray-600">Loading billing details…</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-red-600">Unable to load subscription details right now.</p>
      </div>
    );
  }

  // Derived subscription state for the billing UI
  const isPro = subscription.plan_tier === 'pro' || subscription.plan_tier === 'enterprise';
  const planName = isPro ? 'Pro' : 'Free';

  // Try to use the server-provided end date for the current billing period if available
  const currentPeriodEnd = subscription.cancellation_end_date
    ? new Date(subscription.cancellation_end_date)
    : null;

  // Derived invoice helpers
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amountMinor: number, currency: string) => {
    const divisor = 100; // Dodo sends minor units
    const value = amountMinor / divisor;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const renewalText = currentPeriodEnd
    ? `Your plan renews on ${currentPeriodEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`
    : 'Your plan renews each billing period.';

  if (!isPro) {
    // Free plan layout
    return (
      <div className="space-y-8 font-inter">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upgrade to Pro to unlock higher limits and advanced automation.
          </p>
        </div>

        <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">You are on the Free Plan</h3>
            <p className="mt-1 text-sm text-gray-600">
              Enjoy core automation features with generous free limits. Upgrade anytime to get more.
            </p>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
          >
            Upgrade
          </button>
        </section>
      </div>
    );
  }

  // Treat subscription as cancelled as soon as backend marks status='cancelled'.
  // cancellation_end_date is nice to have for messaging, but should not block UI state.
  const isCancelled = subscription.status === 'cancelled';

  // Pro (or higher) layout
  return (
    <div className="space-y-8 font-inter">
      {/* Current Plan */}
      <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900">Pro Plan</h2>
        <p className="mt-1 text-sm text-gray-600">{renewalText}</p>
      </section>

      {/* Payment Method */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white px-6 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500 text-xs font-semibold text-white">
              D
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Link by Dodo Payments</p>
              <p className="text-xs text-gray-500">Your payment details are securely managed via Dodo Payments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Invoice and payment details */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Invoice and payment details</h3>
          <button
            type="button"
            onClick={onSyncInvoices}
            disabled={syncInvoicesLoading || invoicesLoading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${syncInvoicesLoading ? 'animate-spin' : ''}`} />
            {syncInvoicesLoading ? 'Syncing…' : 'Sync invoices'}
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {invoicesLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                    Loading invoices…
                  </td>
                </tr>
              )}
              {!invoicesLoading && invoicesError && (
                <tr>
                  <td colSpan={4} className="px-6 py-4">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Unable to load invoices</p>
                        <p className="mt-1 text-amber-700">{invoicesError.message}</p>
                        <p className="mt-2 text-xs">Try syncing invoices above or refresh the page.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {!invoicesLoading && !invoicesError && invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                    No invoices available yet.
                  </td>
                </tr>
              )}
              {!invoicesLoading &&
                !invoicesError &&
                invoices.length > 0 &&
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-3 text-gray-900">
                      {formatDate(inv.paid_at || inv.created_at || null)}
                    </td>
                    <td className="px-6 py-3 text-gray-900">
                      {formatAmount(inv.amount, inv.currency)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          inv.status === 'succeeded' || inv.status === 'paid'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : inv.status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {inv.status === 'succeeded' ? 'Paid' : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {inv.invoice_url ? (
                        <button
                          type="button"
                          onClick={() => window.open(inv.invoice_url as string, '_blank', 'noopener,noreferrer')}
                          className="text-sm font-medium text-gray-700 hover:text-gray-900 underline"
                        >
                          View
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenInvoicePortal}
                          disabled={portalLoading}
                          className="text-sm font-medium text-gray-700 hover:text-gray-900 underline disabled:opacity-60"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* Cancellation */}
      <section className="space-y-3 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900">Cancellation</h3>

        {!isCancelled && (
          <p className="text-sm text-gray-500">
            You can cancel your plan at any time. Your access will continue until the end of the billing period.
          </p>
        )}

        {!isCancelled && (
          <button
            type="button"
            onClick={onCancelPlan}
            disabled={cancelLoading}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {cancelLoading ? 'Canceling…' : 'Cancel Plan'}
          </button>
        )}

        {isCancelled && (
          <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Subscription Cancelled</p>
            <p>Your subscription has been successfully canceled.</p>
            <p>
              You will continue to have full access to <span className="font-semibold">Pro</span> features
              {currentPeriodEnd ? (
                <>
                  {' '}
                  until{' '}
                  <span className="font-semibold">
                    {currentPeriodEnd.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  .
                </>
              ) : (
                ' until the end of your current billing period.'
              )}
            </p>
            <p>You will not be charged again.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default function SettingsPage() {
  const router = useRouter();
  const { updateUser, logout, supabaseUser } = useAuth();
  const { data: user, isLoading } = useFetch<User>('/users/me');
  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
  } = useFetch<SubscriptionSummary>('/users/subscription');
  const {
    data: invoicesData,
    error: invoicesError,
    isLoading: isInvoicesLoading,
    mutate: mutateInvoices,
  } = useFetch<Invoice[]>('/users/invoices');
  
  // Ensure invoices is always an array - handle cases where API returns error object
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const { execute: updateProfile, loading: profileLoading, error: profileError } = usePut();
  const { execute: updatePassword, loading: passwordLoading, error: passwordError } = usePut();
  const { execute: deleteAccount, loading: deleteLoading } = useDelete();
  const { execute: createPortalSession, loading: portalLoading } = usePost();
  const { execute: cancelSubscription, loading: cancelLoading } = usePost();
  const { execute: syncInvoices, loading: syncInvoicesLoading } = usePost();

  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [localCancelled, setLocalCancelled] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'billing'>('general');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isGoogleUser = !!supabaseUser && supabaseUser.app_metadata?.provider === 'google';

  // Pre-fill profile form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
      });
    }
  }, [user]);

  // Load avatar from user profile (backend)
  useEffect(() => {
    if (user?.profilePictureUrl) {
      setAvatarPreview(user.profilePictureUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (profileErrors[name as keyof ProfileFormData]) {
      setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setProfileSuccess(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (passwordErrors[name as keyof PasswordFormData]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setPasswordSuccess(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess(false);

    // Validate form data
    const result = profileSchema.safeParse(profileData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
        }
      });
      setProfileErrors(fieldErrors);
      return;
    }

    // Submit profile update
    try {
      // Convert camelCase to snake_case for backend
      const updatePayload: any = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
      };
      
      // Include profile picture if it exists
      if (avatarPreview) {
        updatePayload.profile_picture_url = avatarPreview;
      }
      
      const response = await updateProfile('/users/me', updatePayload);
      if (response) {
        // Update auth context with new user data
        updateUser(response as User);
        // Refresh user data
        mutate('/users/me');
        setProfileSuccess(true);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(false);

    // Validate form data
    const result = passwordSchema.safeParse(passwordData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof PasswordFormData] = err.message;
        }
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    // Submit password update
    try {
      // Convert camelCase to snake_case for backend
      await updatePassword('/users/me/password', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      // Clear password fields
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('[Settings] Deleting account...');
      await deleteAccount('/users/me');
      console.log('[Settings] Account deleted successfully, logging out...');
      logout();
      alert('Your account has been deleted successfully.');
      router.push('/login');
    } catch (error) {
      console.error('[Settings] Failed to delete account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      alert(`Failed to delete account: ${errorMessage}`);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidImage =
      file.type === 'image/png' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg';

    if (!isValidImage) {
      // For now we silently ignore invalid types; can add toast later
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;
      setAvatarPreview(result);
      
      // Save to backend instead of localStorage
      if (user) {
        try {
          const response = await updateProfile('/users/me', {
            profile_picture_url: result,
          });
          if (response) {
            updateUser(response as User);
            mutate('/users/me');
          }
        } catch (error) {
          console.error('Failed to save profile picture:', error);
          // Revert preview on error
          setAvatarPreview(user.profilePictureUrl || null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = async () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Remove from backend
    if (user) {
      try {
        const response = await updateProfile('/users/me', {
          profile_picture_url: null,
        });
        if (response) {
          updateUser(response as User);
          mutate('/users/me');
        }
      } catch (error) {
        console.error('Failed to remove profile picture:', error);
        // Revert preview on error
        setAvatarPreview(user.profilePictureUrl || null);
      }
    }
  };

  const handleUpgradeClick = () => {
    router.push('/dashboard/subscription');
  };

  const handleSyncInvoices = async () => {
    try {
      await syncInvoices('/api/dodo/sync-invoices', {});
      // Refresh invoices list
      await mutateInvoices(undefined, { revalidate: true });
    } catch (error) {
      console.error('Failed to sync invoices:', error);
      alert(error instanceof Error ? error.message : 'Unable to sync invoices. Please try again.');
    }
  };

  const handleOpenStripePortal = async () => {
    try {
      const response = await createPortalSession('/api/dodo/create-portal-session', {});
      if (response?.portal_url) {
        // Open Dodo billing portal in a new tab so users can
        // simply close the tab to return to LogicDM settings.
        const portalUrl = response.portal_url as string;
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
        // Trigger revalidation so invoices refresh when user returns (SWR revalidateOnFocus also helps)
        mutateInvoices(undefined, { revalidate: true });
      } else {
        console.error('No portal_url returned from Stripe portal session API', response);
        alert('Unable to open billing portal. Please try again or manage billing from the Subscription page.');
      }
    } catch (error) {
      console.error('Failed to create Stripe billing portal session:', error);
      alert('Unable to open billing portal right now. Please try again in a moment.');
    }
  };

  const handleCancelSubscription = () => {
    // Show confirmation dialog first
    setShowCancelConfirmModal(true);
  };

  const confirmCancelSubscription = async () => {
    try {
      await cancelSubscription('/api/dodo/cancel-subscription', {});
      setShowCancelConfirmModal(false);
      setLocalCancelled(true);
      alert(
        'Your subscription has been canceled. You will retain access to Pro features until the end of your current billing period.'
      );
      // Refresh subscription and invoices so the Billing tab stays in sync
      mutate('/users/subscription');
      mutateInvoices(undefined, { revalidate: true });
    } catch (error) {
      console.error('Failed to cancel subscription from Settings:', error);
      alert('Unable to cancel your subscription right now. Please try again or contact support.');
      // Keep modal open on error so user can try again if needed
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            <span className="text-sm text-gray-600">Loading your settings…</span>
          </div>
        </div>
      </div>
    );
  }

  const renderGeneralContent = () => (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your personal information and profile details.</p>
      </div>

      <section className="space-y-8">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile avatar"
                className="h-16 w-16 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-semibold shadow-md">
                {profileData.firstName
                  ? profileData.firstName.charAt(0).toUpperCase()
                  : profileData.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">Profile picture</p>
              <p className="text-xs text-gray-500">This avatar is used across your account and automations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAvatarUploadClick}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Upload New
            </button>
            <button
              type="button"
              onClick={handleAvatarRemove}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Remove
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={profileData.firstName}
                onChange={handleProfileChange}
                className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                  profileErrors.firstName ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {profileErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={profileData.lastName}
                onChange={handleProfileChange}
                className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                  profileErrors.lastName ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {profileErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="max-w-md">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={profileData.email}
              onChange={handleProfileChange}
              className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                profileErrors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-200 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
            />
            {profileErrors.email && (
              <p className="mt-1 text-xs text-red-600">{profileErrors.email}</p>
            )}
          </div>

          {profileError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError.message}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Profile updated successfully.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );

  const renderSecurityContent = () => {
    if (isGoogleUser) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your account is managed by Google. To keep your account secure, continue using the
              {' '}
              <span className="font-semibold">Sign in with Google</span>
              {' '}
              option on the login page.
            </p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Password changes for Google sign-in accounts are managed through your Google Account.
            LogicDM does not store a password for this login, so changing it here is disabled.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          <p className="mt-1 text-sm text-gray-500">Update your password to keep your account secure.</p>
        </div>

        <section>
          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                  passwordErrors.oldPassword ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {passwordErrors.oldPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.oldPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                  passwordErrors.newPassword ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`mt-1 block w-full rounded-lg border-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ${
                  passwordErrors.confirmPassword
                    ? 'ring-red-500 focus:ring-red-500'
                    : 'ring-gray-200 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            {passwordError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError.message}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Password changed successfully.
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {passwordLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const renderNotificationsContent = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
      <p className="text-sm text-gray-500">
        Notification preferences will be configurable soon. For now, you&apos;ll receive important product and billing
        updates by email.
      </p>
    </div>
  );

  const renderBillingContent = () => {
    // Ensure subscription is a valid object (not an error response)
    // Check if subscription has required properties to determine if it's valid
    const isValidSubscription = subscription && 
                                 typeof subscription === 'object' && 
                                 'plan_tier' in subscription &&
                                 'status' in subscription;
    
    // Use valid subscription or undefined
    const validSubscription = isValidSubscription ? subscription : undefined;
    
    // Optimistic UI: if we've just successfully requested cancellation in this
    // session, treat the subscription as cancelled even if the backend still
    // reports `status: "active"` (e.g. due to eventual consistency or delayed
    // webhooks). This ensures the first successful cancel click updates the UI.
    const effectiveSubscription =
      validSubscription && (localCancelled || validSubscription.status === 'cancelled')
        ? { ...validSubscription, status: 'cancelled' as const }
        : validSubscription;

    return (
      <BillingSettings
        isLoading={isSubscriptionLoading}
        subscription={effectiveSubscription}
        invoices={invoices}
        invoicesLoading={isInvoicesLoading}
        invoicesError={invoicesError}
        onUpgrade={handleUpgradeClick}
        onCancelPlan={handleCancelSubscription}
        onOpenInvoicePortal={handleOpenStripePortal}
        portalLoading={portalLoading}
        cancelLoading={cancelLoading}
        onSyncInvoices={handleSyncInvoices}
        syncInvoicesLoading={syncInvoicesLoading}
      />
    );
  };

  const renderContent = () => {
    if (activeTab === 'general') return renderGeneralContent();
    if (activeTab === 'security') return renderSecurityContent();
    if (activeTab === 'notifications') return renderNotificationsContent();
    if (activeTab === 'billing') return renderBillingContent();
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fine-tune your profile, security, and preferences in one place.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-lg">
        <div className="flex flex-col md:flex-row">
          {/* Left navigation */}
          <aside className="w-full border-b border-gray-100 bg-gray-50/80 p-4 md:w-64 md:border-b-0 md:border-r">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === 'general'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === 'security'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Security</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === 'notifications'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>Notifications</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  SOON
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                <span>Billing</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  Manage
                </span>
              </button>
            </nav>
          </aside>

          {/* Right content */}
          <section className="flex-1 p-6 md:p-8">{renderContent()}</section>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-2 text-sm text-red-700">
          Deleting your account is permanent and will remove all of your data. This action cannot be undone.
        </p>
        <div className="mt-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative bg-white rounded-2xl px-6 pt-6 pb-6 text-center shadow-2xl sm:p-8 max-w-md border-2 border-gray-200">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4">
                <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Are you sure you want to delete your account? This action cannot be undone and
                  all your data will be permanently deleted.
                </p>
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => !cancelLoading && setShowCancelConfirmModal(false)}
            />
            <div className="relative bg-white rounded-2xl px-6 pt-6 pb-6 text-center shadow-2xl sm:p-8 max-w-md border-2 border-gray-200">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-4">
                <ExclamationTriangleIcon className="h-7 w-7 text-orange-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-bold text-gray-900">Cancel Subscription</h3>
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Are you sure you want to cancel your subscription? You will retain access to Pro features until the end of your current billing period, but your subscription will not renew.
                </p>
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setShowCancelConfirmModal(false)}
                  disabled={cancelLoading}
                  className="px-6 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, Keep Subscription
                </button>
                <button
                  onClick={confirmCancelSubscription}
                  disabled={cancelLoading}
                  className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                >
                  {cancelLoading ? 'Canceling...' : 'Yes, Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
