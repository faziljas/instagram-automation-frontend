import React, { useEffect, useState } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import MobilePreview from './MobilePreview';

interface MediaItem {
  id: string;
  media_type: string;
  media_product_type?: string;
  caption: string;
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
}

interface AutomationConfig {
  // Triggers
  keywords: string[]; // currently-active keywords sent to backend
  simpleKeywords: string[];
  leadKeywords: string[];
  autoReplyToComments: boolean; // legacy - kept for backward compatibility
  simpleAutoReplyToComments?: boolean;
  leadAutoReplyToComments?: boolean;
  commentReplies: string[]; // currently-active replies sent to backend
  simpleCommentReplies: string[];
  leadCommentReplies: string[];

  // Pre‑DM (Simplified MVP: Single toggle controls both)
  enablePreDmEngagement?: boolean; // NEW: Single toggle for MVP simplification
  askToFollow?: boolean; // Backward compatibility
  askToFollowMessage?: string;
  askForEmail?: boolean; // Backward compatibility
  askForEmailMessage?: string;
  emailSuccessMessage?: string;
  leadMagnetLink?: string;
  emailRetryMessage?: string;
  // Simple flow: one message (follow + email ask), then re-ask same email question until valid
  simpleDmFlow?: boolean;
  simpleFlowMessage?: string;
  simpleFlowEmailQuestion?: string;

  // Primary DM
  dmType: 'text' | 'text_button';
  dmMessages: string[]; // currently-active DM messages sent to backend
  simpleDmMessages: string[];
  leadDmMessages: string[];
  buttons: { text: string; url: string }[];
  delayMinutes: number;

  // Legacy lead‑capture fields (kept optional so old data still loads)
  isLeadCapture?: boolean;
  // Use loose typing but avoid explicit `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leadCaptureFlow?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leadCaptureSettings?: any;
}

type AutomationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AutomationConfig) => Promise<void>;
  media: MediaItem;
  initialConfig?: AutomationConfig;
  accountUsername: string;
};

const AutomationDrawer: React.FC<AutomationDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  media,
  initialConfig,
  accountUsername,
}) => {
  const [config, setConfig] = useState<AutomationConfig>({
    // Triggers
    keywords: [],
    simpleKeywords: [],
    leadKeywords: [],
    autoReplyToComments: true,
    simpleAutoReplyToComments: true,
    leadAutoReplyToComments: true,
    commentReplies: ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],
    simpleCommentReplies: ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],
    leadCommentReplies: ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],

    // Pre‑DM (Simplified MVP: Single toggle controls both)
    enablePreDmEngagement: false, // NEW: Single toggle
    askToFollow: false, // Backward compatibility
    askToFollowMessage:
      "Hey! Would you mind following me? I share great content! 🙌",
    askForEmail: false, // Backward compatibility
    askForEmailMessage:
      "Awesome! 🚀 I have the PDF ready for you.\n\nWhere should I send it? Drop your best email below and I'll fire it over instantly. 👇",
    emailSuccessMessage:
      "Got it! Check your inbox (and maybe spam/promotions) in about 2 minutes. 🎁",
    leadMagnetLink: '',
    emailRetryMessage:
      "Hmm, that doesn't look like a valid email address. 🤔\n\nPlease type it again so I can send you the guide! 📧",
    simpleDmFlow: false,
    simpleFlowMessage: "Follow me to get the guide 👇 Reply with your email and I'll send it! 📧",
    simpleFlowEmailQuestion: "What's your email? Reply here and I'll send you the guide! 📧",

    // Primary DM
    dmType: 'text',
    dmMessages: ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
    simpleDmMessages: ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
    leadDmMessages: ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
    buttons: [{ text: 'Click me', url: '' }],
    delayMinutes: 0,
    isLeadCapture: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'simple' | 'lead'>('simple');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [keywordError, setKeywordError] = useState<string>('');

  useEffect(() => {
    if (initialConfig) {
      // Set activeTab first to ensure correct mode is selected before loading config
      if (initialConfig.isLeadCapture) {
        setActiveTab('lead');
      } else {
        setActiveTab('simple');
      }

      // Determine if this is a Lead Capture rule to avoid cross-mode contamination
      const isLeadRule = initialConfig.isLeadCapture || false;

      setConfig({
        keywords: initialConfig.keywords || [],
        // For Simple Reply fields: if this is a Lead Capture rule, don't fall back to shared values
        simpleKeywords: isLeadRule
          ? (initialConfig.simpleKeywords || [])
          : (initialConfig.simpleKeywords || initialConfig.keywords || []),
        leadKeywords: initialConfig.leadKeywords || [],
        // Public Acknowledgement Reply is always required (forced to true)
        autoReplyToComments: true,
        simpleAutoReplyToComments: true,
        leadAutoReplyToComments: true,
        // Ensure commentReplies has valid content, not just empty strings
        commentReplies: (initialConfig.commentReplies && initialConfig.commentReplies.length > 0 && initialConfig.commentReplies.some(r => r.trim()))
          ? initialConfig.commentReplies
          : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],
        // For Simple Reply fields: if this is a Lead Capture rule, don't fall back to shared values
        simpleCommentReplies: isLeadRule
          ? ((initialConfig.simpleCommentReplies && initialConfig.simpleCommentReplies.length > 0 && initialConfig.simpleCommentReplies.some(r => r.trim()))
              ? initialConfig.simpleCommentReplies
              : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'])
          : ((initialConfig.simpleCommentReplies && initialConfig.simpleCommentReplies.length > 0 && initialConfig.simpleCommentReplies.some(r => r.trim()))
              ? initialConfig.simpleCommentReplies
              : ((initialConfig.commentReplies && initialConfig.commentReplies.length > 0 && initialConfig.commentReplies.some(r => r.trim()))
                  ? initialConfig.commentReplies
                  : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'])),
        leadCommentReplies: (initialConfig.leadCommentReplies && initialConfig.leadCommentReplies.length > 0 && initialConfig.leadCommentReplies.some(r => r.trim()))
          ? initialConfig.leadCommentReplies
          : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],

        // NEW MVP: Check enablePreDmEngagement first, fallback to old checkboxes for backward compatibility
        enablePreDmEngagement: initialConfig.enablePreDmEngagement !== undefined 
          ? initialConfig.enablePreDmEngagement 
          : (initialConfig.askToFollow || initialConfig.askForEmail || false),
        askToFollow: initialConfig.askToFollow || false, // Backward compatibility
        askToFollowMessage:
          initialConfig.askToFollowMessage ||
          "Hey! Would you mind following me? I share great content! 🙌",
        askForEmail: initialConfig.askForEmail || false, // Backward compatibility
        askForEmailMessage:
          initialConfig.askForEmailMessage ||
          "Awesome! 🚀 I have the PDF ready for you.\n\nWhere should I send it? Drop your best email below and I'll fire it over instantly. 👇",
        simpleDmFlow: initialConfig.simpleDmFlow ?? false,
        simpleFlowMessage:
          initialConfig.simpleFlowMessage ||
          "Follow me to get the guide 👇 Reply with your email and I'll send it! 📧",
        simpleFlowEmailQuestion:
          initialConfig.simpleFlowEmailQuestion ||
          "What's your email? Reply here and I'll send you the guide! 📧",
        emailSuccessMessage:
          initialConfig.emailSuccessMessage ||
          "Got it! Check your inbox (and maybe spam/promotions) in about 2 minutes. 🎁",
        leadMagnetLink: initialConfig.leadMagnetLink || '',
        emailRetryMessage:
          initialConfig.emailRetryMessage ||
          "Hmm, that doesn't look like a valid email address. 🤔\n\nPlease type it again so I can send you the guide! 📧",

        dmType: initialConfig.dmType || 'text',
        // Ensure dmMessages has valid content, not just empty strings
        dmMessages: (initialConfig.dmMessages && initialConfig.dmMessages.length > 0 && initialConfig.dmMessages.some(m => m.trim()))
          ? initialConfig.dmMessages
          : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
        // For Simple Reply fields: if this is a Lead Capture rule, don't fall back to shared values
        simpleDmMessages: isLeadRule
          ? ((initialConfig.simpleDmMessages && initialConfig.simpleDmMessages.length > 0 && initialConfig.simpleDmMessages.some(m => m.trim()))
              ? initialConfig.simpleDmMessages
              : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'])
          : ((initialConfig.simpleDmMessages && initialConfig.simpleDmMessages.length > 0 && initialConfig.simpleDmMessages.some(m => m.trim()))
              ? initialConfig.simpleDmMessages
              : ((initialConfig.dmMessages && initialConfig.dmMessages.length > 0 && initialConfig.dmMessages.some(m => m.trim()))
                  ? initialConfig.dmMessages
                  : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'])),
        leadDmMessages: (initialConfig.leadDmMessages && initialConfig.leadDmMessages.length > 0 && initialConfig.leadDmMessages.some(m => m.trim()))
          ? initialConfig.leadDmMessages
          : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
        buttons:
          initialConfig.buttons || [{ text: 'Click me', url: '' }],
        delayMinutes: initialConfig.delayMinutes || 0,
        // Include isLeadCapture flag so MobilePreview can use it
        isLeadCapture: initialConfig.isLeadCapture || false,
      });
    } else {
      setCurrentKeyword('');
      setActiveTab('simple');
      setKeywordError('');
    }
  }, [initialConfig, isOpen]);

  const handleSave = async () => {
    // Validate trigger keywords - must have at least one keyword
    const activeKeywords =
      activeTab === 'simple' ? config.simpleKeywords : config.leadKeywords;
    
    if (!activeKeywords || activeKeywords.length === 0 || activeKeywords.filter((k) => k.trim().length > 0).length === 0) {
      setKeywordError('At least one trigger keyword is required');
      setIsSaving(false);
      return;
    }
    
    // Clear error if validation passes
    setKeywordError('');
    
    setIsSaving(true);
    try {
      const activeDmMessages =
        activeTab === 'simple' ? config.simpleDmMessages : config.leadDmMessages;
      // Public Acknowledgement Reply is always required (forced to true)
      const activeAutoReplyToComments = true;
      const activeCommentReplies = activeAutoReplyToComments
        ? activeTab === 'simple'
          ? config.simpleCommentReplies
          : config.leadCommentReplies
        : [];

      // Build payload - preserve both modes' toggle states, only update the active mode's data
      const base = { ...config };
      const payload =
        activeTab === 'simple'
          ? {
              ...base,
              keywords: activeKeywords,
              autoReplyToComments: activeAutoReplyToComments,
              commentReplies: activeCommentReplies,
              dmMessages: activeDmMessages,
              // persist simple flow data
              simpleKeywords: activeKeywords,
              simpleAutoReplyToComments: activeAutoReplyToComments,
              simpleCommentReplies: activeCommentReplies,
              simpleDmMessages: activeDmMessages,
              // Public Acknowledgement Reply is always required (forced to true)
              leadAutoReplyToComments: true,
              leadKeywords: [],
              leadCommentReplies: [],
              leadDmMessages: [],
              isLeadCapture: false,
            }
          : {
              ...base,
              keywords: activeKeywords,
              autoReplyToComments: activeAutoReplyToComments,
              commentReplies: activeCommentReplies,
              dmMessages: activeDmMessages,
              // persist lead-capture flow data
              leadKeywords: activeKeywords,
              leadAutoReplyToComments: activeAutoReplyToComments,
              leadCommentReplies: activeCommentReplies,
              leadDmMessages: activeDmMessages,
              // Public Acknowledgement Reply is always required (forced to true)
              simpleAutoReplyToComments: true,
              simpleKeywords: [],
              simpleCommentReplies: [],
              simpleDmMessages: [],
              isLeadCapture: true,
            };

      // Persist whether the user was on the Lead Capture tab so we can restore
      // that view later when editing the rule.
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Failed to save automation:', error);
      alert('Failed to save automation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden max-w-full overflow-x-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-full md:max-w-7xl shadow-xl">
        <div className="flex flex-col md:flex-row h-full bg-white">
          {/* Left Side: Settings Form */}
          <div className="flex-1 overflow-y-auto border-r-0 md:border-r border-gray-200 max-w-full overflow-x-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 md:px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Automation Builder
              </h2>
              <div className="flex items-center gap-2">
                {/* Mobile Preview Toggle */}
                <button
                  onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                  className="md:hidden rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title="Toggle Preview"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-6 space-y-6 max-w-full overflow-x-hidden">
              {/* DM Flow Type (Simple vs Lead Capture) */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  DM Type
                </label>
                <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('simple');
                      setKeywordError('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                      activeTab === 'simple'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Simple Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('lead');
                      setKeywordError('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                      activeTab === 'lead'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Lead Capture
                  </button>
                </div>
              </div>

              {/* Trigger Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Trigger Keywords <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 md:w-72 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                      <p className="text-center leading-relaxed">
                        Add keywords to trigger automation only on matching comments. At least one keyword is required.
                      </p>
                      {/* Tooltip arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={currentKeyword}
                    onChange={(e) => {
                      setCurrentKeyword(e.target.value);
                      // Clear error when user starts typing
                      if (keywordError) {
                        setKeywordError('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentKeyword.trim()) {
                        e.preventDefault();
                        const trimmed = currentKeyword.trim();
                        if (activeTab === 'simple') {
                          if (!config.simpleKeywords.includes(trimmed)) {
                            setConfig({
                              ...config,
                              simpleKeywords: [...config.simpleKeywords, trimmed],
                            });
                            // Clear error when keyword is added
                            if (keywordError) {
                              setKeywordError('');
                            }
                          }
                        } else {
                          if (!config.leadKeywords.includes(trimmed)) {
                            setConfig({
                              ...config,
                              leadKeywords: [...config.leadKeywords, trimmed],
                            });
                            // Clear error when keyword is added
                            if (keywordError) {
                              setKeywordError('');
                            }
                          }
                        }
                        setCurrentKeyword('');
                      }
                    }}
                    className={`w-full h-10 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all ${
                      keywordError ? 'border-red-500' : 'border-gray-400'
                    }`}
                    placeholder="Type keyword and press Enter to add"
                  />
                  {(activeTab === 'simple'
                    ? config.simpleKeywords.length > 0
                    : config.leadKeywords.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {(activeTab === 'simple'
                        ? config.simpleKeywords
                        : config.leadKeywords
                      ).map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTab === 'simple') {
                                setConfig({
                                  ...config,
                                  simpleKeywords: config.simpleKeywords.filter((_, i) => i !== index),
                                });
                                // Clear error if keywords still exist after removal
                                const remaining = config.simpleKeywords.filter((_, i) => i !== index);
                                if (remaining.length > 0 && keywordError) {
                                  setKeywordError('');
                                }
                              } else {
                                setConfig({
                                  ...config,
                                  leadKeywords: config.leadKeywords.filter((_, i) => i !== index),
                                });
                                // Clear error if keywords still exist after removal
                                const remaining = config.leadKeywords.filter((_, i) => i !== index);
                                if (remaining.length > 0 && keywordError) {
                                  setKeywordError('');
                                }
                              }
                            }}
                            className="text-green-600 hover:text-green-900 font-bold text-base leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {keywordError && (
                    <p className="mt-1 text-sm text-red-600">{keywordError}</p>
                  )}
                </div>
              </div>

              {/* Public Comment Replies */}
              {media.media_product_type !== 'STORY' && (
                <div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Public Acknowledgement Reply (required)
                      </label>
                      <div className="relative group">
                        <InformationCircleIcon className="h-5 w-5 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 md:w-72 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                          <p className="text-center leading-relaxed">
                            A public reply is automatically posted to confirm message delivery and prevent spam.
                          </p>
                          {/* Tooltip arrow */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      A public reply is automatically posted to confirm message delivery and prevent spam.
                    </p>
                  </div>
                  {(activeTab === 'simple' 
                    ? (config.simpleAutoReplyToComments ?? true)
                    : (config.leadAutoReplyToComments ?? true)) && (
                    <div className="space-y-3 mt-3">
                      {Array.from({ length: 3 }, (_, index) => {
                        const replies = activeTab === 'simple' ? config.simpleCommentReplies : config.leadCommentReplies;
                        const reply = replies[index] || '';
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-3">
                          <textarea
                            value={reply}
                            onChange={(e) => {
                              if (activeTab === 'simple') {
                                const newReplies = [...config.simpleCommentReplies];
                                // Ensure array has at least 3 items
                                while (newReplies.length < 3) {
                                  newReplies.push('');
                                }
                                newReplies[index] = e.target.value;
                                setConfig({
                                  ...config,
                                  simpleCommentReplies: newReplies,
                                });
                              } else {
                                const newReplies = [...config.leadCommentReplies];
                                // Ensure array has at least 3 items
                                while (newReplies.length < 3) {
                                  newReplies.push('');
                                }
                                newReplies[index] = e.target.value;
                                setConfig({
                                  ...config,
                                  leadCommentReplies: newReplies,
                                });
                              }
                            }}
                            rows={3}
                            className="flex-1 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none min-h-[60px]"
                            placeholder="Enter reply variation"
                          />
                          {(activeTab === 'simple'
                            ? config.simpleCommentReplies.length > 3
                            : config.leadCommentReplies.length > 3) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeTab === 'simple') {
                                  setConfig({
                                    ...config,
                                    simpleCommentReplies: config.simpleCommentReplies.filter(
                                      (_, i) => i !== index,
                                    ),
                                  });
                                } else {
                                  setConfig({
                                    ...config,
                                    leadCommentReplies: config.leadCommentReplies.filter(
                                      (_, i) => i !== index,
                                    ),
                                  });
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Primary DM Section (same for both tabs) */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Then send your primary DM...
                  </h3>
                  <p className="text-xs text-gray-500">
                    Write the message you want to auto-send with a button that
                    takes them to your link or product.
                  </p>
                </div>
                {/* Pre‑DM Engagement – only relevant when Lead Capture is selected */}
                {activeTab === 'lead' && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Before you send your primary DM, send them...
                      </h3>
                      <p className="text-xs text-gray-500">
                        Optional: Engage users with follow requests and/or email
                        collection before your main message.
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      {/* Toggle */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pre‑DM Engagement Message
                          </label>
                          <p className="text-xs text-gray-500">
                            Send follow request and email collection before the primary DM.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const isEnabled = config.enablePreDmEngagement ?? false;
                            setConfig({
                              ...config,
                              enablePreDmEngagement: !isEnabled,
                              // When enabled, automatically enable both follow and email
                              askToFollow: !isEnabled,
                              askForEmail: !isEnabled,
                            });
                          }}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${
                            config.enablePreDmEngagement ?? false
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              config.enablePreDmEngagement ?? false
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {(config.enablePreDmEngagement ?? false) && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                          {/* Simple flow: one message + re-ask email until valid (Lead Capture style) */}
                          <div className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                                Use simple flow (Lead Capture)
                              </label>
                              <p className="text-xs text-gray-500">
                                One message (follow + email), then keep asking for email until valid. No buttons.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  simpleDmFlow: !(config.simpleDmFlow ?? false),
                                })
                              }
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 ${
                                config.simpleDmFlow ?? false ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  config.simpleDmFlow ?? false ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {(config.simpleDmFlow ?? false) ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  First message (follow + ask for email)
                                </label>
                                <textarea
                                  value={config.simpleFlowMessage || ''}
                                  onChange={(e) =>
                                    setConfig({ ...config, simpleFlowMessage: e.target.value })
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                  placeholder="Follow me to get the guide 👇 Reply with your email and I'll send it! 📧"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Email question (re-sent until they reply with a valid email)
                                </label>
                                <textarea
                                  value={config.simpleFlowEmailQuestion || ''}
                                  onChange={(e) =>
                                    setConfig({ ...config, simpleFlowEmailQuestion: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                  placeholder="What's your email? Reply here and I'll send you the guide! 📧"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  When they type random text (invalid email)
                                </label>
                                <textarea
                                  value={config.emailRetryMessage || ''}
                                  onChange={(e) =>
                                    setConfig({ ...config, emailRetryMessage: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                  placeholder="That doesn't look like a valid email. Please share your correct email so I can send you the guide! 📧"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                          {/* Follow Request - Standard flow */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Follow Request Message
                            </label>
                            <textarea
                              value={config.askToFollowMessage || ''}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  askToFollowMessage: e.target.value,
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                              placeholder="Hey! Would you mind following me? I share great content! 🙌"
                            />
                          </div>

                          {/* Email Request - Standard flow */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Email Request Message
                            </label>
                            <div className="space-y-3">
                              <textarea
                                value={config.askForEmailMessage || ''}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    askForEmailMessage: e.target.value,
                                  })
                                }
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                placeholder="Awesome! 🚀 I have the PDF ready for you.\n\nWhere should I send it? Drop your best email below and I'll fire it over instantly. 👇"
                              />

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  PDF/Link to Share (Optional)
                                </label>
                                <input
                                  type="url"
                                  value={config.leadMagnetLink || ''}
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      leadMagnetLink: e.target.value,
                                    })
                                  }
                                  className="w-full h-10 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                                  placeholder="https://your-site.com/download/guide.pdf"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Email Success Message
                                </label>
                                <textarea
                                  value={config.emailSuccessMessage || ''}
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      emailSuccessMessage: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                  placeholder="Got it! Check your inbox in about 2 minutes. 🎁"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Invalid Email Retry Message
                                </label>
                                <textarea
                                  value={config.emailRetryMessage || ''}
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      emailRetryMessage: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none"
                                  placeholder="Hmm, that doesn't look like a valid email. Please type it again! 📧"
                                />
                              </div>
                            </div>
                          </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      DM Messages (variations for randomization)
                    </label>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }, (_, index) => {
                        const messages = activeTab === 'simple' 
                          ? (config.simpleDmMessages.length ? config.simpleDmMessages : [''])
                          : (config.leadDmMessages.length ? config.leadDmMessages : ['']);
                        const message = messages[index] || '';
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-3">
                          <textarea
                            value={message}
                            onChange={(e) => {
                              if (activeTab === 'simple') {
                                const base = config.simpleDmMessages.length
                                  ? config.simpleDmMessages
                                  : [''];
                                const newMessages = [...base];
                                // Ensure array has at least 3 items
                                while (newMessages.length < 3) {
                                  newMessages.push('');
                                }
                                newMessages[index] = e.target.value;
                                setConfig({
                                  ...config,
                                  simpleDmMessages: newMessages,
                                });
                              } else {
                                const base = config.leadDmMessages.length
                                  ? config.leadDmMessages
                                  : [''];
                                const newMessages = [...base];
                                // Ensure array has at least 3 items
                                while (newMessages.length < 3) {
                                  newMessages.push('');
                                }
                                newMessages[index] = e.target.value;
                                setConfig({
                                  ...config,
                                  leadDmMessages: newMessages,
                                });
                              }
                            }}
                            rows={3}
                            className="flex-1 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-none min-h-[60px]"
                            placeholder="Enter DM message variation"
                          />
                          {(activeTab === 'simple'
                            ? config.simpleDmMessages.length > 3
                            : config.leadDmMessages.length > 3) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeTab === 'simple') {
                                  setConfig({
                                    ...config,
                                    simpleDmMessages: config.simpleDmMessages.filter(
                                      (_, i) => i !== index,
                                    ),
                                  });
                                } else {
                                  setConfig({
                                    ...config,
                                    leadDmMessages: config.leadDmMessages.filter(
                                      (_, i) => i !== index,
                                    ),
                                  });
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Add Buttons (Optional)
                    </label>
                    <select
                      value={config.dmType}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          dmType: e.target.value as 'text' | 'text_button',
                        })
                      }
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                    >
                      <option value="text">Text Only</option>
                      <option value="text_button">Text + Buttons</option>
                    </select>
                  </div>

                  {config.dmType === 'text_button' && (
                    <div className="space-y-3">
                       {config.buttons.map((button, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                              <input
                                type="text"
                                value={button.text}
                                onChange={(e) => {
                                  const newButtons = [...config.buttons];
                                  newButtons[index].text = e.target.value;
                                  setConfig({ ...config, buttons: newButtons });
                                }}
                                placeholder="Button text"
                                className="h-9 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                              />
                              <input
                                type="url"
                                value={button.url}
                                onChange={(e) => {
                                  const newButtons = [...config.buttons];
                                  newButtons[index].url = e.target.value;
                                  setConfig({ ...config, buttons: newButtons });
                                }}
                                placeholder="https://..."
                                className="h-9 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                              />
                            </div>
                            {config.buttons.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfig({
                                    ...config,
                                     buttons: config.buttons.filter((_, i) => i !== index),
                                  })
                                }
                                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ),
                      )}
                      {config.buttons.length < 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              buttons: [
                                ...config.buttons,
                                { text: 'Click me', url: '' },
                              ],
                            })
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                        >
                          + Add Button
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Delay (minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={config.delayMinutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          delayMinutes: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="sticky bottom-0 bg-white flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 pb-4 md:pb-6 px-4 md:px-0 border-t border-gray-200 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-black text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Automation'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Live Preview - Desktop */}
          <div className="flex-1 overflow-y-auto bg-gray-50 max-w-full overflow-x-hidden hidden md:block">
            <div className="sticky top-0 z-10 bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Live Preview
              </h3>
            </div>
            <div className="p-4 md:p-6">
              <MobilePreview
                media={media}
                config={config}
                mode={activeTab}
                accountUsername={accountUsername}
              />
            </div>
          </div>

          {/* Mobile Preview - Toggleable */}
          {showPreviewMobile && (
            <div className="md:hidden border-t border-gray-200 bg-gray-50 max-w-full overflow-x-hidden">
              <div className="sticky top-0 z-10 bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Live Preview
                </h3>
                <button
                  onClick={() => setShowPreviewMobile(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <MobilePreview
                  media={media}
                  config={config}
                  mode={activeTab}
                  accountUsername={accountUsername}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationDrawer;