import { useState, useCallback, useEffect } from 'react';
import * as trainingPlanAI from '@/apis/trainingPlanAI/client';
import { GEMINI_MODELS } from '@/server/ai/models';
import type { ChatMessage, ActionHistoryItem, Conversation, SuggestedAction } from '@/apis/trainingPlanAI/types';

const DEFAULT_MODEL_ID = GEMINI_MODELS[0].id; // Default to first Gemini model

interface UseAIAssistantProps {
  planId?: string;
  onActionExecuted?: () => void; // Callback to refresh data after action execution
}

interface UseAIAssistantReturn {
  messages: ChatMessage[];
  actionHistory: ActionHistoryItem[];
  isProcessing: boolean;
  error: string | null;
  selectedModel: string;
  currentConversationId: string | null;
  conversations: Conversation[];
  suggestedActions: SuggestedAction[];
  examplePrompts: string[];
  setSelectedModel: (modelId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  confirmAction: (actionId: string) => Promise<void>;
  confirmMultipleActions: (actionIds: string[]) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  undoAction: (actionId: string) => Promise<void>;
  clearError: () => void;
  createNewConversation: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  loadSuggestedActions: () => Promise<void>;
}

/**
 * Hook to manage AI assistant interactions with conversation persistence
 */
export const useAIAssistant = ({
  planId,
  onActionExecuted,
}: UseAIAssistantProps): UseAIAssistantReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const result = await trainingPlanAI.getConversation({ conversationId });
      
      if (result.data?.conversation) {
        setCurrentConversationId(conversationId);
        setMessages(result.data.conversation.messages);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    }
  }, []);

  // Load conversations and action history when planId changes
  useEffect(() => {
    if (planId) {
      loadActionHistory();
      loadConversations();
      loadSuggestedActions();
    } else {
      setActionHistory([]);
      setMessages([]);
      setCurrentConversationId(null);
      loadConversations(); // Load user-level conversations even without a plan
      loadSuggestedActions(); // Load plan creation suggestions
    }
  }, [planId]);

  // Auto-load most recent conversation when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      // Load the most recent conversation (first in the list, sorted by lastMessageAt)
      const mostRecent = conversations[0];
      if (mostRecent) {
        loadConversation(mostRecent._id);
      }
    }
  }, [conversations, currentConversationId, messages.length, loadConversation]);

  const loadActionHistory = useCallback(async () => {
    if (!planId) return;

    try {
      const result = await trainingPlanAI.getActionHistory({ planId });
      if (result.data?.actions) {
        setActionHistory(result.data.actions);
      }
    } catch (err) {
      console.error('Error loading action history:', err);
    }
  }, [planId]);

  const loadConversations = useCallback(async () => {
    try {
      const result = await trainingPlanAI.listConversations({ 
        planId: planId || undefined,
        status: 'active'
      });
      if (result.data?.conversations) {
        setConversations(result.data.conversations);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, [planId]);

  const createNewConversation = useCallback(async () => {
    try {
      const result = await trainingPlanAI.createConversation({
        planId: planId || undefined,
        title: 'New Conversation',
      });

      if (result.data?.conversation) {
        setCurrentConversationId(result.data.conversation._id);
        setMessages([]);
        setConversations((prev) => [result.data!.conversation, ...prev]);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  }, [planId]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await trainingPlanAI.updateConversation({
        conversationId,
        status: 'archived',
      });

      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error archiving conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive conversation');
    }
  }, [currentConversationId]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await trainingPlanAI.deleteConversation({ conversationId });

      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }, [currentConversationId]);

  // Save conversation after each message exchange
  const saveConversation = useCallback(
    async (updatedMessages: ChatMessage[]) => {
      if (!currentConversationId) {
        // Create new conversation on first message
        try {
          const firstUserMessage = updatedMessages.find((m) => m.role === 'user');
          const title = firstUserMessage?.content.slice(0, 50) || 'New Conversation';

          const result = await trainingPlanAI.createConversation({
            planId: planId || undefined,
            title,
          });

          if (result.data?.conversation) {
            setCurrentConversationId(result.data.conversation._id);
            setConversations((prev) => [result.data!.conversation, ...prev]);
            
            // Update conversation with messages
            await trainingPlanAI.updateConversation({
              conversationId: result.data.conversation._id,
              messages: updatedMessages,
            });
          }
        } catch (err) {
          console.error('Error creating conversation:', err);
        }
      } else {
        // Update existing conversation
        try {
          await trainingPlanAI.updateConversation({
            conversationId: currentConversationId,
            messages: updatedMessages,
          });

          // Update conversation title if it's the first message
          if (updatedMessages.length === 2) { // User + AI response
            const firstUserMessage = updatedMessages.find((m) => m.role === 'user');
            if (firstUserMessage) {
              const title = firstUserMessage.content.slice(0, 50);
              await trainingPlanAI.updateConversation({
                conversationId: currentConversationId,
                title,
              });

              // Update local conversations list
              setConversations((prev) =>
                prev.map((c) =>
                  c._id === currentConversationId ? { ...c, title } : c
                )
              );
            }
          }
        } catch (err) {
          console.error('Error updating conversation:', err);
        }
      }
    },
    [currentConversationId, planId]
  );

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;

      setIsProcessing(true);
      setError(null);

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      try {
        // Send message to AI
        const result = await trainingPlanAI.processUserMessage({
          message: messageText,
          planId: planId || undefined,
          conversationHistory: messages,
          modelId: selectedModel,
        });

        if (!result.data || result.data.error) {
          setError(result.data?.error || 'Failed to process message');
          return;
        }

        if (result.data) {
          // Add AI response to chat
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: result.data.message,
            timestamp: new Date(),
            actions: result.data.actions,
            usage: result.data.usage,
          };
          const finalMessages = [...updatedMessages, aiMessage];
          setMessages(finalMessages);

          // Save conversation
          await saveConversation(finalMessages);

          // Update action history with new pending actions
          if (result.data.actions && result.data.actions.length > 0) {
            setActionHistory((prev) => [...result.data.actions, ...prev]);
          }
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsProcessing(false);
      }
    },
    [planId, messages, selectedModel, saveConversation]
  );

  const confirmAction = useCallback(
    async (actionId: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await trainingPlanAI.confirmAction({ actionId });

        if (!result.data || result.data.error) {
          setError(result.data?.error || 'Failed to confirm action');
          return;
        }

        if (result.data?.success && result.data.action) {
          // Update action in history
          setActionHistory((prev) =>
            prev.map((a) => (a._id === actionId ? result.data!.action : a))
          );

          // Update action in messages
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              actions: msg.actions?.map((a) =>
                a._id === actionId ? result.data!.action : a
              ),
            }))
          );

          // Trigger data refresh
          onActionExecuted?.();

          // Add system message
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: result.data.message || 'Action executed successfully',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      } catch (err) {
        console.error('Error confirming action:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm action');
      } finally {
        setIsProcessing(false);
      }
    },
    [onActionExecuted]
  );

  const confirmMultipleActions = useCallback(
    async (actionIds: string[]) => {
      if (actionIds.length === 0) return;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await trainingPlanAI.confirmMultipleActions({ actionIds });

        if (!result.data) {
          setError('Failed to confirm actions');
          return;
        }

        // Update all actions in history and messages
        if (result.data.results && result.data.results.length > 0) {
          result.data.results.forEach((actionResult) => {
            if (actionResult.success && actionResult.action) {
              // Update action in history
              setActionHistory((prev) =>
                prev.map((a) => (a._id === actionResult.action._id ? actionResult.action : a))
              );

              // Update action in messages
              setMessages((prev) =>
                prev.map((msg) => ({
                  ...msg,
                  actions: msg.actions?.map((a) =>
                    a._id === actionResult.action._id ? actionResult.action : a
                  ),
                }))
              );
            }
          });

          // Trigger data refresh once after all actions
          onActionExecuted?.();

          // Add system message with summary
          const successCount = result.data.successCount;
          const failureCount = result.data.failureCount;
          let summaryMessage = '';
          
          if (failureCount === 0) {
            summaryMessage = `Successfully executed all ${successCount} actions`;
          } else {
            summaryMessage = `Executed ${successCount} actions successfully. ${failureCount} failed.`;
            if (result.data.errors && result.data.errors.length > 0) {
              const errorDetails = result.data.errors.map(e => `- ${e.error}`).join('\n');
              summaryMessage += `\n\nErrors:\n${errorDetails}`;
            }
          }

          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: summaryMessage,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);

          if (failureCount > 0) {
            setError(`${failureCount} action(s) failed to execute`);
          }
        }
      } catch (err) {
        console.error('Error confirming multiple actions:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm actions');
      } finally {
        setIsProcessing(false);
      }
    },
    [onActionExecuted]
  );

  const rejectAction = useCallback(async (actionId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await trainingPlanAI.rejectAction({ actionId });

      if (!result.data || result.data.error) {
        setError(result.data?.error || 'Failed to reject action');
        return;
      }

      if (result.data?.success) {
        // Update action status in history and messages
        setActionHistory((prev) =>
          prev.map((a) =>
            a._id === actionId ? { ...a, status: 'rejected' as const } : a
          )
        );

        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            actions: msg.actions?.map((a) =>
              a._id === actionId ? { ...a, status: 'rejected' as const } : a
            ),
          }))
        );
      }
    } catch (err) {
      console.error('Error rejecting action:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject action');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const undoAction = useCallback(
    async (actionId: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const result = await trainingPlanAI.undoAction({ actionId });

        if (!result.data || result.data.error) {
          setError(result.data?.error || 'Failed to undo action');
          return;
        }

        if (result.data?.success && result.data.action) {
          // Update action in history
          setActionHistory((prev) =>
            prev.map((a) => (a._id === actionId ? result.data!.action : a))
          );

          // Update action in messages
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              actions: msg.actions?.map((a) =>
                a._id === actionId ? result.data!.action : a
              ),
            }))
          );

          // Trigger data refresh
          onActionExecuted?.();

          // Add system message
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: result.data.message || 'Action undone successfully',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      } catch (err) {
        console.error('Error undoing action:', err);
        setError(err instanceof Error ? err.message : 'Failed to undo action');
      } finally {
        setIsProcessing(false);
      }
    },
    [onActionExecuted]
  );

  const loadSuggestedActions = useCallback(async () => {
    try {
      const result = await trainingPlanAI.getSuggestedActions({
        planId: planId || undefined,
      });
      if (result.data) {
        setSuggestedActions(result.data.suggestions || []);
        setExamplePrompts(result.data.examplePrompts || []);
      }
    } catch (err) {
      console.error('Error loading suggested actions:', err);
    }
  }, [planId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    actionHistory,
    isProcessing,
    error,
    selectedModel,
    currentConversationId,
    conversations,
    suggestedActions,
    examplePrompts,
    setSelectedModel,
    sendMessage,
    confirmAction,
    confirmMultipleActions,
    rejectAction,
    undoAction,
    clearError,
    createNewConversation,
    loadConversation,
    archiveConversation,
    deleteConversation,
    loadSuggestedActions,
  };
};

