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
  const { data: stats, mutate: refreshStats } = useFetch<ConversationStats>(
    accountId ? `/api/instagram/conversations/stats?account_id=${accountId}` : null
  );

  // Conversations list (paginated, manual fetch for "Load more")
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [nextConversationsOffset, setNextConversationsOffset] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);

  const fetchConversations = useCallback(async (loadMore?: boolean) => {
    if (!accountId) return;
    const offset = loadMore ? nextConversationsOffset : 0;
    if (loadMore) setIsLoadingMoreConversations(true);
    else setIsLoadingConversations(true);
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
      if (!loadMore) setConversations([]);
    } finally {
      setIsLoadingConversations(false);
      setIsLoadingMoreConversations(false);
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
  
  // Fetch messages for selected conversation
  // Use participant_user_id query param for more reliable lookup (especially for Unknown users)
  const messagesUrl = useMemo(() => {
    if (!selectedConversation || !accountId) {
      return null;
    }
    const baseUrl = `/api/instagram/conversations/${encodeURIComponent(selectedConversation)}/messages?account_id=${accountId}&limit=100`;
    const participantParam = selectedConvDetails?.user_id ? `&participant_user_id=${selectedConvDetails.user_id}` : '';
    return baseUrl + participantParam;
  }, [selectedConversation, accountId, selectedConvDetails?.user_id]);
  
  const { data: messagesData, isLoading: messagesLoading, mutate: refreshMessages } = useFetch<{
    success: boolean;
    messages: Message[];
    count: number;
  }>(messagesUrl);

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
    if (selectedConversation) refreshMessages();
  }, [refreshStats, fetchConversations, selectedConversation, refreshMessages]);

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
      if (selectedConversation) refreshMessages();
    } catch (error: any) {
      console.error('❌ Error syncing conversations:', error);
      alert(error?.message || 'Failed to sync conversations. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [accountId, selectedConversation, refreshStats, fetchConversations, refreshMessages, isSyncing, session]);

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

  // Polling: refresh only when tab is visible, every 20s. Message sync is via webhooks + Sync button.
  useEffect(() => {
    if (!accountId || typeof document === 'undefined') return;
    
    // CRITICAL: Don't start polling until session is ready
    if (!session?.access_token) {
      return;
    }

    const refresh = () => {
      if (!session?.access_token) return;
      refreshStats();
      fetchConversations();
      if (selectedConversation) refreshMessages();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refresh();
    }, 20000); // 20 seconds when tab visible

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [accountId, selectedConversation, session, refreshStats, fetchConversations, refreshMessages]);

  return (
    <div className="min-h-[calc(100vh-200px)] md:h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-full">
      {/* Header with Stats */}
      <div className="border-b border-gray-200 bg-white p-4 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-xs md:text-sm text-gray-600">View and reply to Instagram DM conversations</p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 md:px-4 py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              title="Sync conversations from Instagram"
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
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.messages_sent || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Messages Received</p>
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
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 min-h-0">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Spinner />
                  </div>
                ) : messagesData?.messages && messagesData.messages.length > 0 ? (
                  messagesData.messages.map((msg) => (
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
                                second: '2-digit',  // Show seconds for accurate timing
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
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
                    try {
                      // Get participant_user_id from selected conversation
                      const participantUserId = selectedConvDetails?.user_id;
                      
                      const url = `/api/instagram/conversations/${encodeURIComponent(selectedConversation)}/messages?account_id=${accountId}${participantUserId ? `&participant_user_id=${participantUserId}` : ''}`;
                      
                      await post(url, { text: messageText.trim() });
                      
                      // Clear input
                      setMessageText('');
                      
                      await refreshMessages();
                      fetchConversations();
                      refreshStats();
                    } catch (error: any) {
                      console.error('Failed to send message:', error);
                      alert(error?.message || 'Failed to send message. Please try again.');
                    } finally {
                      setIsSending(false);
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
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
