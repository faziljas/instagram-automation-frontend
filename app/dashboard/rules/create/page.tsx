'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { usePost } from '@/hooks/useApi';
import { useFetch } from '@/hooks/useFetch';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface InstagramAccountResponse {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string | null;
}

// Trigger and Action types (matching backend exactly)
const triggerTypes = [
  { value: 'new_message', label: 'New Message (DM)' },
  { value: 'keyword', label: 'Keyword in DM' },
  { value: 'post_comment', label: 'Comment on Post/Reel' },
  { value: 'live_comment', label: 'Comment on Live Video' },
];

const actionTypes = [
  { value: 'send_dm', label: 'Send DM' },
];

// Zod validation schema (matching backend)
const createRuleSchema = z.object({
  instagram_account_id: z.number({ required_error: 'Instagram account is required' }),
  name: z.string().min(1, 'Rule name is required'),
  trigger_type: z.enum(['new_message', 'keyword', 'post_comment', 'live_comment'], {
    required_error: 'Trigger type is required',
  }),
  action_type: z.enum(['send_dm'], {
    required_error: 'Action type is required',
  }),
  config: z.record(z.unknown()),
});

type CreateRuleFormData = z.infer<typeof createRuleSchema>;

export default function CreateRulePage() {
  const router = useRouter();
  const { execute: createRule, loading, error: apiError } = usePost();
  const { data: accounts, isLoading: accountsLoading } = useFetch<InstagramAccountResponse[]>('/users/me/accounts');

  const [formData, setFormData] = useState<CreateRuleFormData>({
    instagram_account_id: 0,
    name: '',
    trigger_type: 'new_message',
    action_type: 'send_dm',
    config: {},
  });

  // Dynamic config fields based on action type
  const [messageTemplate, setMessageTemplate] = useState('');
  const [delay, setDelay] = useState('0');
  const [triggerKeyword, setTriggerKeyword] = useState(''); // For keyword trigger type

  const [errors, setErrors] = useState<Partial<Record<keyof CreateRuleFormData, string>>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'instagram_account_id' ? parseInt(value) : value;
    
    // If trigger_type changes away from 'keyword', clear the keyword field
    if (name === 'trigger_type' && parsedValue !== 'keyword') {
      setTriggerKeyword('');
      if (configErrors.triggerKeyword) {
        setConfigErrors((prev) => ({ ...prev, triggerKeyword: '' }));
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    // Clear field error on change
    if (errors[name as keyof CreateRuleFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};

    // Keyword trigger requires a keyword
    if (formData.trigger_type === 'keyword') {
      if (!triggerKeyword.trim()) {
        errors.triggerKeyword = 'Trigger keyword is required';
      }
    }

    // All actions require a message template
    if (formData.action_type === 'send_dm') {
      if (!messageTemplate.trim()) {
        errors.messageTemplate = 'Message template is required';
      }
      if (delay && isNaN(Number(delay))) {
        errors.delay = 'Delay must be a number';
      }
    }

    setConfigErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setConfigErrors({});

    // Validate Instagram account is selected
    if (!formData.instagram_account_id || formData.instagram_account_id === 0) {
      setErrors({ instagram_account_id: 'Please select an Instagram account' });
      return;
    }

    // Build config object based on action type and trigger type
    let config: Record<string, unknown> = {};

    // Add keyword to config if trigger type is keyword
    if (formData.trigger_type === 'keyword' && triggerKeyword.trim()) {
      config.keyword = triggerKeyword.trim();
    }

    if (formData.action_type === 'send_dm') {
      config = {
        ...config, // Preserve keyword if present
        message_template: messageTemplate,
        delay_minutes: Number(delay) || 0,
      };
    }

    // Validate config
    if (!validateConfig()) {
      return;
    }

    const dataToSubmit = {
      ...formData,
      config,
    };

    // Validate form data
    const result = createRuleSchema.safeParse(dataToSubmit);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateRuleFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CreateRuleFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit rule creation
    try {
      await createRule('/automation/rules', dataToSubmit);
      router.push('/dashboard/rules');
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/rules"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Rules
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Automation Rule</h1>
        <p className="mt-2 text-gray-600">
          Set up a new automation rule for your Instagram account.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instagram Account */}
            <div>
              <label htmlFor="instagram_account_id" className="block text-sm font-medium text-gray-700">
                Instagram Account
              </label>
              <select
                id="instagram_account_id"
                name="instagram_account_id"
                value={formData.instagram_account_id}
                onChange={handleChange}
                disabled={accountsLoading || !accounts || accounts.length === 0}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.instagram_account_id ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="0">Select an Instagram account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    @{account.username} {!account.is_active && '(Inactive)'}
                  </option>
                ))}
              </select>
              {errors.instagram_account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.instagram_account_id}</p>
              )}
              {!accountsLoading && (!accounts || accounts.length === 0) && (
                <p className="mt-1 text-sm text-yellow-600">
                  No Instagram accounts connected. Please{' '}
                  <Link href="/dashboard/accounts/connect" className="text-blue-600 underline">
                    connect an account
                  </Link>{' '}
                  first.
                </p>
              )}
            </div>

            {/* Rule Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Rule Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Welcome new followers"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Trigger Type */}
            <div>
              <label htmlFor="trigger_type" className="block text-sm font-medium text-gray-700">
                Trigger Type
              </label>
              <select
                id="trigger_type"
                name="trigger_type"
                value={formData.trigger_type}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.trigger_type ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                {triggerTypes.map((trigger) => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
              {errors.trigger_type && (
                <p className="mt-1 text-sm text-red-600">{errors.trigger_type}</p>
              )}
            </div>

            {/* Action Type */}
            <div>
              <label htmlFor="action_type" className="block text-sm font-medium text-gray-700">
                Action Type
              </label>
              <select
                id="action_type"
                name="action_type"
                value={formData.action_type}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.action_type ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                {actionTypes.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
              {errors.action_type && (
                <p className="mt-1 text-sm text-red-600">{errors.action_type}</p>
              )}
            </div>

            {/* Dynamic Config Fields */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>

              {/* Trigger Keyword Field (for keyword trigger type) */}
              {formData.trigger_type === 'keyword' && (
                <div className="mb-6">
                  <label
                    htmlFor="triggerKeyword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Trigger Keyword <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="triggerKeyword"
                    name="triggerKeyword"
                    type="text"
                    required
                    value={triggerKeyword}
                    onChange={(e) => {
                      setTriggerKeyword(e.target.value);
                      if (configErrors.triggerKeyword) {
                        setConfigErrors((prev) => ({ ...prev, triggerKeyword: '' }));
                      }
                    }}
                    placeholder="e.g., price, help, support"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      configErrors.triggerKeyword ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {configErrors.triggerKeyword && (
                    <p className="mt-1 text-sm text-red-600">{configErrors.triggerKeyword}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    The message must be EXACTLY this keyword to trigger this rule (case-insensitive). The rule will only fire if the message is exactly this keyword (e.g., &quot;help&quot;, &quot;HELP&quot;, &quot;Help&quot; will all match, but &quot;Need help&quot; will not).
                  </p>
                </div>
              )}

              {/* Message Template & Delay */}
              {formData.action_type === 'send_dm' && (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="messageTemplate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Message Template
                    </label>
                    <textarea
                      id="messageTemplate"
                      name="messageTemplate"
                      rows={4}
                      value={messageTemplate}
                      onChange={(e) => {
                        setMessageTemplate(e.target.value);
                        if (configErrors.messageTemplate) {
                          setConfigErrors((prev) => ({ ...prev, messageTemplate: '' }));
                        }
                      }}
                      placeholder="Enter your message template here..."
                      className={`mt-1 block w-full px-3 py-2 border ${
                        configErrors.messageTemplate ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {configErrors.messageTemplate && (
                      <p className="mt-1 text-sm text-red-600">{configErrors.messageTemplate}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      You can use variables like {'{username}'}, {'{followers_count}'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="delay" className="block text-sm font-medium text-gray-700">
                      Delay (minutes)
                    </label>
                    <input
                      id="delay"
                      name="delay"
                      type="number"
                      min="0"
                      value={delay}
                      onChange={(e) => {
                        setDelay(e.target.value);
                        if (configErrors.delay) {
                          setConfigErrors((prev) => ({ ...prev, delay: '' }));
                        }
                      }}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        configErrors.delay ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {configErrors.delay && (
                      <p className="mt-1 text-sm text-red-600">{configErrors.delay}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Delay before sending the message (0 for immediate)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* API Error Message */}
            {apiError && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{apiError.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Link
                href="/dashboard/rules"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
