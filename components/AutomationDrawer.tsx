import React, { useEffect, useState, useRef } from 'react';
import {
  XMarkIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import MobilePreview from './MobilePreview';
import {
  INSTAGRAM_DM_MAX_CHARS,
  INSTAGRAM_PUBLIC_COMMENT_MAX_CHARS,
  INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT,
  INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH,
  INSTAGRAM_BUTTON_TEXT_MAX_CHARS,
  INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS,
} from '@/lib/instagramLimits';

export type DmTypeValue = 'text' | 'text_button';

const DM_TYPE_OPTIONS: { value: DmTypeValue; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'text', label: 'Text only', Icon: DocumentIcon },
  { value: 'text_button', label: 'Text + Button', Icon: DocumentTextIcon },
];

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

  // Pre‑DM Flow Type: 'email' | 'phone' | 'followers' (defaults to 'email')
  preDmFlowType?: 'email' | 'phone' | 'followers';
  // Legacy fields (kept for backward compatibility)
  enablePreDmEngagement?: boolean; // Deprecated: use preDmFlowType instead
  askToFollow?: boolean; // Backward compatibility
  askToFollowMessage?: string;
  followRecheckMessage?: string; // "Are you following me?" (Followers) or "Are you followed?" (Email/Phone)
  followNoExitMessage?: string; // Followers-only: message when user says No (exit, no primary DM)
  askForEmail?: boolean; // Backward compatibility
  askForEmailMessage?: string;
  emailSuccessMessage?: string;
  leadMagnetLink?: string;
  emailRetryMessage?: string;
  // Simple flow: one message (follow + email ask), then re-ask same email question until valid
  simpleDmFlow?: boolean;
  simpleFlowMessage?: string;
  simpleFlowEmailQuestion?: string;
  // Simple flow (Phone): follow + phone ask, then re-ask until valid phone
  simpleDmFlowPhone?: boolean;
  simpleFlowPhoneMessage?: string;
  simpleFlowPhoneQuestion?: string;
  phoneInvalidRetryMessage?: string;

  // Primary DM (text or text + button only)
  dmType: DmTypeValue;
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

    // Pre‑DM Flow Type (default to email)
    preDmFlowType: 'email',
    // Legacy fields (kept for backward compatibility)
    enablePreDmEngagement: false, // Deprecated: use preDmFlowType instead
    askToFollow: false, // Backward compatibility
    askToFollowMessage:
      "Hey! Would you mind following me? I share great content! 🙌",
    followRecheckMessage: "Are you followed?",
    followNoExitMessage: "No problem! Comment again anytime when you'd like the guide. 📩",
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
    simpleDmFlowPhone: false,
    simpleFlowPhoneMessage: "Follow me to get the guide 👇 Reply with your phone number and I'll send it! 📱",
    simpleFlowPhoneQuestion: "What's your phone number? Reply here and I'll send you the guide! 📱",
    phoneInvalidRetryMessage: "That doesn't look like a valid phone number. 🤔 Please share your correct number so I can send you the guide! 📱",

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
  const ignoreBackdropClickRef = useRef(false);
  const dmTypeDropdownRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);
  const [dmTypeDropdownOpen, setDmTypeDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'simple' | 'lead'>('simple');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [keywordError, setKeywordError] = useState<string>('');

  // Only apply initialConfig when the drawer opens (not on every parent re-render), so in-drawer changes (e.g. DM type) are not overwritten
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    if (!justOpened) return;
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

        // Pre-DM Flow Type: determine from existing config or default to 'email'
        preDmFlowType: initialConfig.preDmFlowType || (
          initialConfig.simpleDmFlow ? 'email' :
          initialConfig.simpleDmFlowPhone ? 'phone' :
          (initialConfig.enablePreDmEngagement || initialConfig.askToFollow) ? 'followers' :
          'email'
        ),
        // Legacy fields (kept for backward compatibility)
        enablePreDmEngagement: initialConfig.enablePreDmEngagement !== undefined 
          ? initialConfig.enablePreDmEngagement 
          : (initialConfig.askToFollow || initialConfig.askForEmail || false),
        askToFollow: initialConfig.askToFollow || false, // Backward compatibility
        askToFollowMessage: (() => {
          const preDmFlow = initialConfig.preDmFlowType || (
            initialConfig.simpleDmFlow ? 'email' :
            initialConfig.simpleDmFlowPhone ? 'phone' :
            (initialConfig.enablePreDmEngagement || initialConfig.askToFollow) ? 'followers' : 'email'
          );
          const base = initialConfig.askToFollowMessage || "Hey! Would you mind following me? I share great content! 🙌";
          if (preDmFlow === 'followers' && !base.includes("✅ Once you've followed")) {
            return `${base}\n\n✅ Once you've followed, type 'done' or 'followed' to continue!\n🔗 Visit my profile: https://www.instagram.com/${accountUsername}\nClick one of the options below:`;
          }
          return base;
        })(),
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
        simpleDmFlowPhone: initialConfig.simpleDmFlowPhone ?? false,
        simpleFlowPhoneMessage:
          initialConfig.simpleFlowPhoneMessage ||
          "Follow me to get the guide 👇 Reply with your phone number and I'll send it! 📱",
        simpleFlowPhoneQuestion:
          initialConfig.simpleFlowPhoneQuestion ||
          "What's your phone number? Reply here and I'll send you the guide! 📱",
        phoneInvalidRetryMessage:
          initialConfig.phoneInvalidRetryMessage ||
          "That doesn't look like a valid phone number. 🤔 Please share your correct number so I can send you the guide! 📱",
        emailSuccessMessage:
          initialConfig.emailSuccessMessage ||
          "Got it! Check your inbox (and maybe spam/promotions) in about 2 minutes. 🎁",
        leadMagnetLink: initialConfig.leadMagnetLink || '',
        emailRetryMessage:
          initialConfig.emailRetryMessage ||
          "Hmm, that doesn't look like a valid email address. 🤔\n\nPlease type it again so I can send you the guide! 📧",

        dmType: (['text', 'text_button'].includes(initialConfig.dmType as string)
          ? initialConfig.dmType
          : 'text') as DmTypeValue,
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
  }, [initialConfig, isOpen, accountUsername]);

  // Close DM type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dmTypeDropdownRef.current && !dmTypeDropdownRef.current.contains(event.target as Node)) {
        setDmTypeDropdownOpen(false);
      }
    };
    if (dmTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dmTypeDropdownOpen]);

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
      {/* Backdrop - ignore clicks right after opening file picker so drawer doesn't close */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => {
          if (ignoreBackdropClickRef.current) return;
          onClose();
        }}
      />

      {/* Drawer - always 100vw so zoom doesn't shift page left; max 80rem on very wide screens */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-full min-w-0 md:w-[min(100vw,80rem)] shadow-xl overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full w-full min-w-0 bg-slate-50 overflow-x-hidden">
          {/* Left Side: Settings Form - min width uses vw so zoom doesn't cause horizontal overflow */}
          <div className="flex-1 min-w-[min(280px,45vw)] overflow-y-auto border-r-0 md:border-r border-slate-200 max-w-full overflow-x-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 md:px-6 py-3">
              <h2 className="text-lg font-semibold text-white">
                Automation Builder
              </h2>
              <div className="flex items-center gap-2">
                {/* Mobile Preview Toggle */}
                <button
                  onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                  className="md:hidden rounded-lg p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Toggle Preview"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-4 md:px-6 py-3 md:py-4 space-y-4 max-w-full overflow-x-hidden">
              {/* DM Flow Type (Simple vs Lead Capture) */}
              <div className="mb-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DM Type
                </label>
                <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('simple');
                      setKeywordError('');
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                      activeTab === 'simple'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Lead Capture
                  </button>
                </div>
              </div>

              {/* Trigger Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Trigger Keywords <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {(activeTab === 'simple' ? config.simpleKeywords.length : config.leadKeywords.length)}/{INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT} keywords
                  </span>
                  <div className="relative group">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 hover:text-blue-600 cursor-help transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 md:w-72 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                      <p className="text-center leading-relaxed">
                        Add keywords to trigger automation only on matching comments. At least one keyword is required. Max {INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT} keywords, {INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH} chars each.
                      </p>
                      {/* Tooltip arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={currentKeyword}
                    maxLength={INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH}
                    onChange={(e) => {
                      setCurrentKeyword(e.target.value.slice(0, INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH));
                      // Clear error when user starts typing
                      if (keywordError) {
                        setKeywordError('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentKeyword.trim()) {
                        e.preventDefault();
                        const trimmed = currentKeyword.trim().slice(0, INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH);
                        const currentList = activeTab === 'simple' ? config.simpleKeywords : config.leadKeywords;
                        if (currentList.length >= INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT) {
                          setKeywordError(`Maximum ${INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT} keywords allowed.`);
                          return;
                        }
                        if (activeTab === 'simple') {
                          if (!config.simpleKeywords.includes(trimmed)) {
                            setConfig({
                              ...config,
                              simpleKeywords: [...config.simpleKeywords, trimmed],
                            });
                            if (keywordError) setKeywordError('');
                          }
                        } else {
                          if (!config.leadKeywords.includes(trimmed)) {
                            setConfig({
                              ...config,
                              leadKeywords: [...config.leadKeywords, trimmed],
                            });
                            if (keywordError) setKeywordError('');
                          }
                        }
                        setCurrentKeyword('');
                      }
                    }}
                    className={`w-full h-10 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all ${
                      keywordError ? 'border-red-500' : 'border-gray-400'
                    }`}
                    placeholder={`Type keyword (max ${INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH} chars) and press Enter`}
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
                  <div className="mb-1">
                    <div className="flex items-center gap-2 mb-0.5">
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
                    <p className="text-xs text-gray-500 leading-tight">
                      A public reply is automatically posted to confirm message delivery and prevent spam.
                    </p>
                  </div>
                  {(activeTab === 'simple' 
                    ? (config.simpleAutoReplyToComments ?? true)
                    : (config.leadAutoReplyToComments ?? true)) && (
                    <div className="space-y-1.5 mt-1.5">
                      {Array.from({ length: 3 }, (_, index) => {
                        const replies = activeTab === 'simple' ? config.simpleCommentReplies : config.leadCommentReplies;
                        const reply = replies[index] || '';
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-1.5">
                          <div className="flex-1">
                            <textarea
                              value={reply}
                              maxLength={INSTAGRAM_PUBLIC_COMMENT_MAX_CHARS}
                              onChange={(e) => {
                                const val = e.target.value.slice(0, INSTAGRAM_PUBLIC_COMMENT_MAX_CHARS);
                                if (activeTab === 'simple') {
                                  const newReplies = [...config.simpleCommentReplies];
                                  while (newReplies.length < 3) newReplies.push('');
                                  newReplies[index] = val;
                                  setConfig({ ...config, simpleCommentReplies: newReplies });
                                } else {
                                  const newReplies = [...config.leadCommentReplies];
                                  while (newReplies.length < 3) newReplies.push('');
                                  newReplies[index] = val;
                                  setConfig({ ...config, leadCommentReplies: newReplies });
                                }
                              }}
                              rows={1}
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-y min-h-[34px] max-h-[80px]"
                              placeholder="Enter reply variation (public comment)"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">{reply.length}/{INSTAGRAM_PUBLIC_COMMENT_MAX_CHARS}</p>
                          </div>
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
              <div className="border-t border-slate-200 pt-4">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                    Then send your primary DM...
                  </h3>
                  <p className="text-xs text-gray-500">
                    Write the message you want to auto-send with a button that
                    takes them to your link or product.
                  </p>
                </div>
                {/* Pre‑DM Engagement – only relevant when Lead Capture is selected */}
                {activeTab === 'lead' && (
                  <div className="mb-4">
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                        Before you send your primary DM, send them...
                      </h3>
                      <p className="text-xs text-gray-500">
                        Engage users with Email/Phone/Follow request collection before your main message.
                      </p>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-100">
                      {/* Radio buttons for Pre-DM Flow Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Pre-DM Flow Type
                        </label>
                        
                        {/* Email Option */}
                        <label className="flex items-start p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="radio"
                            name="preDmFlowType"
                            value="email"
                            checked={config.preDmFlowType === 'email'}
                            onChange={() => {
                              setConfig({
                                ...config,
                                preDmFlowType: 'email',
                                simpleDmFlow: true,
                                simpleDmFlowPhone: false,
                                enablePreDmEngagement: false,
                                askToFollow: false,
                                askForEmail: false,
                              });
                            }}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-700">Email</div>
                            <div className="text-xs text-gray-500">
                              One message (follow + email), then keep asking for email until valid.
                            </div>
                          </div>
                        </label>

                        {/* Phone Option */}
                        <label className="flex items-start p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="radio"
                            name="preDmFlowType"
                            value="phone"
                            checked={config.preDmFlowType === 'phone'}
                            onChange={() => {
                              setConfig({
                                ...config,
                                preDmFlowType: 'phone',
                                simpleDmFlowPhone: true,
                                simpleDmFlow: false,
                                enablePreDmEngagement: false,
                                askToFollow: false,
                                askForEmail: false,
                              });
                            }}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-700">Phone</div>
                            <div className="text-xs text-gray-500">
                              One message (follow + phone), then keep asking for phone until valid.
                            </div>
                          </div>
                        </label>

                        {/* Followers Option */}
                        <label className="flex items-start p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="radio"
                            name="preDmFlowType"
                            value="followers"
                            checked={config.preDmFlowType === 'followers'}
                            onChange={() => {
                              const base = config.askToFollowMessage || "Hey! Would you mind following me? I share great content! 🙌";
                              const full = base.includes("✅ Once you've followed")
                                ? base
                                : `${base}\n\n✅ Once you've followed, type 'done' or 'followed' to continue!\n🔗 Visit my profile: https://www.instagram.com/${accountUsername}\nClick one of the options below:`;
                              setConfig({
                                ...config,
                                preDmFlowType: 'followers',
                                enablePreDmEngagement: true,
                                askToFollow: true,
                                askForEmail: false,
                                simpleDmFlow: false,
                                simpleDmFlowPhone: false,
                                askToFollowMessage: full,
                              });
                            }}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-700">Followers</div>
                            <div className="text-xs text-gray-500">
                              One message (followers), then keep asking for follow until valid.
                            </div>
                          </div>
                        </label>

                      </div>

                      {/* Show fields based on selected option */}
                      {config.preDmFlowType && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-slate-200">

                          {/* Email Flow Fields - Simplified */}
                          {config.preDmFlowType === 'email' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First message (follow + ask for email)
                              </label>
                              <textarea
                                value={config.simpleFlowMessage || ''}
                                maxLength={INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}
                                onChange={(e) =>
                                  setConfig({ ...config, simpleFlowMessage: e.target.value.slice(0, INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS) })
                                }
                                rows={1}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-y min-h-[34px] max-h-[80px]"
                                placeholder="Follow me to get the guide 👇 Reply with your email and I'll send it! 📧"
                              />
                              <p className="text-xs text-gray-500 mt-0.5">{(config.simpleFlowMessage || '').length}/{INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}</p>
                            </div>
                          )}

                          {/* Phone Flow Fields - Simplified */}
                          {config.preDmFlowType === 'phone' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First message (follow + ask for phone)
                              </label>
                              <textarea
                                value={config.simpleFlowPhoneMessage || ''}
                                maxLength={INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}
                                onChange={(e) =>
                                  setConfig({ ...config, simpleFlowPhoneMessage: e.target.value.slice(0, INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS) })
                                }
                                rows={1}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-y min-h-[34px] max-h-[80px]"
                                placeholder="Follow me to get the guide 👇 Reply with your phone number and I'll send it! 📱"
                              />
                              <p className="text-xs text-gray-500 mt-0.5">{(config.simpleFlowPhoneMessage || '').length}/{INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}</p>
                            </div>
                          )}

                          {/* Followers Flow Fields - First message only; backend handles recheck/exit */}
                          {config.preDmFlowType === 'followers' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Follow request message
                              </label>
                              <textarea
                                value={config.askToFollowMessage || ''}
                                maxLength={INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    askToFollowMessage: e.target.value.slice(0, INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS),
                                  })
                                }
                                rows={5}
                                className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-y min-h-[120px] max-h-[200px]"
                                placeholder={`Hey! Would you mind following me? I share great content! 🙌\n\n✅ Once you've followed, type 'done' or 'followed' to continue!\n🔗 Visit my profile: https://www.instagram.com/${accountUsername}\nClick one of the options below:`}
                              />
                              <p className="text-xs text-gray-500 mt-0.5">{(config.askToFollowMessage || '').length}/{INSTAGRAM_PRE_DM_MESSAGE_MAX_CHARS}</p>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DM Messages (variations for randomization)
                    </label>
                    <div className="space-y-1.5">
                      {Array.from({ length: 3 }, (_, index) => {
                        const messages = activeTab === 'simple' 
                          ? (config.simpleDmMessages.length ? config.simpleDmMessages : [''])
                          : (config.leadDmMessages.length ? config.leadDmMessages : ['']);
                        const message = messages[index] || '';
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-1.5">
                          <div className="flex-1">
                            <textarea
                              value={message}
                              maxLength={INSTAGRAM_DM_MAX_CHARS}
                              onChange={(e) => {
                                const val = e.target.value.slice(0, INSTAGRAM_DM_MAX_CHARS);
                                if (activeTab === 'simple') {
                                  const base = config.simpleDmMessages.length ? config.simpleDmMessages : [''];
                                  const newMessages = [...base];
                                  while (newMessages.length < 3) newMessages.push('');
                                  newMessages[index] = val;
                                  setConfig({ ...config, simpleDmMessages: newMessages });
                                } else {
                                  const base = config.leadDmMessages.length ? config.leadDmMessages : [''];
                                  const newMessages = [...base];
                                  while (newMessages.length < 3) newMessages.push('');
                                  newMessages[index] = val;
                                  setConfig({ ...config, leadDmMessages: newMessages });
                                }
                              }}
                              rows={1}
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all resize-y min-h-[34px] max-h-[80px]"
                              placeholder="Enter DM message variation"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">{message.length}/{INSTAGRAM_DM_MAX_CHARS}</p>
                          </div>
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

                  {/* DM type – SS1-style dropdown with icons */}
                  <div className="relative" ref={dmTypeDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DM type
                    </label>
                    <button
                      type="button"
                      onClick={() => setDmTypeDropdownOpen((o) => !o)}
                      className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-left transition-all hover:border-gray-500"
                    >
                      <span className="flex items-center gap-2">
                        {(() => {
                          const opt = DM_TYPE_OPTIONS.find((o) => o.value === config.dmType);
                          const Icon = opt?.Icon ?? DocumentIcon;
                          return (
                            <>
                              <Icon className="h-5 w-5 text-gray-500 shrink-0" />
                              {opt?.label ?? 'Text only'}
                            </>
                          );
                        })()}
                      </span>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${dmTypeDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {dmTypeDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        {DM_TYPE_OPTIONS.map((option) => {
                          const Icon = option.Icon;
                          const isSelected = config.dmType === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setConfig({
                                  ...config,
                                  dmType: option.value,
                                });
                                setDmTypeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="h-5 w-5 text-gray-500 shrink-0" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {config.dmType === 'text_button' && (
                    <div className="space-y-2">
                       {config.buttons.map((button, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                              <div>
                                <input
                                  type="text"
                                  value={button.text}
                                  maxLength={INSTAGRAM_BUTTON_TEXT_MAX_CHARS}
                                  onChange={(e) => {
                                    const newButtons = [...config.buttons];
                                    newButtons[index].text = e.target.value.slice(0, INSTAGRAM_BUTTON_TEXT_MAX_CHARS);
                                    setConfig({ ...config, buttons: newButtons });
                                  }}
                                  placeholder="Button text"
                                  className="w-full h-9 px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">{button.text.length}/{INSTAGRAM_BUTTON_TEXT_MAX_CHARS}</p>
                              </div>
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

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="sticky bottom-0 bg-slate-100 flex flex-col sm:flex-row justify-end gap-2 pt-3 md:pt-4 pb-3 md:pb-4 px-4 md:px-0 border-t border-slate-200 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors"
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

          {/* Right Side: Live Preview - min width uses vw so zoom doesn't cause horizontal overflow */}
          <div className="flex-1 min-w-[min(300px,45vw)] overflow-y-auto bg-slate-100 max-w-full overflow-x-hidden hidden md:block">
            <div className="sticky top-0 z-10 bg-slate-200 px-4 md:px-6 py-3 border-b border-slate-300">
              <h3 className="text-lg font-semibold text-slate-800">
                Live Preview
              </h3>
            </div>
            <div className="p-3 md:p-4">
              <MobilePreview
                media={media}
                config={config as React.ComponentProps<typeof MobilePreview>['config']}
                mode={activeTab}
                accountUsername={accountUsername}
              />
            </div>
          </div>

          {/* Mobile Preview - Toggleable */}
          {showPreviewMobile && (
            <div className="md:hidden border-t border-slate-200 bg-slate-100 max-w-full overflow-x-hidden">
              <div className="sticky top-0 z-10 bg-slate-200 px-4 py-3 border-b border-slate-300 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">
                  Live Preview
                </h3>
                <button
                  onClick={() => setShowPreviewMobile(false)}
                  className="rounded-lg p-1 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <MobilePreview
                  media={media}
                  config={config as React.ComponentProps<typeof MobilePreview>['config']}
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