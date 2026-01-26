'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useFetch } from '@/hooks/useFetch';
import { usePut, useDelete } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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

export default function SettingsPage() {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const { data: user, isLoading } = useFetch<User>('/users/me');
  const { execute: updateProfile, loading: profileLoading, error: profileError } = usePut();
  const { execute: updatePassword, loading: passwordLoading, error: passwordError } = usePut();
  const { execute: deleteAccount, loading: deleteLoading } = useDelete();

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
      const response = await updateProfile('/users/me', {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
      });
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

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-2xl mb-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-10 px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-lg text-white/90">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* First Name */}
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                profileErrors.firstName ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {profileErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                profileErrors.lastName ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {profileErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                profileErrors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {profileErrors.email && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.email}</p>
            )}
          </div>

          {/* Error Message */}
          {profileError && (
            <div className="rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 p-5 shadow-md">
              <p className="text-sm font-bold text-red-800">{profileError.message}</p>
            </div>
          )}

          {/* Success Message */}
          {profileSuccess && (
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
              <p className="text-sm font-bold text-green-800">Profile updated successfully!</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Old Password */}
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {passwordErrors.oldPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.oldPassword}</p>
            )}
          </div>

          {/* New Password */}
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
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
              className={`mt-1 block w-full px-4 py-3 border-2 ${
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all duration-200`}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Error Message */}
          {passwordError && (
            <div className="rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 p-5 shadow-md">
              <p className="text-sm font-bold text-red-800">{passwordError.message}</p>
            </div>
          )}

          {/* Success Message */}
          {passwordSuccess && (
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-5 shadow-md">
              <p className="text-sm font-bold text-green-800">Password changed successfully!</p>
            </div>
          )}

          {/* Change Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border-2 border-red-300 shadow-xl p-8">
        <h2 className="text-xl font-bold text-red-900 mb-3">Danger Zone</h2>
        <p className="text-sm font-medium text-gray-700 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-3 border-2 border-red-300 rounded-xl shadow-md text-sm font-bold text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105"
        >
          Delete Account
        </button>
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
    </div>
  );
}
