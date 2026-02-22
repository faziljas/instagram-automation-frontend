'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Spinner } from './Spinner';
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { get, post } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';

interface Conversation {
  id: string;
  username: string;
  user_id: string;
  last_message_at: string | null;
  last_message: string;
  last_message_is_from_bot: boolean;
  message_count: number;
}

interface Message {
  id: number;
  message_id: string | null;
  text: string | null;
  is_from_bot: boolean;
  sender_username: string | null;
  recipient_username: string | null;
  has_attachments: boolean;
  attachments: unknown;
  created_at: string;
}

interface ConversationStats {
  total_conversations: number;
  unread: number;
  messages_sent: number;
  messages_received: number;
}

interface MessagesViewProps {
  accountId: number;
}

export default function MessagesView({ accountId }: MessagesViewProps) {
  const { session } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch conversation stats
  // Disable revalidateOnFocus to prevent constant refreshes when window regains focus
  const { data: stats, mutate: refreshStats } = useFetch<ConversationStats>(
    accountId ? `/api/instagram/conversations/stats?account_id=${accountId}` : null,
    { revalidateOnFocus: false } // Prevent auto-refresh on window focus
  );

  // Conversations list (paginated, manual fetch for "Load more")
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [nextConversationsOffset, setNextConversationsOffset] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);

  const fetchConversations = useCallback(async (loadMore?: boolean, silent?: boolean) => {
    if (!accountId) return;
    const offset = loadMore ? nextConversationsOffset : 0;
    // Only show loading state if not silent refresh
    if (!silent) {
      if (loadMore) setIsLoadingMoreConversations(true);
      else setIsLoadingConversations(true);
    }
    try {
      const data = await get<{
        success: boolean;
        conversations: Conversation[];
        count: number;
        has_more?: boolean;
        next_offset?: number | null;
      }>(`/api/instagram/conversations?account_id=${accountId}&limit=100&offset=${offset}`);
      const list = data?.conversations ?? [];
      if (loadMore) {
        setConversations((prev) => [...prev, ...list]);
      } else {
        setConversations(list);
      }
      setHasMoreConversations(Boolean(data?.has_more));
      setNextConversationsOffset(typeof data?.next_offset === 'number' ? data.next_offset : offset + list.length);
    } catch (e) {
      console.error('Fetch conversations error:', e);
      if (!loadMore && !silent) setConversations([]);
    } finally {
      if (!silent) {
        setIsLoadingConversations(false);
        setIsLoadingMoreConversations(false);
      }
    }
  }, [accountId, nextConversationsOffset]);

  useEffect(() => {
    if (!accountId) {
      setConversations([]);
      setHasMoreConversations(false);
      setNextConversationsOffset(0);
      return;
    }
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Get selected conversation details to extract user_id (memoized to avoid recalculation)
  const selectedConvDetails = useMemo(() => {
    if (!conversations.length || !selectedConversation) return null;
    return conversations.find(
      (c) => c.username === selectedConversation || c.user_id === selectedConversation
    ) || null;
  }, [conversations, selectedConversation]);
  
  // Messages for selected conversation (paginated, manual fetch for "Load older")
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextMessagesOffset, setNextMessagesOffset] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const didLoadOlderRef = useRef(false);

  const fetchMessages = useCallback(async (loadOlder?: boolean, silent?: boolean) => {
    if (!selectedConversation || !accountId) return;
    const offset = loadOlder ? nextMessagesOffset : 0;
    if (!silent) {
      if (loadOlder) {
        didLoadOlderRef.current = true;
        setIsLoadingOlderMessages(true);
      } else {
        setIsLoadingMessages(true);
      }
    }
    try {
      let url = `/api/instagram/conversations/${encodeURIComponent(selectedConversation)}/messages?account_id=${accountId}&limit=100&offset=${offset}`;
      if (selectedConvDetails?.user_id) url += `&participant_user_id=${selectedConvDetails.user_id}`;
      const data = await get<{
        success: boolean;
        messages: Message[];
        count: number;
        has_more?: boolean;
        next_offset?: number | null;
      }>(url);
      const list = data?.messages ?? [];
      if (loadOlder) {
        setMessages((prev) => [...list, ...prev]);
      } else {
        setMessages(list);
      }
      setHasMoreMessages(Boolean(data?.has_more));
      setNextMessagesOffset(typeof data?.next_offset === 'number' ? data.next_offset : offset + list.length);
    } catch (e) {
      console.error('Fetch messages error:', e);
      if (!loadOlder && !silent) setMessages([]);
    } finally {
      if (!silent) {
        setIsLoadingMessages(false);
        setIsLoadingOlderMessages(false);
      }
    }
  }, [selectedConversation, accountId, selectedConvDetails?.user_id, nextMessagesOffset]);

  useEffect(() => {
    if (!selectedConversation || !accountId) {
      setMessages([]);
      setHasMoreMessages(false);
      setNextMessagesOffset(0);
      return;
    }
    // Only fetch messages when conversation actually changes, not on every render
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, accountId, selectedConvDetails?.user_id]);

  useEffect(() => {
    if (messages.length === 0 || isLoadingMessages || isLoadingOlderMessages) return;
    if (didLoadOlderRef.current) {
      didLoadOlderRef.current = false;
      return;
    }
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isLoadingMessages, isLoadingOlderMessages]);

  // Filter conversations by search query
  const allConversations = conversations;
  
  // Always show ALL conversations (including "Unknown") when no search query
  // When searching, include "Unknown" conversations too - they should always be visible
  const filteredConversations = searchQuery 
    ? allConversations.filter((conv) => {
        if (!conv) {
          console.warn('⚠️ Conversation is null/undefined:', conv);
          return false;
        }
        // CRITICAL: Always include "Unknown" conversations
        if (!conv.username || conv.username === 'Unknown') {
          return true; // Always show Unknown conversations
        }
        // For other conversations, filter by search query
        const username = (conv.username || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return username.includes(query);
      })
    : allConversations; // Show ALL when no search query (including Unknown)
  
  // CRITICAL FIX: Always use allConversations if filteredConversations is empty but we have data
  // This ensures "Unknown" conversations are NEVER hidden
  // IMPORTANT: If we have ANY conversations but filtered is empty, always show allConversations
  const displayConversations = (allConversations.length > 0 && filteredConversations.length === 0)
    ? allConversations
    : filteredConversations;
  
  const handleRefresh = useCallback(() => {
    refreshStats();
    fetchConversations();
    if (selectedConversation) fetchMessages();
  }, [refreshStats, fetchConversations, selectedConversation, fetchMessages]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (!accountId || isSyncing) return;
    
    // CRITICAL: Wait for session token before making API call
    if (!session?.access_token) {
      console.warn('[MessagesView] No session token available, cannot sync conversations');
      alert('Session expired. Please refresh the page and try again.');
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log(`🔄 Syncing conversations for account ${accountId}...`);
      
      // Use dedicated sync endpoint (like competitors)
      await post(`/api/instagram/conversations/sync?account_id=${accountId}`, {});
      
      console.log('✅ Sync completed');
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Refreshing conversations list...');
      refreshStats();
      fetchConversations();
      if (selectedConversation) fetchMessages();
    } catch (error: any) {
      console.error('❌ Error syncing conversations:', error);
      alert(error?.message || 'Failed to sync conversations. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [accountId, selectedConversation, refreshStats, fetchConversations, fetchMessages, isSyncing, session]);

  const loadingAndConvosRef = useRef({ loading: false, length: 0 });
  loadingAndConvosRef.current = { loading: isLoadingConversations, length: conversations.length };

  // Auto-sync on mount if no conversations found after initial fetch
  useEffect(() => {
    if (!accountId || !session?.access_token) return;
    const t = setTimeout(() => {
      const { loading, length } = loadingAndConvosRef.current;
      if (!loading && length === 0) handleSync();
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, session]);

  // Automatic polling for messages in selected conversation (instant updates like Instagram)
  // Poll messages every 5 seconds when a conversation is selected and page is visible
  useEffect(() => {
    if (!accountId || !selectedConversation || typeof document === 'undefined') return;
    
    // CRITICAL: Don't start polling until session is ready
    if (!session?.access_token) {
      return;
    }

    // Poll messages silently (no loading indicator) for instant updates
    const messagePollInterval = setInterval(() => {
      // Only poll when page is visible
      if (document.visibilityState !== 'visible') return;
      
      // Silent refresh of messages (no loading state) - updates messages instantly
      fetchMessages(false, true);
    }, 5000); // Poll every 5 seconds for instant message updates like Instagram

    return () => {
      clearInterval(messagePollInterval);
    };
  }, [accountId, selectedConversation, session, fetchMessages]);

  // Silent background polling: refresh stats and conversations list silently (no loading states)
  // Reduced interval to 30s for better responsiveness while keeping it efficient
  useEffect(() => {
    if (!accountId || typeof document === 'undefined') return;
    
    // CRITICAL: Don't start polling until session is ready
    if (!session?.access_token) {
      return;
    }

    // Silent refresh: Only refresh stats and conversations list without showing loading states
    // This prevents the UI from appearing to reload constantly
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 5000; // Minimum 5 seconds between refreshes (debounce)
    
    const silentRefresh = () => {
      if (!session?.access_token) return;
      
      // Debounce: Don't refresh if we just refreshed recently
      const now = Date.now();
      if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        return;
      }
      lastRefreshTime = now;
      
      // Use SWR's mutate for silent stats refresh (no loading indicator)
      refreshStats();
      // Silent conversations refresh (no loading indicator)
      fetchConversations(false, true);
    };

    // Poll conversations and stats every 30 seconds for better responsiveness
    // Only refresh when page is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      silentRefresh();
    }, 30000); // 30 seconds - balanced interval for responsiveness and efficiency

    return () => {
      clearInterval(intervalId);
    };
  }, [accountId, session, refreshStats, fetchConversations]);

  return (
    <div className="min-h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-full">
      {/* Header with Stats */}
      <div className="border-b border-gray-200 bg-white p-4 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-xs md:text-sm text-gray-600">View and reply to Instagram DM conversations</p>
            <p className="text-xs text-gray-500 mt-0.5">If messages are not showing, click Sync Conversations to refresh from Instagram.</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 md:px-4 py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              title="If messages are not showing, click to sync conversations from Instagram."
            >
              {isSyncing ? 'Syncing...' : <span className="hidden sm:inline">Sync Conversations</span>}
              {isSyncing ? '' : <span className="sm:hidden">Sync</span>}
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_conversations || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.unread || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <PaperAirplaneIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-600">Messages Sent</p>
                  <div className="group relative">
                    <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Total messages sent across all conversations for this Instagram account
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.messages_sent || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-teal-600 mr-3" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-600">Messages Received</p>
                  <div className="group relative">
                    <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Total messages received across all conversations for this Instagram account
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.messages_received || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
        {/* Left Panel - Conversation List */}
        <div className="w-full md:w-80 border-r-0 md:border-r border-gray-200 flex flex-col bg-gray-50 min-h-0">
          {/* Search Bar */}
          <div className="p-3 md:p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-4 md:pb-0">
            {(() => {
              if (isLoadingConversations) {
                return (
                  <div className="flex justify-center items-center h-32">
                    <Spinner />
                  </div>
                );
              }
              
              // Use filtered conversations to respect search query
              const conversationsToRender = filteredConversations.length > 0 
                ? filteredConversations  // Use filtered results based on search query
                : (allConversations.length > 0 && !searchQuery
                    ? allConversations  // Show all when no search query
                    : []); // Show empty when search query has no matches
              
              if (conversationsToRender.length > 0) {
                return (
                  <>
                    {conversationsToRender.map((conv) => (
                        <div
                          key={conv.id || `conv-${conv.user_id}`}
                          onClick={() => setSelectedConversation(conv.username || conv.user_id)}
                          className={`p-3 md:p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                            selectedConversation === (conv.username || conv.user_id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                                {(conv.username || '?').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{conv.username || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {conv.last_message_is_from_bot ? 'You: ' : ''}
                                {conv.last_message || '[No messages]'}
                              </p>
                              {conv.last_message_at && (
                                <p className="text-xs text-gray-400 mt-0.5 md:mt-1">
                                  {new Date(conv.last_message_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    second: '2-digit',  // Show seconds for accurate timing
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                    {hasMoreConversations && !searchQuery && (
                      <div className="p-3 flex justify-center border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => fetchConversations(true)}
                          disabled={isLoadingMoreConversations}
                          className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingMoreConversations ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                );
              }
              
              if (allConversations.length > 0 && searchQuery && filteredConversations.length === 0) {
                return (
                  <div className="p-4 text-center text-yellow-600 text-sm bg-yellow-50 border border-yellow-200 rounded-md m-2">
                    <p className="font-medium">⚠️ No conversations match your search</p>
                    <p className="text-xs mt-1">
                      Found {allConversations.length} conversation(s) but none match your search &quot;{searchQuery}&quot;.
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="ml-1 text-blue-600 underline"
                      >
                        Clear search
                      </button>
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchQuery ? (
                    'No conversations match your search'
                  ) : (
                    <div>
                      <p className="mb-2 font-medium">No conversations found</p>
                      <p className="text-xs text-gray-400 mb-3">
                        Conversations will appear here once messages are sent or received via Instagram.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-left text-xs text-blue-800">
                        <p className="font-semibold mb-1">💡 How to get conversations:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Send a message from your Instagram account to someone</li>
                          <li>Have someone send you a message on Instagram</li>
                          <li>Conversations will appear automatically via webhooks</li>
                        </ul>
                        <p className="mt-2 text-blue-700">
                          <strong>Note:</strong> Instagram doesn&apos;t provide historical conversations. Only new messages received after connecting your account will appear here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Panel - Chat Window */}
        {selectedConversation && (
          <div className="fixed inset-0 z-50 md:relative md:z-auto md:inset-auto flex-1 flex flex-col bg-white min-h-0 md:flex">
            {/* Mobile back button */}
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-3 md:p-4 bg-white pt-12 md:pt-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {selectedConvDetails?.username.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedConvDetails?.username || 'Unknown'}</p>
                    {selectedConvDetails?.username && (
                      <p className="text-xs text-gray-500">@{selectedConvDetails.username}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 min-h-0 flex flex-col"
              >
                {hasMoreMessages && (
                  <div className="flex justify-center py-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchMessages(true)}
                      disabled={isLoadingOlderMessages}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingOlderMessages ? 'Loading…' : 'Load older messages'}
                    </button>
                  </div>
                )}
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center flex-1 min-h-[8rem]">
                    <Spinner />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4 flex-1">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_bot ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.is_from_bot
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-teal-600 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.text || (msg.has_attachments ? '[Media]' : '[No text]')}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.is_from_bot ? 'text-gray-500' : 'text-teal-100'
                            }`}
                          >
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 flex-1">
                    <p>No messages in this conversation yet</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-3 md:p-4 bg-white">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!messageText.trim() || !selectedConversation || isSending) return;
                    
                    // CRITICAL: Wait for session token before making API call
                    if (!session?.access_token) {
                      console.warn('[MessagesView] No session token available, cannot send message');
                      alert('Session expired. Please refresh the page and try again.');
                      return;
                    }
                    
                    setIsSending(true);
                    const messageToSend = messageText.trim();
                    
                    // OPTIMISTIC UPDATE: Show message immediately in UI before API confirms
                    // This provides instant feedback that users expect
                    const optimisticMessage: Message = {
                      id: Date.now(), // Temporary ID
                      message_id: null,
                      text: messageToSend,
                      is_from_bot: true, // Sent by us
                      sender_username: null,
                      recipient_username: selectedConvDetails?.username || selectedConversation || null,
                      has_attachments: false,
                      attachments: null,
                      created_at: new Date().toISOString()
                    };
                    
                    // Add optimistic message to UI immediately
                    setMessages((prev) => [...prev, optimisticMessage]);
                    setMessageText('');
                    
                    // Scroll to bottom to show new message
                    setTimeout(() => {
                      const el = messagesContainerRef.current;
                      if (el) el.scrollTop = el.scrollHeight;
                    }, 100);
                    
                    try {
                      // Get participant_user_id from selected conversation
                      const participantUserId = selectedConvDetails?.user_id;
                      
                      const url = `/api/instagram/conversations/${encodeURIComponent(selectedConversation)}/messages?account_id=${accountId}${participantUserId ? `&participant_user_id=${participantUserId}` : ''}`;
                      
                      await post(url, { text: messageToSend });
                      
                      // Reset sending state immediately - message already shown optimistically
                      setIsSending(false);
                      
                      // Refresh messages silently (no loading indicator) to get real message from server
                      // This ensures we have the correct message_id and timestamp without showing loading
                      fetchMessages(false, true);
                      fetchConversations(false, true);
                      refreshStats();
                      
                      // Also refresh after 2 seconds silently to ensure message appears even if initial refresh missed it
                      // This handles edge cases where the message might not be immediately available
                      setTimeout(() => {
                        fetchMessages(false, true);
                        refreshStats();
                      }, 2000);
                    } catch (error: any) {
                      console.error('Failed to send message:', error);
                      
                      // Remove optimistic message on error
                      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
                      
                      // Restore message text so user can retry
                      setMessageText(messageToSend);
                      
                      // Reset sending state on error
                      setIsSending(false);
                      
                      alert(error?.message || 'Failed to send message. Please try again.');
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={isSending}
                      className="flex-1 px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      className="px-3 md:px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          </div>
        )}
        {!selectedConversation && (
          <div className="hidden md:flex md:flex-1 items-center justify-center text-gray-400">
            <div className="text-center max-w-sm">
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">Select a conversation to view messages</p>
              <p className="text-sm text-gray-400 mt-2">If messages or conversations are not showing, click Sync Conversations at the top to refresh from Instagram.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
