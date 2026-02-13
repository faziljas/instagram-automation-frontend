'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { usePost } from '@/hooks/useApi';

interface MediaItem {
  id: string;
  media_type: string;
  media_product_type?: string; // FEED, REELS, STORY, LIVE, etc.
  caption: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

interface AutomationSetupModalProps {
  accountId: number;
  accountUsername: string;
  media: MediaItem;
  onClose: () => void;
  onSuccess: () => void;
}

interface AutomationConfig {
  // Step 2: Trigger configuration
  keywords: string[]; // Keywords that trigger the automation
  autoReplyToComments: boolean; // Auto-reply to comments on the post
  commentReplies: string[]; // Multiple reply variations (random selection)
  
  // Step 3: Action configuration
  dmType: 'text' | 'text_button' | 'lead_capture'; // Type of DM
  dmMessages: string[]; // Multiple DM message variations (random selection)
  buttons: Array<{ text: string; url: string }>; // Buttons for DM (if dmType is 'text_button')
  delayMinutes: number; // Delay before sending DM
  
  // Lead Capture (new)
  isLeadCapture?: boolean;
  leadCaptureFlow?: Array<{
    step: number;
    type: 'ask' | 'wait' | 'save' | 'send';
    text?: string;
    field_type?: 'email' | 'phone' | 'text' | 'custom';
    validation?: 'email' | 'phone' | 'none';
    wait_for?: 'user_reply';
    field?: string;
    save_to?: 'lead_data';
    message?: string;
    message_variations?: string[];
  }>;
  leadCaptureSettings?: {
    save_to_database?: boolean;
    notification_email?: string | null;
    webhook_url?: string | null;
  };
}

export default function AutomationSetupModal({
  accountId,
  accountUsername,
  media,
  onClose,
  onSuccess,
}: AutomationSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(2); // Start at Step 2 (Trigger config). Step 1 (content selection) is always visible at top
  const [config, setConfig] = useState<AutomationConfig>({
    keywords: [],
    autoReplyToComments: false,
    commentReplies: ['', '', ''],
    dmType: 'text_button',
    dmMessages: [''],
    buttons: [{ text: 'Click me', url: '' }],
    delayMinutes: 0,
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  const [useKeywordTrigger, setUseKeywordTrigger] = useState(false); // Track if "With a specific keyword" is selected
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { execute: createRule, loading, error: apiError } = usePost();

  // Step 2: Trigger Configuration
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword.length >= 2 && !config.keywords.includes(keyword)) {
      setConfig((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
      setKeywordInput('');
      if (errors.keyword) {
        setErrors((prev) => ({ ...prev, keyword: '' }));
      }
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setConfig((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleUpdateCommentReply = (index: number, value: string) => {
    const newReplies = [...config.commentReplies];
    newReplies[index] = value;
    setConfig((prev) => ({
      ...prev,
      commentReplies: newReplies,
    }));
  };

  // Step 3: Action Configuration
  const handleUpdateDmMessage = (index: number, value: string) => {
    const newMessages = [...config.dmMessages];
    newMessages[index] = value;
    setConfig((prev) => ({
      ...prev,
      dmMessages: newMessages,
    }));
  };

  const handleAddDmMessage = () => {
    if (config.dmMessages.length < 10) {
      setConfig((prev) => ({
        ...prev,
        dmMessages: [...prev.dmMessages, ''],
      }));
    }
  };

  const handleRemoveDmMessage = (index: number) => {
    if (config.dmMessages.length > 1) {
      const newMessages = config.dmMessages.filter((_, i) => i !== index);
      setConfig((prev) => ({
        ...prev,
        dmMessages: newMessages,
      }));
    }
  };

  const handleUpdateButton = (index: number, field: 'text' | 'url', value: string) => {
    const newButtons = [...config.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setConfig((prev) => ({
      ...prev,
      buttons: newButtons,
    }));
  };

  const handleAddButton = () => {
    if (config.buttons.length < 3) {
      setConfig((prev) => ({
        ...prev,
        buttons: [...prev.buttons, { text: 'Click me', url: '' }],
      }));
    }
  };

  const handleRemoveButton = (index: number) => {
    if (config.buttons.length > 1) {
      setConfig((prev) => ({
        ...prev,
        buttons: prev.buttons.filter((_, i) => i !== index),
      }));
    }
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      // Require keywords if "With a specific keyword" is selected
      if (useKeywordTrigger) {
        if (config.keywords.filter((k) => k.trim().length > 0).length === 0) {
          newErrors.keywords = 'At least one trigger keyword is required';
        }
      }
      if (config.autoReplyToComments) {
        const hasReplies = config.commentReplies.some((reply) => reply.trim().length > 0);
        if (!hasReplies) {
          newErrors.commentReplies = 'At least one comment reply is required when auto-reply is enabled';
        }
      }
    }

    if (step === 3) {
      const hasValidMessages = config.dmMessages.some((msg) => msg.trim().length > 0);
      if (!hasValidMessages) {
        newErrors.dmMessages = 'At least one DM message is required';
      }
      if (config.dmType === 'text_button') {
        const hasValidButtons = config.buttons.some((btn) => {
          if (btn.text.trim().length === 0 || btn.url.trim().length === 0) {
            return false;
          }
          // Validate URL format
          try {
            const url = new URL(btn.url.trim());
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch (e) {
            return false;
          }
        });
        if (!hasValidButtons) {
          newErrors.buttons = 'At least one valid button with text and a valid URL (http:// or https://) is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 2 && validateStep(2)) {
      setCurrentStep(3); // Move to action configuration step
    } else if (currentStep === 3 && validateStep(3)) {
      setCurrentStep(4); // Move to review step
    } else if (currentStep === 4) {
      handleSubmit(); // If on review, submit on "Next"
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 2)); // Can't go back before step 2
    setErrors({});
  };

  const handleSubmit = async () => {
    // Validate both step 2 (trigger config) and step 3 (action config)
    if (!validateStep(2) || !validateStep(3)) {
      return;
    }

    try {
      // Build rule configuration
      const ruleConfig: Record<string, any> = {
        delay_minutes: config.delayMinutes,
      };
      
      // Only include media_id for posts/reels/stories (not for DM automation)
      if (media.media_product_type !== 'DM') {
        ruleConfig.media_id = media.id;
      }

      // Add keywords if "With a specific keyword" is selected
      if (useKeywordTrigger && config.keywords.filter((k) => k.trim().length > 0).length > 0) {
        const validKeywords = config.keywords.filter((k) => k.trim().length > 0);
        ruleConfig.keyword = validKeywords[0]; // Backend supports single keyword for now
        // Store all keywords in config for future multi-keyword support
        ruleConfig.keywords = validKeywords;
      }

      // Add comment replies if auto-reply is enabled
      if (config.autoReplyToComments) {
        ruleConfig.auto_reply_to_comments = true;
        ruleConfig.comment_replies = config.commentReplies.filter((r) => r.trim().length > 0);
      }

      // Add DM messages (random selection)
      ruleConfig.message_template = config.dmMessages[0]; // Primary message
      ruleConfig.message_variations = config.dmMessages.filter((m) => m.trim().length > 0);

      // Add buttons if DM type is text_button
      if (config.dmType === 'text_button') {
        // Filter buttons and validate URLs
        ruleConfig.buttons = config.buttons.filter((b) => {
          if (b.text.trim().length === 0 || b.url.trim().length === 0) {
            return false;
          }
          // Validate URL format
          try {
            const url = new URL(b.url.trim());
            // Only allow http and https protocols
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              return false;
            }
            return true;
          } catch (e) {
            // Invalid URL format
            return false;
          }
        });
      }

      // Determine trigger type based on media type and keywords
      let triggerType = 'post_comment';
      if (media.media_product_type === 'DM') {
        // For DM automation, use 'new_message' or 'keyword' trigger
        triggerType = useKeywordTrigger && config.keywords.filter((k) => k.trim().length > 0).length > 0 ? 'keyword' : 'new_message';
      } else {
        // For posts/reels/stories, use 'post_comment' or 'keyword' trigger
        triggerType = useKeywordTrigger && config.keywords.filter((k) => k.trim().length > 0).length > 0 ? 'keyword' : 'post_comment';
      }

      // Determine media type label for rule name
      const getMediaTypeLabel = () => {
        if (media.media_product_type === 'STORY') return 'Story';
        if (media.media_product_type === 'REELS' || media.media_type === 'VIDEO') return 'Reel';
        return 'Post';
      };

      // Create rule
      const ruleData = {
        instagram_account_id: accountId,
        name: media.media_product_type === 'DM' 
          ? (useKeywordTrigger && config.keywords.filter((k) => k.trim().length > 0).length > 0 
              ? 'DM Automation (Keyword)' 
              : 'DM Automation (All Messages)')
          : `Automation for ${getMediaTypeLabel()}`,
        trigger_type: triggerType,
        action_type: 'send_dm',
        config: ruleConfig,
        media_id: media.media_product_type === 'DM' ? null : media.id, // DMs don't have media_id
      };

      await createRule('/automation/rules', ruleData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create automation:', error);
      // Error is handled by usePost hook
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-3"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">
                {media.media_product_type === 'DM'
                  ? 'When someone sends you a DM'
                  : media.media_product_type === 'STORY' 
                    ? 'When someone send message on your Story'
                    : `When someone comments on your ${media.media_type === 'VIDEO' ? 'Reel' : 'Post'}`
                }
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
            {/* Instagram Account Info */}
            <div className="mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">IG</span>
              </div>
              <p className="text-sm font-medium text-gray-900">@{accountUsername}</p>
            </div>

            {/* Step 1: Selected Content (always visible) - Hide for DM automation */}
            {media.media_product_type !== 'DM' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 mr-4 flex-shrink-0">
                    <img
                      src={media.thumbnail_url || media.media_url}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {media.media_product_type === 'STORY' ? 'Story' :
                       media.media_type === 'VIDEO' ? 'Reel' : 'Post'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Posted on: {formatDate(media.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Trigger Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {media.media_product_type === 'DM'
                        ? 'What kind of message should trigger this automation?'
                        : media.media_product_type === 'STORY' 
                          ? 'What kind of send message should trigger this automation?'
                          : 'What kind of comment should trigger this automation?'
                      }
                    </label>
                  <div className="flex space-x-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUseKeywordTrigger(true);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        useKeywordTrigger
                          ? 'border-[#3B82F6] bg-[#E5F0FF] text-[#3B82F6]'
                          : 'border-[#E5E7EB] bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      With a specific keyword
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseKeywordTrigger(false);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        !useKeywordTrigger
                          ? 'border-[#3B82F6] bg-[#E5F0FF] text-[#3B82F6]'
                          : 'border-[#E5E7EB] bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {media.media_product_type === 'DM' ? 'Any message' : 'Any comment'}
                    </button>
                  </div>

                  {useKeywordTrigger && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trigger Keywords <span className="text-red-500">(required)</span>
                      </label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => {
                            setKeywordInput(e.target.value);
                            if (errors.keywords) {
                              setErrors((prev) => ({ ...prev, keywords: '' }));
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="Type keyword and press Enter to add"
                          className={`flex-1 px-4 py-3 border rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors ${
                            errors.keywords ? 'border-red-500' : 'border-[#E5E7EB]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddKeyword}
                          className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Keywords are not case-sensitive, e.g. &quot;Hello&quot; and &quot;hello&quot; are
                        recognized as the same.
                      </p>
                      {config.keywords.filter((k) => k.trim().length > 0).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {config.keywords
                            .filter((k) => k.trim().length > 0)
                            .map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKeyword(keyword)}
                                  className="ml-2 text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                      {errors.keywords && (
                        <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
                      )}
                    </div>
                  )}

                  {/* Hide comment reply section for Stories and DMs - Instagram API doesn't support public story comments, and DMs don't have comments */}
                  {media.media_product_type !== 'STORY' && media.media_product_type !== 'DM' && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Auto-Reply to comments on the {
                            media.media_product_type === 'REELS' || media.media_type === 'VIDEO' 
                              ? 'Reel' 
                              : 'post'
                          }
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              autoReplyToComments: !prev.autoReplyToComments,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                            config.autoReplyToComments ? 'bg-[#3B82F6]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              config.autoReplyToComments ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {config.autoReplyToComments && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-gray-600">
                            Write 3 replies which will be sent in a random order so that your replies
                            don&apos;t look like a bot. Automating comment replies comes with risk - Stay
                            informed.
                          </p>
                          {config.commentReplies.map((reply, index) => (
                            <div key={index}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Comment response {index + 1}*
                              </label>
                              <div className="flex items-center space-x-2">
                                <textarea
                                  value={reply}
                                  onChange={(e) => handleUpdateCommentReply(index, e.target.value)}
                                  rows={2}
                                  maxLength={140}
                                  className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] resize-y transition-colors"
                                  placeholder="Enter reply text..."
                                />
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {reply.length}/140
                                </span>
                              </div>
                            </div>
                          ))}
                          {errors.commentReplies && (
                            <p className="text-sm text-red-600">{errors.commentReplies}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Action Configuration (when currentStep is 3) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Then send the primary DM...
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Write the message you want to auto-send with a button that takes them to your
                    link or product.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">DM type</label>
                    <select
                      value={config.dmType}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          dmType: e.target.value as 'text' | 'text_button',
                        }))
                      }
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
                    {config.dmMessages.map((message, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={message}
                            onChange={(e) => handleUpdateDmMessage(index, e.target.value)}
                            rows={3}
                            maxLength={900}
                            className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] resize-y transition-colors"
                            placeholder="Enter DM message..."
                          />
                          <span className="text-xs text-gray-500 whitespace-nowrap pt-2">
                            {message.length}/900
                          </span>
                          {config.dmMessages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDmMessage(index)}
                              className="text-red-600 hover:text-red-800 pt-2"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {config.dmMessages.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddDmMessage}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add another message variation
                      </button>
                    )}
                    {errors.dmMessages && (
                      <p className="mt-1 text-sm text-red-600">{errors.dmMessages}</p>
                    )}
                  </div>

                  {config.dmType === 'text_button' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
                      {config.buttons.map((button, index) => (
                        <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-700">Button #{index + 1}</label>
                            {config.buttons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                            placeholder="Button text (max 60 chars)"
                            maxLength={60}
                            className="w-full mb-2 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                          />
                          <input
                            type="url"
                            value={button.url}
                            onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                            placeholder="Add link here"
                            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                          />
                        </div>
                      ))}
                      {config.buttons.length < 3 && (
                        <button
                          type="button"
                          onClick={handleAddButton}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add another button
                        </button>
                      )}
                      {errors.buttons && (
                        <p className="mt-1 text-sm text-red-600">{errors.buttons}</p>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay before sending DM (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.delayMinutes}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setConfig((prev) => ({ ...prev, delayMinutes: 0 }));
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setConfig((prev) => ({ ...prev, delayMinutes: numValue }));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                          setConfig((prev) => ({ ...prev, delayMinutes: 0 }));
                        }
                      }}
                      min="0"
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Wait this many minutes before sending the DM (0 for immediate)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Awesome! Let&apos;s review once before we launch!
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {media.media_product_type === 'STORY' 
                        ? 'When someone send message on this specific story'
                        : `When someone comments on this specific ${media.media_type === 'VIDEO' ? 'reel' : 'post'}`
                      }
                    </p>
                    <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={media.thumbnail_url || media.media_url}
                        alt="Post preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {useKeywordTrigger && config.keywords.filter((k) => k.trim().length > 0).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {media.media_product_type === 'STORY' 
                          ? 'with the following keywords in their Send message'
                          : 'with the following keywords in their comment'
                        }
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {config.keywords
                          .filter((k) => k.trim().length > 0)
                          .map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                            >
                              {keyword}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {config.autoReplyToComments && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        leave a reply to their comment on the {
                          media.media_product_type === 'REELS' || media.media_type === 'VIDEO' 
                            ? 'reel' 
                            : 'post'
                        }
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                        {config.commentReplies
                          .filter((r) => r.trim().length > 0)
                          .map((reply, index) => (
                            <div key={index} className="text-sm text-gray-900 bg-gray-100 rounded p-2">
                              {reply}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      send the primary DM
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-gray-900">
                          {config.dmMessages[0] || '(No message set)'}
                        </p>
                      </div>
                      {config.dmType === 'text_button' &&
                        config.buttons.filter((b) => b.text.trim().length > 0).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {config.buttons
                              .filter((b) => b.text.trim().length > 0)
                              .map((button, index) => (
                                <button
                                  key={index}
                                  disabled
                                  className="block w-full px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium cursor-default"
                                >
                                  {button.text}
                                </button>
                              ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {apiError && (
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-800">{apiError.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              Step {currentStep - 1} of 3
            </div>
            <div className="flex space-x-3">
              {currentStep > 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Launching...' : 'Confirm & launch'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
