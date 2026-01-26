'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Spinner } from './Spinner';
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { post } from '@/utils/api';
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
  const [forceRender, setForceRender] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch conversation stats
  const { data: stats, mutate: refreshStats } = useFetch<ConversationStats>(
    accountId ? `/api/instagram/conversations/stats?account_id=${accountId}` : null
  );

  // Fetch conversations list
  const { data: conversationsData, isLoading: conversationsLoading, mutate: refreshConversations } = useFetch<{
    success: boolean;
    conversations: Conversation[];
    count: number;
  }>(accountId ? `/api/instagram/conversations?account_id=${accountId}&limit=50` : null);

  // Get selected conversation details to extract user_id (memoized to avoid recalculation)
  const selectedConvDetails = useMemo(() => {
    if (!conversationsData?.conversations || !selectedConversation) {
      return null;
    }
    return conversationsData.conversations.find(
      (c) => c.username === selectedConversation || c.user_id === selectedConversation
    ) || null;
  }, [conversationsData, selectedConversation]);
  
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
  // CRITICAL: NEVER filter out "Unknown" conversations - they are valid conversations
  // Direct access to conversations array - no filtering at this stage
  const allConversations = (() => {
    // Try multiple ways to access the data
    // Type-safe data access
    const data = conversationsData?.conversations || 
                 (conversationsData && 'data' in conversationsData && conversationsData.data && 'conversations' in conversationsData.data 
                   ? (conversationsData.data as { conversations?: Conversation[] }).conversations 
                   : undefined) ||
                 (conversationsData && 'conversations' in conversationsData 
                   ? (conversationsData as { conversations?: Conversation[] }).conversations 
                   : undefined);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('📥 ✅ Raw conversations from API:', data.length, data);
      return data;
    }
    
    if (conversationsData) {
      console.log('⚠️ conversationsData exists but conversations is not an array:', {
        conversationsData,
        type: typeof conversationsData,
        hasConversations: 'conversations' in conversationsData,
        conversationsValue: conversationsData.conversations
      });
    }
    return [];
  })();
  
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
    ? allConversations  // ALWAYS fallback to all conversations if filter removed everything
    : filteredConversations;
  
  // Log to confirm Unknown conversations are included
  if (allConversations.length > 0) {
    const unknownCount = allConversations.filter(c => !c.username || c.username === 'Unknown').length;
    console.log(`📊 Conversation Stats:`, {
      total: allConversations.length,
      unknown: unknownCount,
      filtered: filteredConversations.length,
      display: displayConversations.length,
      searchQuery: searchQuery || '(none)'
    });
    if (unknownCount > 0) {
      console.log(`✅ Including ${unknownCount} "Unknown" conversation(s) in display`);
    }
  }
  
  // Force re-render when conversations data changes
  useEffect(() => {
    if (allConversations.length > 0) {
      console.log('🔄 Conversations available, forcing render check');
      // Force a re-render by updating state
      setForceRender(prev => prev + 1);
    }
  }, [allConversations.length]);
  
  // CRITICAL: Force re-render when conversationsData changes
  useEffect(() => {
    if (conversationsData && conversationsData.conversations && conversationsData.conversations.length > 0) {
      console.log('🔄 conversationsData changed, forcing render');
      setForceRender(prev => prev + 1);
    }
  }, [conversationsData]);
  
  // Debug: Log filtered results
  useEffect(() => {
    if (conversationsData) {
      console.log('🔍 Filter Debug:', {
        total: allConversations.length,
        filtered: filteredConversations.length,
        display: displayConversations.length,
        searchQuery,
        conversations: allConversations,
        displayConversations: displayConversations,
        rawData: conversationsData,
        hasSuccess: conversationsData.success,
        count: conversationsData.count
      });
      
      // If we have conversations but they're not showing, log warning
      if (allConversations.length > 0 && displayConversations.length === 0) {
        console.error('⚠️ CRITICAL: Conversations exist but displayConversations is empty!', {
          allConversations,
          filteredConversations,
          displayConversations,
          searchQuery
        });
      } else if (displayConversations.length > 0) {
        console.log('✅ Conversations will be displayed:', displayConversations.length);
      }
    }
  }, [conversationsData, filteredConversations, searchQuery, allConversations, displayConversations]);

  // Debug logging
  useEffect(() => {
    if (conversationsData) {
      console.log('📬 Conversations data received:', conversationsData);
      console.log('📊 Total conversations:', conversationsData.conversations?.length || 0);
      if (conversationsData.conversations && conversationsData.conversations.length > 0) {
        console.log('✅ Conversations found:', conversationsData.conversations);
      } else {
        console.log('⚠️ No conversations in response');
      }
    }
  }, [conversationsData]);

  const handleRefresh = () => {
    refreshStats();
    refreshConversations();
    if (selectedConversation) {
      refreshMessages();
    }
  };

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
      
      // Force refresh conversations after sync
      console.log('🔄 Refreshing conversations list...');
      refreshStats();
      // Force revalidation by passing undefined (which triggers revalidation)
      await refreshConversations();
      if (selectedConversation) {
        refreshMessages();
      }
    } catch (error: any) {
      console.error('❌ Error syncing conversations:', error);
      alert(error?.message || 'Failed to sync conversations. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [accountId, selectedConversation, refreshStats, refreshConversations, refreshMessages, isSyncing, session]);

  // Auto-sync on mount if no conversations found
  useEffect(() => {
    if (!accountId) return;
    
    // CRITICAL: Wait for session before attempting auto-sync
    if (!session?.access_token) {
      console.log('[MessagesView] Session not ready, skipping auto-sync check');
      return;
    }
    
    // Wait a bit for initial data to load, then check if we need to sync
    const checkAndSync = async () => {
      // Small delay to let initial fetch complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Double-check session is still available before syncing
      if (!session?.access_token) {
        console.warn('[MessagesView] Session lost during auto-sync check, aborting');
        return;
      }
      
      // Check if conversations data is loaded and empty
      if (conversationsData && conversationsData.conversations && conversationsData.conversations.length === 0) {
        console.log('📭 No conversations found, triggering auto-sync...');
        handleSync();
      } else if (!conversationsData && !conversationsLoading) {
        // If data hasn't loaded yet, wait a bit more
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (conversationsData && conversationsData.conversations && conversationsData.conversations.length === 0) {
          console.log('📭 No conversations found after wait, triggering auto-sync...');
          handleSync();
        }
      }
    };
    
    checkAndSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, session]); // Added session as dependency

  // Polling: refresh only when tab is visible, every 20s. Message sync is via webhooks + Sync button.
  useEffect(() => {
    if (!accountId || typeof document === 'undefined') return;
    
    // CRITICAL: Don't start polling until session is ready
    if (!session?.access_token) {
      return;
    }

    const refresh = () => {
      // Double-check session before refreshing
      if (!session?.access_token) {
        console.warn('[MessagesView] Session lost during polling refresh, skipping');
        return;
      }
      refreshStats();
      refreshConversations();
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
  }, [accountId, selectedConversation, session, refreshStats, refreshConversations, refreshMessages]);

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with Stats */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-600">View and reply to Instagram DM conversations</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Sync conversations from Instagram"
            >
              {isSyncing ? 'Syncing...' : 'Sync Conversations'}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
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
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex-1 overflow-y-auto">
            {(() => {
              // CRITICAL DEBUG: Log everything at render time
              const rawConversations = conversationsData?.conversations || [];
              console.log('🔴 RENDER CHECK:', {
                loading: conversationsLoading,
                hasData: !!conversationsData,
                rawData: conversationsData,
                rawConversationsArray: rawConversations,
                rawConversationsLength: rawConversations.length,
                allCount: allConversations.length,
                filteredCount: filteredConversations.length,
                displayCount: displayConversations.length,
                allConversations: allConversations,
                displayConversations: displayConversations,
                forceRender: forceRender
              });
              
              // Direct check - if we have conversations, show them
              if (conversationsLoading) {
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
                console.log('✅ RENDERING CONVERSATIONS NOW (DIRECT):', conversationsToRender.length, conversationsToRender);
                return (
                  <>
                    {conversationsToRender.map((conv, index) => {
                      console.log(`🎯 Rendering conversation ${index}:`, conv);
                      return (
                        <div
                          key={conv.id || `conv-${conv.user_id}`}
                          onClick={() => setSelectedConversation(conv.username || conv.user_id)}
                          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                            selectedConversation === (conv.username || conv.user_id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {(conv.username || '?').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{conv.username || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {conv.last_message_is_from_bot ? 'You: ' : ''}
                                {conv.last_message || '[No messages]'}
                              </p>
                              {conv.last_message_at && (
                                <p className="text-xs text-gray-400 mt-1">
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
                      );
                    })}
                  </>
                );
              }
              
              // If we reach here, we have NO conversations to show
              console.log('❌ NO CONVERSATIONS TO RENDER:', {
                allConversations: allConversations.length,
                displayConversations: displayConversations.length,
                conversationsData: conversationsData
              });
              
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
        <div className="flex-1 flex flex-col bg-white">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4 bg-white">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
              <div className="border-t border-gray-200 p-4 bg-white">
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
                      
                      // Refresh messages and conversations
                      await refreshMessages();
                      await refreshConversations();
                      await refreshStats();
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
