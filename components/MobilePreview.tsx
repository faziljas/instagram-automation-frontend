'use client';

import { useState } from 'react';

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
  // Triggers / keywords
  keywords: string[]; // active keywords (current mode, for backward compatibility)
  simpleKeywords?: string[];
  leadKeywords?: string[];

  // Public comment replies
  autoReplyToComments: boolean; // legacy global flag
  simpleAutoReplyToComments?: boolean;
  leadAutoReplyToComments?: boolean;
  commentReplies: string[]; // legacy shared replies
  simpleCommentReplies?: string[];
  leadCommentReplies?: string[];

  // Pre-DM Actions
  askToFollow?: boolean;
  askToFollowMessage?: string;
  askForEmail?: boolean;
  askForEmailMessage?: string;
  emailSuccessMessage?: string;
  emailRetryMessage?: string;
  leadMagnetLink?: string;

  // Primary DM
  dmType: 'text' | 'text_button' | 'lead_capture';
  dmMessages: string[]; // active messages (current mode, for backward compatibility)
  simpleDmMessages?: string[];
  leadDmMessages?: string[];
  buttons: Array<{ text: string; url: string }>;
  delayMinutes: number;
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
}

interface MobilePreviewProps {
  media: MediaItem;
  config: AutomationConfig;
  accountUsername: string;
  mode?: 'simple' | 'lead';
}

export default function MobilePreview({
  media,
  config,
  accountUsername,
  mode = 'simple',
}: MobilePreviewProps) {
  const [showDM, setShowDM] = useState(false);

  const isLeadMode = mode === 'lead';

  // Check if this rule has mode-specific fields configured (indicates strict separation is needed)
  const hasModeSpecificFields = !!(
    (config.simpleKeywords && config.simpleKeywords.length > 0) ||
    (config.leadKeywords && config.leadKeywords.length > 0) ||
    (config.simpleDmMessages && config.simpleDmMessages.length > 0) ||
    (config.leadDmMessages && config.leadDmMessages.length > 0) ||
    (config.simpleCommentReplies && config.simpleCommentReplies.length > 0) ||
    (config.leadCommentReplies && config.leadCommentReplies.length > 0) ||
    config.isLeadCapture
  );

  // Keywords shown in preview:
  // - If mode-specific fields exist, use STRICT separation (no fallback to shared fields)
  // - Otherwise, use legacy fallback behavior for old rules
  const activeKeywords = isLeadMode
    ? (hasModeSpecificFields
        ? (config.leadKeywords || [])
        : (config.leadKeywords && config.leadKeywords.length > 0
            ? config.leadKeywords
            : config.keywords))
    : (hasModeSpecificFields
        ? (config.simpleKeywords || [])
        : (config.simpleKeywords && config.simpleKeywords.length > 0
            ? config.simpleKeywords
            : config.keywords));

  // DM Messages shown in preview:
  // - If mode-specific fields exist, use STRICT separation (no fallback to shared fields)
  // - Otherwise, use legacy fallback behavior for old rules
  const activeDmMessages = isLeadMode
    ? (hasModeSpecificFields
        ? (config.leadDmMessages || [])
        : (config.leadDmMessages && config.leadDmMessages.length > 0
            ? config.leadDmMessages
            : config.dmMessages))
    : (hasModeSpecificFields
        ? (config.simpleDmMessages || [])
        : (config.simpleDmMessages && config.simpleDmMessages.length > 0
            ? config.simpleDmMessages
            : config.dmMessages));

  // Get a sample keyword for preview
  const sampleKeyword =
    activeKeywords && activeKeywords.length > 0 ? activeKeywords[0] : '';

  // Determine if public comment reply should be shown for this mode
  const allowCommentReply = isLeadMode
    ? (config.leadAutoReplyToComments ?? config.autoReplyToComments)
    : (config.simpleAutoReplyToComments ?? config.autoReplyToComments);

  // Comment Replies shown in preview:
  // - If mode-specific fields exist, use STRICT separation (no fallback to shared fields)
  // - Otherwise, use legacy fallback behavior for old rules
  const activeCommentReplies = allowCommentReply
    ? isLeadMode
      ? (hasModeSpecificFields
          ? (config.leadCommentReplies || [])
          : (config.leadCommentReplies && config.leadCommentReplies.length > 0
              ? config.leadCommentReplies
              : config.commentReplies || []))
      : (hasModeSpecificFields
          ? (config.simpleCommentReplies || [])
          : (config.simpleCommentReplies && config.simpleCommentReplies.length > 0
              ? config.simpleCommentReplies
              : config.commentReplies || []))
    : [];

  const sampleComment = sampleKeyword || 'Sample comment';
  const sampleReply =
    activeCommentReplies.length > 0 ? activeCommentReplies[0] : null;
  
  // Primary DM text (final message)
  const sampleDM =
    activeDmMessages && activeDmMessages.length > 0 ? activeDmMessages[0] : '';

  return (
    <div className="flex justify-center">
      {/* iPhone Frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="h-11 bg-white flex items-center justify-between px-6 pt-2">
            <span className="text-xs font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-black rounded-sm">
                <div className="w-3 h-1.5 bg-black rounded-sm m-0.5" />
              </div>
              <svg className="w-5 h-3" viewBox="0 0 24 12" fill="black">
                <path d="M1 6h22M1 1h4M1 11h4M20 1h4M20 11h4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Instagram App Content */}
          <div className="h-[calc(100%-44px)] overflow-y-auto bg-white">
            {/* Post/Reel Preview */}
            <div className="bg-white">
              <div className="aspect-square bg-gray-200 relative">
                <img
                  src={media.thumbnail_url || media.media_url}
                  alt={media.caption.substring(0, 50)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Post Info */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">IG</span>
                    </div>
                    <span className="text-sm font-semibold">@{accountUsername}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-900">{media.caption.substring(0, 100)}...</p>
                <div className="text-xs text-gray-500">
                  {media.like_count} likes • {media.comments_count} comments
                </div>
              </div>

              {/* Comment Section Preview */}
              {activeKeywords && activeKeywords.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold">user123</span>
                        <p className="text-xs text-gray-700">{sampleKeyword}</p>
                      </div>
                    </div>
                    {sampleReply && (
                      <div className="flex items-start gap-2 ml-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex-shrink-0 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">IG</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold">@{accountUsername}</span>
                          <p className="text-xs text-gray-700">{sampleReply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DM Preview Button */}
              {activeDmMessages && activeDmMessages.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowDM(!showDM)}
                    className="w-full text-sm text-blue-600 font-semibold"
                  >
                    {showDM ? 'Hide DM Preview' : 'Show DM Preview'}
                  </button>
                </div>
              )}
            </div>

              {/* DM Chat Preview */}
            {showDM && activeDmMessages && activeDmMessages.length > 0 && (
              <div className="mt-4 border-t-4 border-gray-200 pt-4">
                <div className="px-4 py-2 bg-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Direct Message</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  {/* 1) Initial DM message
                       - Lead Capture: bot sends a short greeting (left, gray)
                       - Simple Reply: no separate initial bubble */}
                  {isLeadMode && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                        <p className="text-sm">Hi! 👋</p>
                      </div>
                    </div>
                  )}

                  {/* 2) Bot sends follow message with IG link + Follow Me button (Lead Capture only) */}
                  {isLeadMode && config.askToFollow && config.askToFollowMessage && (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                          <p className="text-sm whitespace-pre-line">
                            {config.askToFollowMessage}
                          </p>
                          <p className="mt-1 text-xs text-blue-600 break-all">
                            🔗 https://instagram.com/{accountUsername}
                          </p>
                          <div className="mt-2">
                            <button className="w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3">
                              Follow Me 👆
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* 3) User follows and taps Follow Me */}
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                          <p className="text-sm">✓ Followed</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 4) Bot sends email question (if enabled - Lead Capture only) */}
                  {isLeadMode && config.askForEmail && config.askForEmailMessage && (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                          <p className="text-sm">{config.askForEmailMessage}</p>
                        </div>
                      </div>

                      {/* 5) User types email */}
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                          <p className="text-sm">john@example.com</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 6) Optional email success message (only in lead + email flow) */}
                  {isLeadMode && config.askForEmail && config.emailSuccessMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                        <p className="text-sm whitespace-pre-line">
                          {config.emailSuccessMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 7) Bot sends primary DM (final offer/message) */}
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                      <p className="text-sm whitespace-pre-line">
                        {sampleDM}
                        {config.askToFollow && isLeadMode && (
                          '\n\n🙏 If you ever unfollow, I may have to pause sending free guides and resources. Staying followed helps me keep this running for you. ❤️'
                        )}
                      </p>
                      {config.dmType === 'text_button' &&
                        config.buttons.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {config.buttons
                              .filter((b) => b.text.trim() && b.url.trim())
                              .map((button, index) => (
                                <a
                                  key={index}
                                  href={button.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3"
                                >
                                  {button.text}
                                </a>
                              ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
