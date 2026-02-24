'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useFetch } from '@/hooks/useFetch';
import { usePut, useDelete } from '@/hooks/useApi';
import { AutomationRule } from '@/types';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

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
const editRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  trigger_type: z.enum(['new_message', 'keyword', 'post_comment', 'live_comment'], {
    required_error: 'Trigger type is required',
  }),
  action_type: z.enum(['send_dm'], {
    required_error: 'Action type is required',
  }),
  config: z.record(z.unknown()),
  is_active: z.boolean().optional(),
});

type EditRuleFormData = z.infer<typeof editRuleSchema>;

interface RuleResponse {
  id: number;
  instagram_account_id: number;
  name: string | null;
  trigger_type: string;
  action_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  media_id?: string | null;
}

export default function EditRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const { data: rule, isLoading } = useFetch<RuleResponse>(`/automation/rules/${ruleId}`);
  const { execute: updateRule, loading: updateLoading, error: updateError } = usePut();
  const { execute: deleteRule, loading: deleteLoading } = useDelete();

  const [formData, setFormData] = useState<EditRuleFormData>({
    name: '',
    trigger_type: 'new_message',
    action_type: 'send_dm',
    config: {},
  });

  // Dynamic config fields based on action type
  const [messageTemplate, setMessageTemplate] = useState('');
  const [delay, setDelay] = useState('');
  const [listName, setListName] = useState('');
  const [triggerKeyword, setTriggerKeyword] = useState(''); // For keyword trigger type
  const [keywords, setKeywords] = useState<string[]>([]); // Multiple keywords
  const [keywordInput, setKeywordInput] = useState(''); // Input for adding keywords
  const [autoReplyToComments, setAutoReplyToComments] = useState(false);
  const [commentReplies, setCommentReplies] = useState<string[]>(['', '', '']);
  const [dmMessages, setDmMessages] = useState<string[]>(['']);
  const [dmType, setDmType] = useState<'text' | 'text_button'>('text_button');
  const [buttons, setButtons] = useState<Array<{ text: string; url: string }>>([{ text: 'Click me', url: '' }]);
  const [askToFollow, setAskToFollow] = useState<boolean>(false);
  const [askToFollowMessage, setAskToFollowMessage] = useState<string>('Hey! Would you mind following me? I share great content! 🙌');
  const [askForEmail, setAskForEmail] = useState<boolean>(false);
  const [askForEmailMessage, setAskForEmailMessage] = useState<string>('Quick question - what\'s your email? I\'d love to send you something special! 📧');
  const [mediaId, setMediaId] = useState<string>('');
  const [mediaItem, setMediaItem] = useState<{
    id: string;
    media_type: string;
    media_product_type?: string; // FEED, REELS, STORY, LIVE, etc.
    media_url?: string;
    thumbnail_url?: string;
    timestamp?: string;
  } | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof EditRuleFormData, string>>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch media item when mediaId is available
  useEffect(() => {
    const fetchMediaItem = async () => {
      if (!mediaId || !rule) return;

      setIsLoadingMedia(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('accessToken');
        const accountId = rule.instagram_account_id;

        // Try fetching from different media types to find the media item
        const mediaTypes = ['posts', 'stories', 'live'];
        
        for (const mediaType of mediaTypes) {
          try {
            const response = await fetch(
              `${apiUrl}/api/instagram/media?account_id=${accountId}&media_type=${mediaType}&limit=100`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const foundMedia = data.media?.find((item: any) => item.id === mediaId);
              if (foundMedia) {
                setMediaItem(foundMedia);
                setIsLoadingMedia(false);
                return; // Found it, stop searching
              }
            }
          } catch (error) {
            // Continue to next media type if this one fails
            console.log(`Could not fetch ${mediaType} media:`, error);
          }
        }
        
        // If we get here, media wasn't found in any type
        console.log(`Media with ID ${mediaId} not found in any media type`);
      } catch (error) {
        console.error('Error fetching media item:', error);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    fetchMediaItem();
  }, [mediaId, rule]);

  // Pre-fill form with existing rule data
  useEffect(() => {
    if (rule) {
      // Generate default name if rule doesn't have one
      const defaultName = rule.name || 
        `${getTypeLabel(rule.trigger_type)} → ${getTypeLabel(rule.action_type)}`;
      
      setFormData({
        name: defaultName,
        trigger_type: rule.trigger_type as 'new_message' | 'keyword' | 'post_comment' | 'live_comment',
        action_type: rule.action_type as 'send_dm',
        config: rule.config,
        is_active: rule.is_active,
      });

      // Pre-fill config fields
      // Handle keywords: check both keyword (single) and keywords (array)
      if (rule.config.keywords && Array.isArray(rule.config.keywords) && rule.config.keywords.length > 0) {
        // Filter out empty strings from keywords array
        const validKeywords = rule.config.keywords.filter((k) => k && typeof k === 'string' && k.trim().length > 0);
        if (validKeywords.length > 0) {
          setKeywords(validKeywords);
          // For 'keyword' trigger type, also set triggerKeyword from first keyword
          if (rule.trigger_type === 'keyword') {
            setTriggerKeyword(validKeywords[0]);
          }
        }
      } else if (rule.config.keyword && typeof rule.config.keyword === 'string' && rule.config.keyword.trim().length > 0) {
        // Fallback to single keyword field
        setTriggerKeyword(rule.config.keyword);
        setKeywords([rule.config.keyword]);
      }
      if (rule.config.message_template && typeof rule.config.message_template === 'string') {
        setMessageTemplate(rule.config.message_template);
      }
      if (rule.config.message_variations && Array.isArray(rule.config.message_variations)) {
        setDmMessages(rule.config.message_variations.length > 0 ? rule.config.message_variations : ['']);
      } else if (rule.config.message_template && typeof rule.config.message_template === 'string') {
        setDmMessages([rule.config.message_template]);
      }
      if (rule.config.delay_minutes !== undefined) {
        setDelay(String(rule.config.delay_minutes));
      } else {
        setDelay('');
      }
      if (rule.config.list_name && typeof rule.config.list_name === 'string') {
        setListName(rule.config.list_name);
      }
      if (rule.config.auto_reply_to_comments === true) {
        setAutoReplyToComments(true);
        // Always ensure we have 3 comment reply fields when auto-reply is enabled
        if (rule.config.comment_replies && Array.isArray(rule.config.comment_replies)) {
          const replies = [...rule.config.comment_replies];
          // Pad to 3 items if needed
          while (replies.length < 3) {
            replies.push('');
          }
          setCommentReplies(replies.slice(0, 3));
        } else {
          // If no comment_replies in config but auto-reply is enabled, initialize with 3 empty fields
          setCommentReplies(['', '', '']);
        }
      } else {
        // If auto-reply is not enabled, still check if comment_replies exist (for backward compatibility)
        if (rule.config.comment_replies && Array.isArray(rule.config.comment_replies)) {
          const replies = [...rule.config.comment_replies];
          while (replies.length < 3) replies.push('');
          setCommentReplies(replies.slice(0, 3));
        }
      }
      if (rule.config.buttons && Array.isArray(rule.config.buttons) && rule.config.buttons.length > 0) {
        setDmType('text_button');
        setButtons(rule.config.buttons);
      } else {
        setDmType('text');
        setButtons([{ text: 'Click me', url: '' }]);
      }
      if (rule.media_id && typeof rule.media_id === 'string') {
        setMediaId(rule.media_id);
      } else if (rule.config.media_id && typeof rule.config.media_id === 'string') {
        setMediaId(rule.config.media_id);
      }

      // Load pre-DM action settings (only if this rule was created with lead-capture)
      const hasPreDm =
        rule.config.is_lead_capture === true ||
        rule.config.ask_to_follow === true ||
        rule.config.ask_for_email === true;

      if (hasPreDm) {
        if (rule.config.ask_to_follow === true) {
          setAskToFollow(true);
          if (
            rule.config.ask_to_follow_message &&
            typeof rule.config.ask_to_follow_message === 'string'
          ) {
            setAskToFollowMessage(rule.config.ask_to_follow_message);
          }
        } else {
          setAskToFollow(false);
        }

        if (rule.config.ask_for_email === true) {
          setAskForEmail(true);
          if (
            rule.config.ask_for_email_message &&
            typeof rule.config.ask_for_email_message === 'string'
          ) {
            setAskForEmailMessage(rule.config.ask_for_email_message);
          }
        } else {
          setAskForEmail(false);
        }
      } else {
        // For simple flows created without lead capture, hide pre-DM fields entirely
        setAskToFollow(false);
        setAskForEmail(false);
      }
    }
  }, [rule]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // If trigger_type changes, clear relevant fields
    if (name === 'trigger_type') {
      if (value !== 'keyword' && value !== 'post_comment' && value !== 'live_comment') {
        setTriggerKeyword('');
        setKeywords([]);
        setAutoReplyToComments(false);
        if (configErrors.triggerKeyword) {
          setConfigErrors((prev) => ({ ...prev, triggerKeyword: '' }));
        }
      }
      if (value !== 'post_comment' && value !== 'live_comment') {
        setAutoReplyToComments(false);
        setCommentReplies(['', '', '']);
      }
      // Keep keywords array for keyword trigger type, but clear it for other types
      if (value !== 'keyword' && value !== 'post_comment' && value !== 'live_comment') {
        setKeywords([]);
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof EditRuleFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};

    // Keyword trigger requires at least one keyword
    if (formData.trigger_type === 'keyword') {
      if (keywords.filter((k) => k.trim().length > 0).length === 0) {
        errors.triggerKeyword = 'At least one keyword is required';
      }
    }

    // Post/live comment with auto-reply requires comment replies
    // Also check if auto-reply is enabled regardless of trigger type (for backward compatibility)
    if (autoReplyToComments) {
      const hasReplies = commentReplies.some((reply) => reply.trim().length > 0);
      if (!hasReplies) {
        errors.commentReplies = 'At least one comment reply is required when auto-reply is enabled';
      }
    }

    if (formData.action_type === 'send_dm') {
      const hasValidMessages = dmMessages.some((msg) => msg.trim().length > 0);
      if (!hasValidMessages && !messageTemplate.trim()) {
        errors.messageTemplate = 'At least one DM message is required';
      }
      if (delay !== '' && isNaN(Number(delay))) {
        errors.delay = 'Delay must be a number';
      }
      if (dmType === 'text_button') {
        const hasValidButtons = buttons.some(
          (btn) => btn.text.trim().length > 0 && btn.url.trim().length > 0
        );
        if (!hasValidButtons) {
          errors.buttons = 'At least one valid button (text and URL) is required';
        }
      }
    }

    setConfigErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setConfigErrors({});

    // Build config object based on action type and trigger type
    let config: Record<string, unknown> = {};

    // Add media_id if present
    if (mediaId.trim()) {
      config.media_id = mediaId.trim();
    }

    // Add keywords to config if trigger type is keyword, post_comment, or live_comment with keywords
    if ((formData.trigger_type === 'keyword' || formData.trigger_type === 'post_comment' || formData.trigger_type === 'live_comment') && keywords.filter((k) => k.trim().length > 0).length > 0) {
      const validKeywords = keywords.filter((k) => k.trim().length > 0);
      config.keyword = validKeywords[0]; // Single keyword for backward compatibility
      config.keywords = validKeywords; // Array of keywords
    }

    // Add comment reply settings if auto-reply is enabled (regardless of trigger type for backward compatibility)
    if (autoReplyToComments) {
      config.auto_reply_to_comments = true;
      config.comment_replies = commentReplies.filter((r) => r.trim().length > 0);
    }

    if (formData.action_type === 'send_dm') {
      const delayValue = delay === '' ? 0 : (Number(delay) || 0);
      config = {
        ...config,
        message_template: dmMessages[0] || messageTemplate, // Primary message
        message_variations: dmMessages.filter((m) => m.trim().length > 0), // All variations
        delay_minutes: delayValue,
      };

      // Add buttons if DM type is text_button
      if (dmType === 'text_button' && buttons.length > 0) {
        config.buttons = buttons.filter((b) => b.text.trim().length > 0 && b.url.trim().length > 0);
      }
      
      // Add pre-DM action settings
      if (askToFollow) {
        config.ask_to_follow = true;
        config.ask_to_follow_message =
          askToFollowMessage.trim() ||
          'Hey! Would you mind following me? I share great content! 🙌';
      }

      if (askForEmail) {
        config.ask_for_email = true;
        config.ask_for_email_message =
          askForEmailMessage.trim() ||
          "Quick question - what's your email? I'd love to send you something special! 📧";
      }

      if (askToFollow || askForEmail) {
        config.is_lead_capture = true;
      }
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
    const result = editRuleSchema.safeParse(dataToSubmit);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EditRuleFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof EditRuleFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit rule update
    try {
      await updateRule(`/automation/rules/${ruleId}`, dataToSubmit);
      router.push('/dashboard/rules');
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRule(`/automation/rules/${ruleId}`);
      router.push('/dashboard/rules');
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading rule...</p>
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-600">Rule not found</p>
          <Link href="/dashboard/rules" className="mt-4 text-blue-600 hover:text-blue-700">
            Back to Rules
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Automation Rule</h1>
          <p className="mt-1 text-sm text-gray-600">Update your automation rule settings.</p>
        </div>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Delete Rule
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-lg px-4 pt-4 pb-4 text-center shadow sm:p-5">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Rule</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this rule? This action cannot be undone.
                </p>
              </div>
              <div className="mt-5 flex justify-center space-x-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Keywords for keyword, post_comment, and live_comment triggers */}
              {(formData.trigger_type === 'keyword' || formData.trigger_type === 'post_comment' || formData.trigger_type === 'live_comment') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.trigger_type === 'keyword' ? (
                      <>Keywords <span className="text-red-500">*</span></>
                    ) : (
                      <>Keywords (optional - leave empty for any comment)</>
                    )}
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const keyword = keywordInput.trim().toLowerCase();
                          if (keyword.length >= 2 && !keywords.includes(keyword)) {
                            setKeywords([...keywords, keyword]);
                            setKeywordInput('');
                          }
                        }
                      }}
                      placeholder="Type a keyword (min. 2 characters)"
                      className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const keyword = keywordInput.trim().toLowerCase();
                        if (keyword.length >= 2 && !keywords.includes(keyword)) {
                          setKeywords([...keywords, keyword]);
                          setKeywordInput('');
                        }
                      }}
                      className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  {keywords.filter((k) => k.trim().length > 0).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {keywords
                        .filter((k) => k.trim().length > 0)
                        .map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => setKeywords(keywords.filter((k) => k !== keyword))}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                  {formData.trigger_type === 'keyword' && (
                    <p className="mt-2 text-xs text-gray-500">
                      The message must be EXACTLY one of these keywords to trigger this rule (case-insensitive). The rule will only fire if the message is exactly one of these keywords (e.g., "help", "HELP", "Help" will all match, but "Need help" will not).
                    </p>
                  )}
                  {configErrors.triggerKeyword && (
                    <p className="mt-1 text-sm text-red-600">{configErrors.triggerKeyword}</p>
                  )}
                </div>
              )}

              {/* Auto-reply to comments (for post_comment/live_comment, or if auto_reply_to_comments is already enabled) */}
              {(formData.trigger_type === 'post_comment' || formData.trigger_type === 'live_comment' || autoReplyToComments) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Auto-Reply to comments on the post
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoReplyToComments(!autoReplyToComments);
                        // If disabling and trigger is not post_comment/live_comment, clear comment replies
                        if (autoReplyToComments && formData.trigger_type !== 'post_comment' && formData.trigger_type !== 'live_comment') {
                          setCommentReplies(['', '', '']);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                        autoReplyToComments ? 'bg-[#3B82F6]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoReplyToComments ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {autoReplyToComments && (
                    <div className="mt-4 space-y-3">
                      {commentReplies.map((reply, index) => (
                        <div key={index}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Comment response {index + 1}*
                          </label>
                          <textarea
                            value={reply}
                            onChange={(e) => {
                              const newReplies = [...commentReplies];
                              newReplies[index] = e.target.value;
                              setCommentReplies(newReplies);
                            }}
                            rows={2}
                            maxLength={140}
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                            placeholder="Enter reply text..."
                          />
                          <span className="text-xs text-gray-500">{reply.length}/140</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Media Preview (read-only display) */}
              {mediaId && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Attached Media</label>
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : mediaItem ? (
                    <div className="flex items-center">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 mr-4 flex-shrink-0">
                        <img
                          src={mediaItem.thumbnail_url || mediaItem.media_url || ''}
                          alt="Post preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {mediaItem.media_product_type === 'STORY' ? 'Story' :
                           mediaItem.media_product_type === 'REELS' ? 'Reel' :
                           mediaItem.media_type === 'VIDEO' ? 'Reel' : 'Post'}
                        </p>
                        {mediaItem.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            Posted on: {new Date(mediaItem.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">ID: {mediaId}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-md">
                      <p className="text-sm text-gray-600">Media ID: {mediaId}</p>
                      <p className="text-xs text-gray-500 mt-1">Unable to load media preview</p>
                    </div>
                  )}
                </div>
              )}

              {/* For send_dm */}
              {formData.action_type === 'send_dm' && (
                <>
                  {/* Pre-DM Actions Section (only if rule was created with lead capture) */}
                  {(askToFollow || askForEmail) && (
                    <div className="mb-6 border-t border-gray-200 pt-6">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                          Before you send your primary DM, send them...
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Engage users with Email/Phone/Follow request collection before your main message.
                        </p>
                      </div>

                      {/* Ask to Follow Toggle */}
                      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              A DM asking to follow you
                            </label>
                            <p className="text-xs text-gray-500">
                              Send a friendly request to follow your account
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAskToFollow(!askToFollow)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                              askToFollow ? 'bg-[#3B82F6]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                askToFollow ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        {askToFollow && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Follow Request Message
                            </label>
                            <textarea
                              value={askToFollowMessage}
                              onChange={(e) => setAskToFollowMessage(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 text-base rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:outline-none resize-y transition-colors"
                              placeholder="Hey! Would you mind following me? I share great content! 🙌"
                            />
                          </div>
                        )}
                      </div>

                      {/* Ask for Email Toggle */}
                      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              A DM asking to share their email
                            </label>
                            <p className="text-xs text-gray-500">
                              Collect email addresses before sending the main DM
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAskForEmail(!askForEmail)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                              askForEmail ? 'bg-[#3B82F6]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                askForEmail ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        {askForEmail && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Email Request Message
                            </label>
                            <textarea
                              value={askForEmailMessage}
                              onChange={(e) => setAskForEmailMessage(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 text-base rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6] focus:outline-none resize-y transition-colors"
                              placeholder="Quick question - what's your email? I'd love to send you something special! 📧"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              💡 Tip: Emails will be automatically validated and saved to your leads database.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-4 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">DM type</label>
                    <select
                      value={dmType}
                      onChange={(e) => setDmType(e.target.value as 'text' | 'text_button')}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                    >
                      <option value="text_button">Text + Button</option>
                      <option value="text">Text only</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DM content (write multiple variations for randomization)
                    </label>
                    {dmMessages.map((message, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={message}
                            onChange={(e) => {
                              const newMessages = [...dmMessages];
                              newMessages[index] = e.target.value;
                              setDmMessages(newMessages);
                            }}
                            rows={3}
                            maxLength={900}
                            className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                            placeholder="Enter DM message..."
                          />
                          <span className="text-xs text-gray-500 whitespace-nowrap pt-2">
                            {message.length}/900
                          </span>
                          {dmMessages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDmMessages(dmMessages.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800 pt-2"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {dmMessages.length < 10 && (
                      <button
                        type="button"
                        onClick={() => setDmMessages([...dmMessages, ''])}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add another message variation
                      </button>
                    )}
                    {configErrors.messageTemplate && (
                      <p className="mt-1 text-sm text-red-600">{configErrors.messageTemplate}</p>
                    )}
                  </div>

                  {dmType === 'text_button' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
                      {buttons.map((button, index) => (
                        <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-700">Button #{index + 1}</label>
                            {buttons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setButtons(buttons.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index] = { ...newButtons[index], text: e.target.value };
                              setButtons(newButtons);
                            }}
                            placeholder="Button text (max 60 chars)"
                            maxLength={60}
                            className="w-full mb-2 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                          />
                          <input
                            type="url"
                            value={button.url}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index] = { ...newButtons[index], url: e.target.value };
                              setButtons(newButtons);
                            }}
                            placeholder="Add link here"
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                          />
                        </div>
                      ))}
                      {buttons.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setButtons([...buttons, { text: 'Click me', url: '' }])}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add another button
                        </button>
                      )}
                      {configErrors.buttons && (
                        <p className="mt-1 text-sm text-red-600">{configErrors.buttons}</p>
                      )}
                    </div>
                  )}

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
                        const value = e.target.value;
                        if (value === '') {
                          setDelay('');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setDelay(value);
                          }
                        }
                        if (configErrors.delay) {
                          setConfigErrors((prev) => ({ ...prev, delay: '' }));
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                          setDelay('0');
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
            {updateError && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">{updateError.message}</p>
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
                disabled={updateLoading}
                className="inline-flex justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
