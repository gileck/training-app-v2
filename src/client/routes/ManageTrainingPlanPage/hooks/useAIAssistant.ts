import { useState, useCallback, useEffect } from 'react';
import * as trainingPlanAI from '@/apis/trainingPlanAI/client';
import { GEMINI_MODELS } from '@/server/ai/models';
import type { ChatMessage, ActionHistoryItem } from '@/apis/trainingPlanAI/types';

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
  setSelectedModel: (modelId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  confirmAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  undoAction: (actionId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to manage AI assistant interactions
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

  // Load action history when planId changes
  useEffect(() => {
    if (planId) {
      loadActionHistory();
    } else {
      setActionHistory([]);
      setMessages([]);
    }
  }, [planId]);

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
      setMessages((prev) => [...prev, userMessage]);

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
          };
          setMessages((prev) => [...prev, aiMessage]);

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
    [planId, messages, selectedModel]
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    actionHistory,
    isProcessing,
    error,
    selectedModel,
    setSelectedModel,
    sendMessage,
    confirmAction,
    rejectAction,
    undoAction,
    clearError,
  };
};

