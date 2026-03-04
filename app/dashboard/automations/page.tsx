'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useSubscription } from '@/hooks/useSubscription';
import { TableSkeleton } from '@/components/Skeleton';
import { mutate } from 'swr';
import AutomationSetupModal from '@/components/AutomationSetupModal';
import AutomationDrawer from '@/components/AutomationDrawer';
import MessagesView from '@/components/MessagesView';
import { get, post, put, del } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';

interface InstagramAccountResponse {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string | null;
}

interface MediaItem {
  id: string;
  media_type: string; // IMAGE, VIDEO, CAROUSEL_ALBUM
  media_product_type?: string; // FEED, REELS, STORY, etc.
  caption: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  // Optional DM‑rule specific fields (used when viewing DM automations)
  rule_id?: number;
  trigger_type?: string;
  is_active?: boolean;
  type?: string;
}

interface AutomationRuleResponse {
  id: number;
  instagram_account_id: number;
  name: string | null;
  trigger_type: string;
  action_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
  media_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface MediaAnalytics {
  media_id: string;
  rule_id: number | null;
  rule_name: string | null;
  is_active: boolean;
  triggers: number;  // RUNS
  dms_sent: number;
  leads_collected: number;
  total_clicks: number;
  follow_button_clicks: number;
  profile_visits: number;
  im_following_clicks: number;
  comment_replies: number;
  last_modified: string | null;
}

// Plan limits configuration
const PLAN_LIMITS: Record<string, { accounts: number; rules: number; dms: number }> = {
  free: { accounts: 1, rules: -1, dms: 1000 }, // High Volume pricing: unlimited rules, 1000 DMs
  basic: { accounts: 3, rules: 10, dms: 500 },
  pro: { accounts: 10, rules: 50, dms: 5000 },
  enterprise: { accounts: -1, rules: -1, dms: -1 }, // unlimited
};

export default function AutomationsPage() {
  const { session } = useAuth();
  const toast = useToast();
  const { data: accounts, isLoading: accountsLoading, mutate: refreshAccounts } = useFetch<InstagramAccountResponse[]>('/users/me/accounts');
  
  // Refresh accounts when page becomes visible (in case a new account was connected)
  useEffect(() => {
    // Refresh accounts on mount and when window regains focus (user might have connected account in another tab)
    const handleFocus = () => {
      refreshAccounts();
    };
    window.addEventListener('focus', handleFocus);
    // Also refresh on mount
    refreshAccounts();
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAccounts]);
  
  // Use subscription hook with caching to prevent pro users from appearing as free on refresh
  const { data: subscriptionData, hasProPlan, planTier: subscriptionPlanTier } = useSubscription();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedAccountUsername, setSelectedAccountUsername] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'posts' | 'stories' | 'dms' | 'live'>('posts');
  const [loadMoreMedia, setLoadMoreMedia] = useState<MediaItem[]>([]);
  const [loadMoreNextCursor, setLoadMoreNextCursor] = useState<string | null>(null);
  const [loadMoreHasMore, setLoadMoreHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setIsLoadingDMs] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table view
  const [deleteConfirmRuleId, setDeleteConfirmRuleId] = useState<number | null>(null);
  
  // PERFORMANCE: useFetch so we get localStorage cache and show stats immediately on refresh
  const { data: allRulesData } = useFetch<AutomationRuleResponse[]>('/automation/rules', {
    // Short dedupe so rules list reflects changes quickly
    dedupingInterval: 15_000,
    refreshInterval: 15_000,
  });
  const { data: mediaAnalyticsData, isLoading: isLoadingAnalytics } = useFetch<MediaAnalytics[]>(
    selectedAccount ? `/api/analytics/media?days=30&instagram_account_id=${selectedAccount}` : null,
    {
      // Media analytics should feel live while user is tuning automations
      dedupingInterval: 15_000,
      refreshInterval: 15_000,
    }
  );
  
  const automationRules = useMemo(() => {
    if (!allRulesData || !selectedAccount) return {};
    const rulesByMedia: Record<string, AutomationRuleResponse[]> = {};
    allRulesData.forEach((rule: AutomationRuleResponse) => {
      if (rule.media_id && rule.instagram_account_id === selectedAccount) {
        if (!rulesByMedia[rule.media_id]) rulesByMedia[rule.media_id] = [];
        rulesByMedia[rule.media_id].push(rule);
      }
    });
    return rulesByMedia;
  }, [allRulesData, selectedAccount]);
  
  const mediaAnalytics = mediaAnalyticsData ?? [];
  
  // PERFORMANCE: useFetch for first page of media (like Analytics) - cached by SWR + localStorage for instant show on revisit
  const mediaTypeParam = selectedTab === 'stories' ? 'stories' : selectedTab === 'live' ? 'live' : 'posts';
  const initialMediaUrl = selectedAccount && (selectedTab === 'posts' || selectedTab === 'stories' || selectedTab === 'live')
    ? `/api/instagram/media?account_id=${selectedAccount}&media_type=${mediaTypeParam}&limit=20`
    : null;
  const { data: initialMediaData, isLoading: isLoadingInitialMedia, mutate: mutateInitialMedia } = useFetch<{
    media: MediaItem[];
    next_cursor?: string | null;
    has_more?: boolean;
  }>(initialMediaUrl, {
    // Keep media list reasonably fresh without hammering API
    dedupingInterval: 30_000,
  });

  // Base (first page) media filtered by tab; full media = base + load-more
  const baseMedia = useMemo(() => {
    const raw = initialMediaData?.media ?? [];
    if (selectedTab === 'stories') return raw.filter((item: MediaItem) => item.media_product_type === 'STORY');
    if (selectedTab === 'posts') return raw.filter((item: MediaItem) => item.media_product_type !== 'STORY');
    return raw;
  }, [initialMediaData?.media, selectedTab]);
  const media = useMemo(() => [...baseMedia, ...loadMoreMedia], [baseMedia, loadMoreMedia]);
  const mediaNextCursorValue = loadMoreMedia.length > 0 ? loadMoreNextCursor : (initialMediaData?.next_cursor ?? null);
  const mediaHasMoreValue = loadMoreMedia.length > 0 ? loadMoreHasMore : Boolean(initialMediaData?.has_more);

  // Clear load-more when account or tab changes (new first page from useFetch)
  useEffect(() => {
    setLoadMoreMedia([]);
    setLoadMoreNextCursor(null);
    setLoadMoreHasMore(false);
  }, [selectedAccount, selectedTab]);

  // OPTIMIZED: Memoize fetchDMs function
  // Use subscription hook's computed values (already handles caching and fallbacks)
  const planTier = subscriptionPlanTier;
  const rulesLimit = PLAN_LIMITS[planTier]?.rules ?? -1;
  const currentRulesCount = subscriptionData?.usage?.rules ?? 0;
  // -1 means unlimited, so never reached
  const hasReachedRulesLimit = subscriptionData ? (rulesLimit !== -1 && currentRulesCount >= rulesLimit) : false;

  // Load more: fetch next page and append to loadMoreMedia (first page comes from useFetch)
  const fetchMediaLoadMore = useCallback(async () => {
    if (!selectedAccount || !mediaNextCursorValue || !session?.access_token) return;
    const mediaType = selectedTab === 'stories' ? 'stories' : selectedTab === 'live' ? 'live' : 'posts';
    const url = `/api/instagram/media?account_id=${selectedAccount}&media_type=${mediaType}&limit=20&after=${encodeURIComponent(mediaNextCursorValue)}`;
    setIsLoadingMore(true);
    try {
      const data = await get<{ media: MediaItem[]; next_cursor?: string | null; has_more?: boolean }>(url);
      let fetched = data.media || [];
      if (selectedTab === 'stories') fetched = fetched.filter((item: MediaItem) => item.media_product_type === 'STORY');
      else if (selectedTab === 'posts') fetched = fetched.filter((item: MediaItem) => item.media_product_type !== 'STORY');
      setLoadMoreMedia((prev) => [...prev, ...fetched]);
      setLoadMoreNextCursor(data.next_cursor ?? null);
      setLoadMoreHasMore(Boolean(data.has_more));
    } catch (err: unknown) {
      console.error('Error loading more media:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedAccount, selectedTab, mediaNextCursorValue, session?.access_token]);

  // Refetch first page after save (like Analytics revalidate)
  const refetchMedia = useCallback(() => {
    mutateInitialMedia(undefined, { revalidate: true });
    setLoadMoreMedia([]);
    setLoadMoreNextCursor(null);
    setLoadMoreHasMore(false);
  }, [mutateInitialMedia]);

  // Wrapper for callers: Load more uses fetchMediaLoadMore; refetch uses refetchMedia (like Analytics mutate)
  const fetchMedia = useCallback(async (opts?: { after?: string | null }) => {
    if (opts?.after) {
      await fetchMediaLoadMore();
      return undefined;
    }
    refetchMedia();
    return undefined;
  }, [fetchMediaLoadMore, refetchMedia]);

  // OPTIMIZED: Memoize fetchDMs function
  const fetchDMs = useCallback(async () => {
    if (!selectedAccount) return;

    // CRITICAL: Wait for session token before making API call
    if (!session?.access_token) {
      console.warn('[AutomationsPage] No session token available, skipping fetchDMs');
      return;
    }

    setIsLoadingDMs(true);
    try {
      // Fetch DM automation rules (rules with trigger_type 'new_message' or 'keyword' and no media_id)
      const allRules = await get<AutomationRuleResponse[]>('/automation/rules');
      console.log('All rules fetched:', allRules);
      
      // Filter for DM automation rules (new_message or keyword triggers without media_id)
      const dmRules = allRules.filter((rule: AutomationRuleResponse) => 
        rule.instagram_account_id === selectedAccount &&
        (rule.trigger_type === 'new_message' || rule.trigger_type === 'keyword') &&
        !rule.media_id && // DM rules don't have media_id
        rule.is_active
      );
      
      console.log('DM automation rules:', dmRules);
      // DM tab uses MessagesView; no local media state needed
    } catch (error: unknown) {
      console.error('Error fetching DM rules:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch DM automation rules. Please try again.');
    } finally {
      setIsLoadingDMs(false);
    }
  }, [selectedAccount, session?.access_token]);

  // OPTIMIZED: Memoize handler to prevent recreation
  const handleSetupAutomation = useCallback((mediaItem: MediaItem) => {
    setSelectedMedia(mediaItem);
    setShowDrawer(true);
  }, []);

  // OPTIMIZED: Memoize table view data processing (must be at top level, not conditional)
  const tableViewData = useMemo(() => {
    // Create analytics map
    const analyticsMap = new Map<string, MediaAnalytics>();
    mediaAnalytics.forEach(a => analyticsMap.set(a.media_id, a));
    
    // Filter media by selected tab
    const filteredMedia = media.filter((item) => {
      if (selectedTab === 'posts') {
        return item.media_product_type !== 'STORY';
      } else if (selectedTab === 'stories') {
        return item.media_product_type === 'STORY';
      } else if (selectedTab === 'live') {
        return true;
      }
      return false;
    });
    
    // Get rules for each media item
    const mediaWithRules = filteredMedia.map((item) => {
      const rules = automationRules[item.id] || [];
      const activeRule = rules.find((r) => r.is_active) || rules[0];
      const analytics = analyticsMap.get(item.id);
      return { mediaItem: item, rule: activeRule, analytics };
    });
    
    // Separate items with rules and without rules
    const itemsWithRules = mediaWithRules.filter((item) => item.rule);
    const itemsWithoutRules = mediaWithRules.filter((item) => !item.rule);
    
    // Show items with rules first, then items without rules
    return [...itemsWithRules, ...itemsWithoutRules];
  }, [mediaAnalytics, media, selectedTab, automationRules]);

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setSelectedMedia(null);
  };

  const handleCloseModal = () => {
    setShowSetupModal(false);
    setSelectedMedia(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveAutomation = async (config: Record<string, unknown>) => {
    if (!selectedAccount || !selectedMedia) return;
    
    // CRITICAL: Wait for session token before making API call
    if (!session?.access_token) {
      console.warn('[AutomationsPage] No session token available, cannot save automation');
      alert('Session expired. Please refresh the page and try again.');
      return;
    }

    // Convert config to API format
    // Determine which mode's data to use for shared fields based on isLeadCapture
    const isLeadCaptureMode = !!config.isLeadCapture;

    const activeKeywordsForShared = isLeadCaptureMode 
      ? (config.leadKeywords && config.leadKeywords.length > 0 ? config.leadKeywords : config.keywords)
      : (config.simpleKeywords && config.simpleKeywords.length > 0 ? config.simpleKeywords : config.keywords);
    
    const activeCommentRepliesForShared = isLeadCaptureMode
      ? (config.leadCommentReplies && config.leadCommentReplies.length > 0 ? config.leadCommentReplies : config.commentReplies)
      : (config.simpleCommentReplies && config.simpleCommentReplies.length > 0 ? config.simpleCommentReplies : config.commentReplies);
    
    const activeDmMessagesForShared = isLeadCaptureMode
      ? (config.leadDmMessages && config.leadDmMessages.length > 0 ? config.leadDmMessages : config.dmMessages)
      : (config.simpleDmMessages && config.simpleDmMessages.length > 0 ? config.simpleDmMessages : config.dmMessages);

    const ruleConfig: Record<string, unknown> = {
      // active (currently selected) flow - use mode-specific data if available, otherwise fallback to shared
      keywords: (activeKeywordsForShared || []).filter((k: string) => k.trim().length > 0),
      auto_reply_to_comments: !!config.autoReplyToComments,
      comment_replies: (activeCommentRepliesForShared || []).filter((r: string) => r.trim().length > 0),
      message_variations: (activeDmMessagesForShared || []).filter((m: string) => m.trim().length > 0),
      dmType: config.dmType,
      delay_minutes: config.delayMinutes,
      media_id: selectedMedia.media_product_type === 'DM' ? null : selectedMedia.id,
      // persist per-flow settings so the builder can restore them
      simple_keywords: (config.simpleKeywords || []).filter((k: string) => k.trim().length > 0),
      lead_keywords: (config.leadKeywords || []).filter((k: string) => k.trim().length > 0),
      simple_comment_replies: (config.simpleCommentReplies || []).filter((r: string) => r.trim().length > 0),
      lead_comment_replies: (config.leadCommentReplies || []).filter((r: string) => r.trim().length > 0),
      simple_dm_messages: (config.simpleDmMessages || []).filter((m: string) => m.trim().length > 0),
      lead_dm_messages: (config.leadDmMessages || []).filter((m: string) => m.trim().length > 0),
      // per-flow toggle states: exactly one mode owns the public comment replies
      // If isLeadCapture is true → Lead Capture owns it; otherwise Simple Reply owns it.
      simple_auto_reply_to_comments:
        isLeadCaptureMode ? false : !!config.simpleAutoReplyToComments,
      lead_auto_reply_to_comments:
        isLeadCaptureMode ? !!config.leadAutoReplyToComments : false,
    };

    // Add pre-DM actions (Simplified MVP: Single toggle)
    // IMPORTANT: Back-end pre-DM/lead-capture flows must ONLY run when the user
    // has selected Lead Capture in the UI. When saving from Simple Reply,
    // we explicitly clear these flags so the rule behaves as a pure simple reply.
    // NEW: Use enable_pre_dm_engagement if set, otherwise fallback to old checkboxes (backward compatibility)
    if (isLeadCaptureMode && config.enablePreDmEngagement !== undefined) {
      // New simplified mode: single toggle controls both
      ruleConfig.enable_pre_dm_engagement = config.enablePreDmEngagement;
      ruleConfig.ask_to_follow = config.enablePreDmEngagement;
      ruleConfig.ask_for_email = config.enablePreDmEngagement;
      ruleConfig.ask_to_follow_message = config.askToFollowMessage || '';
      ruleConfig.follow_recheck_message = config.followRecheckMessage || '';
      ruleConfig.follow_no_exit_message = config.followNoExitMessage || '';
      ruleConfig.ask_for_email_message = config.askForEmailMessage || '';
      ruleConfig.lead_magnet_link = config.leadMagnetLink || '';
      ruleConfig.email_retry_message = config.emailRetryMessage || '';
      // Map preDmFlowType to backend fields (default to 'email' if not set)
      const preDmFlowType = config.preDmFlowType || (
        config.simpleDmFlow ? 'email' :
        config.simpleDmFlowPhone ? 'phone' :
        (config.enablePreDmEngagement || config.askToFollow) ? 'followers' :
        'email'
      );
      // Simple flow: one message + re-ask email until valid (Lead Capture)
      ruleConfig.simple_dm_flow = preDmFlowType === 'email';
      ruleConfig.simple_flow_message = (config.simpleFlowMessage || '').trim() || '';
      ruleConfig.simple_flow_email_question = (config.simpleFlowEmailQuestion || '').trim() || '';
      // Simple flow (Phone): follow + phone, re-ask until valid
      ruleConfig.simple_dm_flow_phone = preDmFlowType === 'phone';
      // Followers flow: enable pre-DM engagement, follow only (no email)
      ruleConfig.enable_pre_dm_engagement = preDmFlowType === 'followers';
      ruleConfig.ask_to_follow = preDmFlowType === 'followers';
      // Email/Phone/Followers: ensure backend runs pre-DM first
      if (preDmFlowType === 'email') {
        ruleConfig.ask_to_follow = true;
        ruleConfig.ask_for_email = true;
      } else if (preDmFlowType === 'phone') {
        ruleConfig.ask_to_follow = true;
        ruleConfig.ask_for_email = false;
      } else if (preDmFlowType === 'followers') {
        ruleConfig.ask_to_follow = true;
        ruleConfig.ask_for_email = false;  // Followers-only: first question (follow) then primary DM
        // Field stores full message (matches Live Preview); backend expects base only (it appends instructions)
        const fullMsg = (config.askToFollowMessage || '').trim();
        const marker = "✅ Once you've followed";
        const idx = fullMsg.indexOf(marker);
        ruleConfig.ask_to_follow_message = idx >= 0 ? fullMsg.substring(0, idx).trim() : fullMsg;
      }
      ruleConfig.simple_flow_phone_message = (config.simpleFlowPhoneMessage || '').trim() || '';
      ruleConfig.simple_flow_phone_question = (config.simpleFlowPhoneQuestion || '').trim() || '';
      ruleConfig.phone_invalid_retry_message = (config.phoneInvalidRetryMessage || '').trim() || '';
    } else if (isLeadCaptureMode) {
      // Backward compatibility: use old individual checkboxes, or simple flow flags so pre-DM runs first
      if (config.askToFollow !== undefined) {
        ruleConfig.ask_to_follow = config.askToFollow;
        ruleConfig.ask_to_follow_message = config.askToFollowMessage || '';
      }
      if (config.askForEmail !== undefined) {
        ruleConfig.ask_for_email = config.askForEmail;
        ruleConfig.ask_for_email_message = config.askForEmailMessage || '';
        ruleConfig.lead_magnet_link = config.leadMagnetLink || '';
        ruleConfig.email_retry_message = config.emailRetryMessage || '';
      }
      // If Email/Phone flow is set (simpleDmFlow/simpleDmFlowPhone), ensure backend runs pre-DM
      if (config.simpleDmFlow) {
        ruleConfig.simple_dm_flow = true;
        ruleConfig.simple_dm_flow_phone = false;
        ruleConfig.ask_to_follow = true;
        ruleConfig.ask_for_email = true;
        ruleConfig.simple_flow_message = (config.simpleFlowMessage || '').trim() || '';
        ruleConfig.simple_flow_email_question = (config.simpleFlowEmailQuestion || '').trim() || '';
      } else if (config.simpleDmFlowPhone) {
        ruleConfig.simple_dm_flow = false;
        ruleConfig.simple_dm_flow_phone = true;
        ruleConfig.ask_to_follow = true;
        ruleConfig.ask_for_email = false;
        ruleConfig.simple_flow_phone_message = (config.simpleFlowPhoneMessage || '').trim() || '';
        ruleConfig.simple_flow_phone_question = (config.simpleFlowPhoneQuestion || '').trim() || '';
        ruleConfig.phone_invalid_retry_message = (config.phoneInvalidRetryMessage || '').trim() || '';
      }
    } else {
      // Simple Reply mode: force all pre-DM / lead-capture flags off so backend
      // treats this as a direct primary DM with no pre-DM sequence.
      ruleConfig.enable_pre_dm_engagement = false;
      ruleConfig.ask_to_follow = false;
      ruleConfig.ask_for_email = false;
      ruleConfig.simple_dm_flow = false;
      ruleConfig.simple_dm_flow_phone = false;
      // Keep message templates persisted for future Lead Capture editing,
      // but they won't be used while isLeadCapture is false.
    }
    
    // Always save email_success_message if it's configured (even if askForEmail is disabled)
    // This ensures it persists even when toggling askForEmail on/off or when editing from Edit Rule page
    if (config.emailSuccessMessage !== undefined && config.emailSuccessMessage !== null) {
      ruleConfig.email_success_message = config.emailSuccessMessage.trim() || '';
    }

    // Persist DM type (text or text_button only)
    if (config.dmType === 'text' || config.dmType === 'text_button') {
      ruleConfig.dm_type = config.dmType;
    }

    if (config.dmType === 'text_button') {
      ruleConfig.buttons = config.buttons.filter(
        (b: { text: string; url: string }) => b.text.trim() && b.url.trim(),
      );
    }

    // Mark rule as lead_capture for UX (used by builder + edit screens)
    // IMPORTANT: Let the drawer's selected DM Type (Simple Reply vs Lead Capture)
    // be the single source of truth via config.isLeadCapture, instead of
    // inferring from pre‑DM flags. This ensures that when a user saves from the
    // Simple Reply tab, the rule always re-opens as Simple Reply.
    const isStory = selectedMedia.media_product_type === 'STORY';
    ruleConfig.is_lead_capture = !isStory && !!config.isLeadCapture;

    // Determine trigger type
    const triggerType = config.keywords.length > 0 ? 'keyword' : 'post_comment';
    // For DM automation, trigger handling is managed in fetchDMs

    // Check if rule already exists for this media
    const existingRule = automationRules[selectedMedia.id]?.[0];

    try {
      if (existingRule) {
        // Update existing rule
        await put(`/automation/rules/${existingRule.id}`, {
          config: ruleConfig,
        });
      } else {
        // Create new rule
        const ruleName = selectedMedia.media_product_type === 'STORY'
          ? 'Automation for Story'
          : selectedMedia.media_type === 'VIDEO' || selectedMedia.media_product_type === 'REELS'
          ? 'Automation for Reel'
          : 'Automation for Post';

        await post('/automation/rules', {
          instagram_account_id: selectedAccount,
          name: ruleName,
          trigger_type: triggerType,
          action_type: 'send_dm',
          config: ruleConfig,
        });
      }

      // Refresh data immediately
      if (selectedTab === 'dms') {
        fetchDMs();
      } else {
        fetchMedia();
      }
      // Refresh rules so useFetch data updates (automationRules is derived from it)
      mutate('/automation/rules');
      handleCloseDrawer();
    } catch (error: unknown) {
      console.error('Failed to save automation:', error);
      throw new Error((error as Error)?.message || 'Failed to save automation');
    }
  };

  const handleAutomationCreated = () => {
    // Refresh based on current tab
    if (selectedTab === 'dms') {
      fetchDMs();
    } else {
      fetchMedia();
    }
    handleCloseModal();
    // Refresh rules list
    mutate('/automation/rules');
  };

  // Auto-select first account if available (or if accounts list changed)
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      // If no account selected, or selected account is no longer in the list, select first account
      const selectedAccountExists = selectedAccount && accounts.some((a) => a.id === selectedAccount);
      if (!selectedAccount || !selectedAccountExists) {
        const firstAccount = accounts[0];
        setSelectedAccount(firstAccount.id);
        setSelectedAccountUsername(firstAccount.username);
      }
    }
  }, [accounts, selectedAccount]);

  // Update username when account changes
  useEffect(() => {
    if (accounts && selectedAccount) {
      const account = accounts.find((a) => a.id === selectedAccount);
      if (account) {
        setSelectedAccountUsername(account.username);
      }
    }
  }, [accounts, selectedAccount]);

  return (
    <div className="w-full mx-auto overflow-x-hidden">
      {/* Hero Banner - compact like competitor */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-xl mb-6 shadow-lg w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative py-4 md:py-5 px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Automations</h1>
          <p className="text-sm text-white/90">Jump right in and automate your Instagram</p>
        </div>
      </div>

      {/* Account Selection */}
      {accountsLoading ? (
        <div className="mb-4">
          <div className="h-10 bg-gray-200 animate-pulse rounded-lg w-56"></div>
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="mb-4">
          <label htmlFor="account-select" className="block text-sm font-semibold text-gray-900 mb-1.5">
            Instagram Account
          </label>
          <select
            id="account-select"
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(Number(e.target.value))}
            className="block w-full max-w-xs md:w-56 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-sm transition-colors hover:border-gray-400"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.username}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-yellow-800">
            No Instagram accounts connected. Please{' '}
            <a href="/dashboard/accounts/connect" className="text-blue-600 underline font-bold hover:text-blue-800">
              connect an account
            </a>{' '}
            first.
          </p>
        </div>
      )}

      {/* Content Type Tabs */}
      <div className="mb-4 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-2 md:space-x-6 min-w-max md:min-w-0">
          <button
            onClick={() => setSelectedTab('posts')}
            className={`py-2.5 md:py-3 px-1 border-b-2 font-semibold text-xs md:text-sm transition-colors whitespace-nowrap ${
              selectedTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Posts/Reels
          </button>
          <button
            onClick={() => {
              if (!hasProPlan) {
                setShowUpgradeModal(true);
              } else {
                setSelectedTab('stories');
              }
            }}
            disabled={!hasProPlan}
            className={`py-2.5 md:py-3 px-1 border-b-2 font-semibold text-xs md:text-sm relative transition-colors whitespace-nowrap ${
              selectedTab === 'stories'
                ? 'border-blue-500 text-blue-600'
                : !hasProPlan
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title={!hasProPlan ? 'Upgrade to Pro to unlock Stories automation' : ''}
          >
            Stories
            {!hasProPlan && (
              <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">PRO</span>
            )}
          </button>
          <button
            onClick={() => {
              if (!hasProPlan) {
                setShowUpgradeModal(true);
              } else {
                setSelectedTab('dms');
              }
            }}
            disabled={!hasProPlan}
            className={`py-2.5 md:py-3 px-1 border-b-2 font-semibold text-xs md:text-sm relative transition-colors whitespace-nowrap ${
              selectedTab === 'dms'
                ? 'border-blue-500 text-blue-600'
                : !hasProPlan
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title={!hasProPlan ? 'Upgrade to Pro to unlock DMs automation' : ''}
          >
            DMs
            {!hasProPlan && (
              <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">PRO</span>
            )}
          </button>
          <button
            onClick={() => {
              // IG Live is in private beta – show info toast and keep tab inactive
              toast.info('IG Live Automation is currently in private beta. Check back soon!', 4000);
            }}
            className={`py-2.5 md:py-3 px-1 border-b-2 font-semibold text-xs md:text-sm relative transition-colors border-transparent text-gray-400 cursor-not-allowed whitespace-nowrap`}
            title="IG Live Automation is currently in private beta. Check back soon!"
          >
            IG Live
            <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
              SOON
            </span>
          </button>
        </nav>
      </div>

      {/* View Toggle and Stats Summary - Only for posts/stories/live tabs */}
      {selectedAccount && (selectedTab === 'posts' || selectedTab === 'stories' || selectedTab === 'live') && (
        <div className="mb-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-blue-400'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-blue-400'
                }`}
              >
                Grid View
              </button>
            </div>
          </div>

          {/* Summary Stats Cards - Show aggregated stats across ALL automations for the account */}
          {(() => {
            // Always show stats cards, even if loading or empty (show 0)
            // Aggregate across ALL media analytics for the selected account, not filtered by tab
            const totalDmsSent = mediaAnalytics.reduce((sum, m) => sum + (m.dms_sent || 0), 0);
            const totalLeadsGenerated = mediaAnalytics.reduce((sum, m) => sum + (m.leads_collected || 0), 0);
            const totalFollowersGained = mediaAnalytics.reduce((sum, m) => sum + (m.follow_button_clicks || 0) + (m.im_following_clicks || 0), 0);
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm p-3 md:p-4 hover:shadow transition-all duration-200">
                  <div className="text-xs font-semibold text-blue-700 mb-0.5">DMs Sent</div>
                  <div className="text-xl md:text-2xl font-bold text-blue-900">
                    {isLoadingAnalytics ? '...' : totalDmsSent}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 shadow-sm p-3 md:p-4 hover:shadow transition-all duration-200">
                  <div className="text-xs font-semibold text-green-700 mb-0.5">Leads Generated</div>
                  <div className="text-xl md:text-2xl font-bold text-green-900">
                    {isLoadingAnalytics ? '...' : totalLeadsGenerated}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200 shadow-sm p-3 md:p-4 hover:shadow transition-all duration-200" title="Increases when users click &quot;Follow Me&quot; or &quot;I&#39;m following&quot; in your DM flow">
                  <div className="text-xs font-semibold text-purple-700 mb-0.5">Followers Gained via AutoDM</div>
                  <div className="text-xl md:text-2xl font-bold text-purple-900">
                    {isLoadingAnalytics ? '...' : totalFollowersGained}
                  </div>
                  <div className="text-xs font-medium text-purple-600 mt-1">Follow / I&apos;m following button clicks</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Content Display - Show immediately, don't block on loading */}
      {selectedAccount ? (
        // CRITICAL FIX: Check for DMs tab FIRST before checking media length
        // This ensures MessagesView is rendered instead of the empty state
        selectedTab === 'dms' ? (
          // Messages View - Always show this for DMs tab, regardless of media length
          selectedAccount ? (
            <MessagesView accountId={selectedAccount} />
          ) : (
            <div className="bg-white rounded-lg shadow text-center py-12 px-6">
              <p className="text-gray-500">Please select an Instagram account to view messages</p>
            </div>
          )
        ) : (
          <>
            {/* Show loading skeleton only if no media at all */}
            {isLoadingInitialMedia && media.length === 0 && (
              <TableSkeleton rows={6} columns={3} />
            )}
            {/* Show content immediately if we have media, even if still loading more */}
            {media.length > 0 && viewMode === 'table' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow overflow-hidden w-full">
                <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">AUTOMATIONS</h3>
                </div>
                {/* Show content immediately - don't block on analytics loading */}
                {tableViewData.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No media found for this account.</p>
                    <p className="text-sm text-gray-400 mt-2">Posts, reels, and stories will appear here once they&apos;re fetched.</p>
                  </div>
                ) : (
                <>
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="w-full text-center">Automation</div>
                        </th>
                        <th
                          className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell"
                          title="Increases when users click &quot;Follow Me&quot; / &quot;I&#39;m following&quot; in DMs"
                        >
                          <div className="w-full text-center">NEW FOLLOWERS</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                          <div className="w-full text-center">RUNS</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                          <div className="w-full text-center">CLICKS</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                          <div className="w-full text-center">STATUS</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="w-full text-center">LAST MODIFIED</div>
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="w-full text-center">Action</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableViewData.map(({ mediaItem, rule, analytics }) => {
                        const imageUrl = mediaItem.media_type === 'VIDEO'
                          ? mediaItem.thumbnail_url || mediaItem.media_url
                          : mediaItem.media_url || mediaItem.thumbnail_url;
                        
                        return (
                      <tr
                        key={mediaItem.id}
                        className="transition-colors duration-150 hover:bg-blue-50/50"
                      >
                            <td
                              className={`px-4 py-3 whitespace-nowrap ${
                                !rule && hasReachedRulesLimit
                                  ? 'opacity-60 cursor-not-allowed'
                                  : 'cursor-pointer'
                              }`}
                              onClick={() => {
                                // Only allow creating new rules if limit not reached, or if editing existing rule
                                if (!rule && hasReachedRulesLimit) {
                                  alert(
                                    `You've reached your automation rules limit (${currentRulesCount}/${rulesLimit}). Upgrade to Pro to create more automation rules.`,
                                  );
                                  return;
                                }
                                handleSetupAutomation(mediaItem);
                              }}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {imageUrl ? (
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                      src={imageUrl}
                                      alt={rule?.name || mediaItem.caption || 'Media'}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border border-gray-200">
                                      <span className="text-gray-400 text-sm">📷</span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {rule
                                      ? (rule.name || mediaItem.caption?.substring(0, 30) || `Automation ${rule.id}`)
                                      : (mediaItem.caption?.substring(0, 30) || 
                                          (mediaItem.media_product_type === 'REELS' ? 'Reel Automation' :
                                           mediaItem.media_product_type === 'STORY' ? 'Story Automation' :
                                           'Post Automation'))}
                                    {mediaItem.caption && mediaItem.caption.length > 30 && '...'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-500">
                                    {mediaItem.media_product_type === 'REELS' && 'Reel'}
                                    {mediaItem.media_product_type === 'STORY' && 'Story'}
                                    {!mediaItem.media_product_type && 'Post'}
                                  </div>
                                  {/* Mobile-only meta so important columns are visible without horizontal scroll */}
                                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 block md:hidden">
                                    {rule?.created_at && (
                                      <div>
                                        <span className="font-semibold text-gray-700">Last:</span>{' '}
                                        {new Date(rule.created_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })}
                                      </div>
                                    )}
                                    {analytics && (
                                      <div>
                                        <span className="font-semibold text-gray-700">Runs:</span>{' '}
                                        {analytics.triggers || 0}
                                        {' · '}
                                        <span className="font-semibold text-gray-700">Clicks:</span>{' '}
                                        {analytics.total_clicks || 0}
                                      </div>
                                    )}
                                    {rule && (
                                      <div>
                                        <span className="font-semibold text-gray-700">Status:</span>{' '}
                                        {rule.is_active ? 'Enabled' : 'Disabled'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                              <span className="text-sm font-semibold text-gray-900">
                                {(analytics?.follow_button_clicks || 0) + (analytics?.im_following_clicks || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                              <span className="text-sm font-semibold text-gray-900">{analytics?.triggers || 0}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                              <span className="text-sm font-semibold text-gray-900">{analytics?.total_clicks || 0}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {rule ? (
                                <span
                                  className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${
                                    rule.is_active
                                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                                  }`}
                                >
                                  {rule.is_active ? 'Enabled' : 'Disabled'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300">
                                  No Rule
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 hidden md:table-cell">
                              {rule?.created_at
                                ? new Date(rule.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : rule ? '-' : 'Not configured'}
                            </td>
                            {/* Actions: Edit & Delete with inline Yes/No confirmation */}
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell">
                              {rule ? (
                                deleteConfirmRuleId === rule.id ? (
                                  <div
                                    className="flex items-center justify-end space-x-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-red-600 text-xs font-semibold">
                                      Delete?
                                    </span>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await del(`/automation/rules/${rule.id}`);

                                          // Refresh rules and subscription (automationRules is derived from useFetch)
                                          void mutate('/automation/rules');
                                          void mutate('/users/subscription');
                                          if (typeof window !== 'undefined') {
                                            try {
                                              localStorage.removeItem('logicdm_subscription_cache');
                                            } catch {
                                              // Ignore
                                            }
                                          }
                                        } catch (error: unknown) {
                                          console.error('Failed to delete automation rule:', error);
                                          alert(
                                            (error as Error)?.message ||
                                              'Failed to delete automation rule. Please try again.',
                                          );
                                        } finally {
                                          setDeleteConfirmRuleId(null);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-300 transition-all duration-200"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmRuleId(null);
                                      }}
                                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-white hover:bg-gray-600 rounded-lg border border-gray-300 transition-all duration-200"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Reuse drawer flow for editing
                                        handleSetupAutomation(mediaItem);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 font-bold hover:scale-105 transition-all duration-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmRuleId(rule.id);
                                      }}
                                      className="text-red-600 hover:text-red-800 font-bold hover:scale-105 transition-all duration-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )
                              ) : (
                                <div className="text-right text-xs text-gray-400 pr-2">
                                  {/* No actions when there is no rule yet */}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {media.length > 0 && mediaHasMoreValue && (selectedTab === 'posts' || selectedTab === 'stories' || selectedTab === 'live') && (
                  <div className="flex justify-center py-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => fetchMedia({ after: mediaNextCursorValue ?? undefined })}
                      disabled={isLoadingMore}
                      className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
                </>
                )}
              </div>
            ) : media.length > 0 && viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...media]
              .sort((a, b) => {
                // Show media with automation rules first (same as table view)
                const aHasRule = (automationRules[a.id]?.length ?? 0) > 0;
                const bHasRule = (automationRules[b.id]?.length ?? 0) > 0;
                if (aHasRule && !bHasRule) return -1;
                if (!aHasRule && bHasRule) return 1;
                return 0;
              })
              .map((item) => {
              // For video stories, prefer thumbnail_url; for images, use media_url
              // If video has no thumbnail, we'll show a placeholder
              const imageUrl = item.media_type === 'VIDEO' 
                ? (item.thumbnail_url || item.media_url)
                : (item.media_url || item.thumbnail_url);
              
              // Check if we should show placeholder for video stories without thumbnail
              const showVideoPlaceholder = item.media_type === 'VIDEO' && !item.thumbnail_url && !item.media_url;
              
              // Get automation rule for this media item
              const mediaRules = automationRules[item.id] || [];
              const activeRule = mediaRules.find((r) => r.is_active);
              const stats = activeRule?.config?.stats || {};
              
              return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border border-gray-200 shadow overflow-hidden relative group transition-all duration-200 ${
                  !activeRule && hasReachedRulesLimit
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
                }`}
                onClick={() => {
                  // Only allow creating new rules if limit not reached, or if editing existing rule
                  if (!activeRule && hasReachedRulesLimit) {
                    alert(`You've reached your automation rules limit (${currentRulesCount}/${rulesLimit}). Upgrade to Pro to create more automation rules.`);
                    return;
                  }
                  handleSetupAutomation(item);
                }}
              >
                {/* Status Pill */}
                {activeRule && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-lg ${
                      activeRule.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                    }`}>
                      {activeRule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                )}
                
                {/* Stats Overlay on Hover */}
                {activeRule && stats.total_triggers > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">{stats.total_leads_captured || 0}</div>
                      <div className="text-sm">Leads Collected</div>
                      <div className="text-xs mt-2 text-gray-300">
                        {stats.total_dms_sent || 0} DMs • {stats.total_comments_replied || 0} Replies
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Preview */}
                <div className="aspect-square bg-gray-200 relative">
                  {!showVideoPlaceholder && imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={item.caption.substring(0, 50) || 'Instagram story'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, hide it and show placeholder below
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show placeholder div
                          const parent = target.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'absolute inset-0 flex items-center justify-center bg-gray-200';
                            placeholder.innerHTML = `
                              <div class="text-center">
                                <div class="text-4xl mb-2">${item.media_type === 'VIDEO' ? '🎥' : '📷'}</div>
                                <div class="text-xs text-gray-500">${item.media_type === 'VIDEO' ? 'Video Story' : 'Photo Story'}</div>
                              </div>
                            `;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                      {/* Show play icon for video stories */}
                      {item.media_type === 'VIDEO' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 pointer-events-none">
                          <div className="bg-white bg-opacity-90 rounded-full p-3">
                            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{item.media_type === 'VIDEO' ? '🎥' : '📷'}</div>
                        <div className="text-xs text-gray-500">
                          {item.media_type === 'VIDEO' ? 'Video Story' : 'Photo Story'}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Show badge based on media_product_type */}
                  {item.media_product_type === 'REELS' && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      REEL
                    </div>
                  )}
                  {item.media_product_type === 'STORY' && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded font-semibold">
                      STORY
                    </div>
                  )}
                  {selectedTab === 'live' && item.media_product_type !== 'STORY' && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Media Info */}
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Posted on: {new Date(item.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {item.caption && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {item.caption.substring(0, 100)}
                      {item.caption.length > 100 && '...'}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>❤️ {item.like_count || 0} likes</span>
                    <span>💬 {item.comments_count || 0} comments</span>
                  </div>

                  {/* Setup Automation Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only allow creating new rules if limit not reached, or if editing existing rule
                      if (!activeRule && hasReachedRulesLimit) {
                        // Show upgrade message
                        alert(`You've reached your automation rules limit (${currentRulesCount}/${rulesLimit}). Upgrade to Pro to create more automation rules.`);
                        return;
                      }
                      handleSetupAutomation(item);
                    }}
                    disabled={!activeRule && hasReachedRulesLimit}
                    className={`w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold transition-all duration-200 hover:scale-105 ${
                      !activeRule && hasReachedRulesLimit
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                    title={!activeRule && hasReachedRulesLimit ? `Automation rules limit reached (${currentRulesCount}/${rulesLimit}). Upgrade to Pro to create more.` : ''}
                  >
                    {activeRule ? 'Edit automation' : 'Setup automation'}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          {media.length > 0 && mediaHasMoreValue && (selectedTab === 'posts' || selectedTab === 'stories' || selectedTab === 'live') && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => fetchMedia({ after: mediaNextCursorValue ?? undefined })}
                disabled={isLoadingMore}
                className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
                </>
              ) : null}
            {/* Show empty state only if not loading and no media */}
            {!isLoadingInitialMedia && media.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow text-center py-12 px-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-4 w-fit mx-auto mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900">
                  {selectedTab === 'posts' && 'No posts/reels found'}
                  {selectedTab === 'stories' && 'No stories found'}
                  {selectedTab === 'live' && 'No live videos found'}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600">
                  {selectedTab === 'posts' && "We couldn't fetch any posts or reels for this account. Please try again later."}
                  {selectedTab === 'stories' && "We couldn't fetch any stories for this account. Stories are only available for 24 hours after posting."}
                  {selectedTab === 'live' && "We couldn't fetch any live videos for this account. Please try again later."}
                </p>
              </div>
            )}
          </>
        )
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow text-center py-12 px-6">
          <p className="text-base font-semibold text-gray-700">Please select an Instagram account to view content.</p>
        </div>
      )}

      {/* Automation Setup Modal (Legacy - for DM automation) */}
      {showSetupModal && selectedMedia && selectedAccount && (
        <AutomationSetupModal
          accountId={selectedAccount}
          accountUsername={selectedAccountUsername}
          media={selectedMedia}
          onClose={handleCloseModal}
          onSuccess={handleAutomationCreated}
        />
      )}

      {/* Automation Drawer (New - for Posts/Reels/Stories) */}
      {showDrawer && selectedMedia && selectedAccount && selectedMedia.media_product_type !== 'DM' && (
        <AutomationDrawer
          isOpen={showDrawer}
          onClose={handleCloseDrawer}
          media={selectedMedia}
          accountUsername={selectedAccountUsername}
          onSave={handleSaveAutomation}
          initialConfig={(() => {
            const existingRule = automationRules[selectedMedia.id]?.[0];
            if (existingRule && existingRule.config) {
              const cfg = existingRule.config;
              // For Stories we never persist is_lead_capture (backend uses it only for posts/reels).
              // Infer "Keyword DM" vs "Default DM" from stored lead_keywords so the correct tab shows when editing.
              const isStoryMedia = selectedMedia.media_product_type === 'STORY';
              const hasLeadKeywords = !!(cfg.lead_keywords && cfg.lead_keywords.length > 0 && cfg.lead_keywords.some((k: string) => k && String(k).trim()));
              const isLead = !!cfg.is_lead_capture || (isStoryMedia && hasLeadKeywords);

              return {
                // active flow values (what the backend currently treats as primary)
                keywords: cfg.keywords || [],
                autoReplyToComments: cfg.auto_reply_to_comments || false,
                // Ensure comment_replies has at least 3 items, filter out empty strings
                commentReplies: (cfg.comment_replies && cfg.comment_replies.length > 0 && cfg.comment_replies.some((r: string) => r.trim())) 
                  ? cfg.comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                  : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'],
                dmType: (cfg.dm_type || cfg.dmType) === 'text_button' ? 'text_button' : 'text',
                // Ensure message_variations has at least 3 items, filter out empty strings
                dmMessages: (cfg.message_variations && cfg.message_variations.length > 0 && cfg.message_variations.some((m: string) => m.trim()))
                  ? cfg.message_variations.filter((m: string) => m.trim()).slice(0, 3)
                  : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'],
                buttons: cfg.buttons || [{ text: 'Click me', url: '' }],
                delayMinutes: cfg.delay_minutes || 0,

                // Per‑flow stored values:
                // If this rule is lead‑capture, treat the \"*_lead\" fields as primary
                // and keep Simple Reply completely empty unless it has its own data.
                // If this rule is simple‑reply, do the opposite.
                simpleKeywords: isLead
                  ? (cfg.simple_keywords || [])
                  : (cfg.simple_keywords || cfg.keywords || []),
                leadKeywords: isLead
                  ? (cfg.lead_keywords || cfg.keywords || [])
                  : (cfg.lead_keywords || []),

                simpleCommentReplies: isLead
                  ? ((cfg.simple_comment_replies && cfg.simple_comment_replies.length > 0 && cfg.simple_comment_replies.some((r: string) => r.trim()))
                      ? cfg.simple_comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                      : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'])
                  : ((cfg.simple_comment_replies && cfg.simple_comment_replies.length > 0 && cfg.simple_comment_replies.some((r: string) => r.trim()))
                      ? cfg.simple_comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                      : ((cfg.comment_replies && cfg.comment_replies.length > 0 && cfg.comment_replies.some((r: string) => r.trim()))
                          ? cfg.comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                          : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!'])),
                leadCommentReplies: isLead
                  ? ((cfg.lead_comment_replies && cfg.lead_comment_replies.length > 0 && cfg.lead_comment_replies.some((r: string) => r.trim()))
                      ? cfg.lead_comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                      : ((cfg.comment_replies && cfg.comment_replies.length > 0 && cfg.comment_replies.some((r: string) => r.trim()))
                          ? cfg.comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                          : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!']))
                  : ((cfg.lead_comment_replies && cfg.lead_comment_replies.length > 0 && cfg.lead_comment_replies.some((r: string) => r.trim()))
                      ? cfg.lead_comment_replies.filter((r: string) => r.trim()).slice(0, 3)
                      : ['Thanks! Please see DMs.', 'Sent you a message! Check it out!', 'Nice! Check your DMs!']),

                simpleDmMessages: isLead
                  ? ((cfg.simple_dm_messages && cfg.simple_dm_messages.length > 0 && cfg.simple_dm_messages.some((m: string) => m.trim()))
                      ? cfg.simple_dm_messages.filter((m: string) => m.trim()).slice(0, 3)
                      : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'])
                  : ((cfg.simple_dm_messages && cfg.simple_dm_messages.length > 0 && cfg.simple_dm_messages.some((m: string) => m.trim()))
                      ? cfg.simple_dm_messages.filter((m: string) => m.trim()).slice(0, 3)
                      : ((cfg.message_variations && cfg.message_variations.length > 0 && cfg.message_variations.some((m: string) => m.trim()))
                          ? cfg.message_variations.filter((m: string) => m.trim()).slice(0, 3)
                          : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.'])),
                leadDmMessages: isLead
                  ? ((cfg.lead_dm_messages && cfg.lead_dm_messages.length > 0 && cfg.lead_dm_messages.some((m: string) => m.trim()))
                      ? cfg.lead_dm_messages.filter((m: string) => m.trim()).slice(0, 3)
                      : ((cfg.message_variations && cfg.message_variations.length > 0 && cfg.message_variations.some((m: string) => m.trim()))
                          ? cfg.message_variations.filter((m: string) => m.trim()).slice(0, 3)
                          : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.']))
                  : ((cfg.lead_dm_messages && cfg.lead_dm_messages.length > 0 && cfg.lead_dm_messages.some((m: string) => m.trim()))
                      ? cfg.lead_dm_messages.filter((m: string) => m.trim()).slice(0, 3)
                      : ['Thanks for your interest! Check out our latest updates.', 'Hey! We have something special for you. Check it out!', 'Awesome! We sent you a message with more details.']),

                // Per‑flow toggle states.
                // For older rules that only have auto_reply_to_comments:
                // - If this is a Lead Capture rule, treat it as belonging to Lead Capture.
                // - If this is a Simple Reply rule, treat it as belonging to Simple Reply.
                simpleAutoReplyToComments: isLead
                  ? (cfg.simple_auto_reply_to_comments ?? false)
                  : (cfg.simple_auto_reply_to_comments ?? cfg.auto_reply_to_comments ?? false),
                leadAutoReplyToComments: isLead
                  ? (cfg.lead_auto_reply_to_comments ?? cfg.auto_reply_to_comments ?? false)
                  : (cfg.lead_auto_reply_to_comments ?? false),
                isLeadCapture: isLead,
                leadCaptureFlow: cfg.lead_capture_flow || [],
                leadCaptureSettings: cfg.lead_capture_settings || {},
                // Pre-DM Actions (Simplified MVP: Single toggle with backward compatibility)
                enablePreDmEngagement: cfg.enable_pre_dm_engagement !== undefined 
                  ? cfg.enable_pre_dm_engagement 
                  : (cfg.ask_to_follow || cfg.ask_for_email || false),
                askToFollow: cfg.ask_to_follow || false, // Backward compatibility
                askToFollowMessage:
                  cfg.ask_to_follow_message ||
                  'Hey! Would you mind following me? I share great content! 🙌',
                followRecheckMessage: cfg.follow_recheck_message || 'Are you followed?',
                followNoExitMessage: cfg.follow_no_exit_message || "No problem! Comment again anytime when you'd like the guide. 📩",
                askForEmail: cfg.ask_for_email || false, // Backward compatibility
                askForEmailMessage:
                  cfg.ask_for_email_message ||
                  "Awesome! 🚀 I have the PDF ready for you.\n\nWhere should I send it? Drop your best email below and I'll fire it over instantly. 👇",
                emailSuccessMessage:
                  cfg.email_success_message ||
                  'Got it! Check your inbox (and maybe spam/promotions) in about 2 minutes. 🎁',
                leadMagnetLink: cfg.lead_magnet_link || '',
                emailRetryMessage:
                  cfg.email_retry_message ||
                  "Hmm, that doesn't look like a valid email address. 🤔\n\nPlease type it again so I can send you the guide! 📧",
                simpleDmFlow: cfg.simple_dm_flow ?? false,
                simpleFlowMessage:
                  cfg.simple_flow_message ||
                  "Follow me to get the guide 👇 Reply with your email and I'll send it! 📧",
                simpleFlowEmailQuestion:
                  cfg.simple_flow_email_question ||
                  "What's your email? Reply here and I'll send you the guide! 📧",
                simpleDmFlowPhone: cfg.simple_dm_flow_phone ?? false,
                simpleFlowPhoneMessage:
                  cfg.simple_flow_phone_message ||
                  "Follow me to get the guide 👇 Reply with your phone number and I'll send it! 📱",
                simpleFlowPhoneQuestion:
                  cfg.simple_flow_phone_question ||
                  "What's your phone number? Reply here and I'll send you the guide! 📱",
                phoneInvalidRetryMessage:
                  cfg.phone_invalid_retry_message ||
                  "That doesn't look like a valid phone number. 🤔 Please share your correct number so I can send you the guide! 📱",
              };
            }
            return undefined;
          })()}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow border border-gray-200 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upgrade to Pro</h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700 mb-6 text-base">
                Stories, DMs, and IG Live automation are Pro features. Upgrade to Pro to unlock these advanced automation capabilities.
              </p>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-purple-900 mb-3 text-base">Pro Plan Includes:</h3>
                <ul className="space-y-2 text-sm text-purple-800 font-medium">
                  <li className="flex items-center"><span className="mr-2">✅</span> Connect up to <strong>5</strong> Instagram Accounts</li>
                  <li className="flex items-center"><span className="mr-2">✅</span> <strong>Unlimited</strong> AutoDMs across Reels, Posts, Stories &amp; Lives</li>
                  <li className="flex items-center"><span className="mr-2">✅</span> Advanced AutoDM Flows (Follow-checks, Sequences)</li>
                  <li className="flex items-center"><span className="mr-2">✅</span> <strong>Unlimited</strong> Leads via Lead Magnets</li>
                  <li className="flex items-center"><span className="mr-2">✅</span> Priority Support via Dedicated Channel</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    window.location.href = '/dashboard/subscription?choosePlan=1';
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-bold shadow hover:scale-[1.02] transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
