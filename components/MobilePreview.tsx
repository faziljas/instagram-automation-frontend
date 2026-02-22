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
  enablePreDmEngagement?: boolean;
  askToFollow?: boolean;
  askToFollowMessage?: string;
  askForEmail?: boolean;
  askForEmailMessage?: string;
  emailSuccessMessage?: string;
  emailRetryMessage?: string;
  leadMagnetLink?: string;
  // Simple flow (email): one message, then re-ask email until valid
  simpleDmFlow?: boolean;
  simpleFlowMessage?: string;
  simpleFlowEmailQuestion?: string;
  // Simple flow (phone): one message, then re-ask phone until valid
  simpleDmFlowPhone?: boolean;
  simpleFlowPhoneMessage?: string;
  simpleFlowPhoneQuestion?: string;
  phoneInvalidRetryMessage?: string;

  // Primary DM
  dmType: 'text' | 'text_button' | 'lead_capture' | 'image_video' | 'card' | 'voice_message';
  dmMessages: string[]; // active messages (current mode, for backward compatibility)
  simpleDmMessages?: string[];
  leadDmMessages?: string[];
  buttons: Array<{ text: string; url: string }>;
  dmCardImageUrl?: string;
  dmCardTitle?: string;
  dmCardSubtitle?: string;
  dmCardButton?: { text: string; url: string };
  delayMinutes: number;
  isLeadCapture?: boolean;
  preDmFlowType?: 'email' | 'phone' | 'followers';
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

  // Pre-DM engagement: show DM preview when lead flow has content (standard or simple)
  const preDmEngagementOn = config.enablePreDmEngagement ?? (config.askToFollow || config.askForEmail);
  const simpleFlowEmailOn = !!(config.simpleDmFlow && (config.simpleFlowMessage || config.simpleFlowEmailQuestion));
  const simpleFlowPhoneOn = !!(config.simpleDmFlowPhone && (config.simpleFlowPhoneMessage || config.simpleFlowPhoneQuestion));
  const showDmPreviewButton = (activeDmMessages && activeDmMessages.length > 0) || (config.dmType === 'card' && config.dmCardImageUrl) || (isLeadMode && preDmEngagementOn && (simpleFlowEmailOn || simpleFlowPhoneOn || (config.askToFollow || config.askForEmail)));

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
              {showDmPreviewButton && (
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
            {showDM && showDmPreviewButton && (
              <div className="mt-4 border-t-4 border-gray-200 pt-4">
                <div className="px-4 py-2 bg-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Direct Message</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  {/* ——— Simple flow (Phone): one message (follow + phone) → user phone → primary DM ——— */}
                  {simpleFlowPhoneOn ? (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                          <p className="text-sm whitespace-pre-line">
                            {config.simpleFlowPhoneMessage || "Follow me to get the guide 👇 Reply with your phone number and I'll send it! 📱"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                          <p className="text-sm">+1 555-123-4567</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm overflow-hidden">
                          {config.dmType === 'card' && config.dmCardImageUrl ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                              <div className="aspect-video bg-gray-300">
                                <img src={config.dmCardImageUrl} alt="Card" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <div className="px-3 py-2">
                                <p className="text-sm font-semibold">{config.dmCardTitle || 'Card title'}</p>
                                {config.dmCardSubtitle && <p className="text-xs text-gray-600 mt-0.5">{config.dmCardSubtitle}</p>}
                                {config.dmCardButton?.text && config.dmCardButton?.url && (
                                  <div className="mt-2">
                                    <span className="inline-block text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-1.5 px-3">{config.dmCardButton.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-line px-4 py-2">
                                {sampleDM}
                              </p>
                              {config.dmType === 'text_button' && config.buttons.length > 0 && (
                                <div className="px-4 pb-2 space-y-1">
                                  {config.buttons.filter((b) => b.text.trim() && b.url.trim()).map((button, index) => (
                                    <a key={index} href={button.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3">
                                      {button.text}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : simpleFlowEmailOn ? (
                    /* ——— Simple flow (Email): one message (follow + email) → user email → success → primary DM ——— */
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                          <p className="text-sm whitespace-pre-line">
                            {config.simpleFlowMessage || "Follow me to get the guide 👇 Reply with your email and I'll send it! 📧"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                          <p className="text-sm">john@example.com</p>
                        </div>
                      </div>
                      {config.emailSuccessMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                            <p className="text-sm whitespace-pre-line">{config.emailSuccessMessage}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm overflow-hidden">
                          {config.dmType === 'card' && config.dmCardImageUrl ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                              <div className="aspect-video bg-gray-300">
                                <img src={config.dmCardImageUrl} alt="Card" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <div className="px-3 py-2">
                                <p className="text-sm font-semibold">{config.dmCardTitle || 'Card title'}</p>
                                {config.dmCardSubtitle && <p className="text-xs text-gray-600 mt-0.5">{config.dmCardSubtitle}</p>}
                                {config.dmCardButton?.text && config.dmCardButton?.url && (
                                  <div className="mt-2">
                                    <span className="inline-block text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-1.5 px-3">{config.dmCardButton.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-line px-4 py-2">{sampleDM}</p>
                              {config.dmType === 'text_button' && config.buttons.length > 0 && (
                                <div className="px-4 pb-2 space-y-1">
                                  {config.buttons.filter((b) => b.text.trim() && b.url.trim()).map((button, index) => (
                                    <a key={index} href={button.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3">
                                      {button.text}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ——— Standard Pre-DM: Hi → follow + Follow Me → ✓ Followed → email question → user email → success → primary DM ——— */
                    <>
                      {isLeadMode && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                            <p className="text-sm">Hi! 👋</p>
                          </div>
                        </div>
                      )}

                      {((isLeadMode && config.askToFollow) || config.preDmFlowType === 'followers') && (config.askToFollowMessage || config.preDmFlowType === 'followers') && (
                        <>
                          <div className="flex justify-start">
                            <div className="max-w-[70%] min-w-0 bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2 overflow-hidden">
                              <p className="text-sm whitespace-pre-line break-words">
                                {config.preDmFlowType === 'followers'
                                  ? (config.askToFollowMessage && config.askToFollowMessage.includes("✅ Once you've followed")
                                      ? config.askToFollowMessage
                                      : `${config.askToFollowMessage || "Hey! Would you mind following me? I share great content! 🙌"}\n\n✅ Once you've followed, type 'done' or 'followed' to continue!\n🔗 Visit my profile: https://www.instagram.com/${accountUsername}\nClick one of the options below:`)
                                  : config.askToFollowMessage}
                              </p>
                              {config.preDmFlowType !== 'followers' && (
                                <p className="mt-1 text-xs text-blue-600 break-all">🔗 https://instagram.com/{accountUsername}</p>
                              )}
                              <div className="mt-2 flex gap-2">
                                {config.preDmFlowType === 'followers' ? (
                                  <>
                                    <button className="flex-1 text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-2">I&apos;m following</button>
                                    <button className="flex-1 text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-2">Follow Me 👆</button>
                                  </>
                                ) : (
                                  <button className="w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3">Follow Me 👆</button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                              <p className="text-sm">✓ Followed</p>
                            </div>
                          </div>
                        </>
                      )}

                      {isLeadMode && config.askForEmail && config.askForEmailMessage && (
                        <>
                          <div className="flex justify-start">
                            <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                              <p className="text-sm">{config.askForEmailMessage}</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                              <p className="text-sm">john@example.com</p>
                            </div>
                          </div>
                        </>
                      )}

                      {isLeadMode && config.askForEmail && config.emailSuccessMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2">
                            <p className="text-sm whitespace-pre-line">{config.emailSuccessMessage}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm overflow-hidden">
                          {config.dmType === 'card' && config.dmCardImageUrl ? (
                            <div className="rounded-2xl overflow-hidden border border-gray-200">
                              <div className="aspect-video bg-gray-300">
                                <img src={config.dmCardImageUrl} alt="Card" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <div className="px-3 py-2">
                                <p className="text-sm font-semibold">{config.dmCardTitle || 'Card title'}</p>
                                {config.dmCardSubtitle && <p className="text-xs text-gray-600 mt-0.5">{config.dmCardSubtitle}</p>}
                                {config.dmCardButton?.text && config.dmCardButton?.url && (
                                  <div className="mt-2">
                                    <span className="inline-block text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-1.5 px-3">{config.dmCardButton.text}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-line px-4 py-2">{sampleDM}</p>
                              {config.dmType === 'text_button' && config.buttons.length > 0 && (
                                <div className="px-4 pb-2 space-y-1">
                                  {config.buttons.filter((b) => b.text.trim() && b.url.trim()).map((button, index) => (
                                    <a key={index} href={button.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-xs font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg py-2 px-3">
                                      {button.text}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
