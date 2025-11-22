import { ObjectId } from 'mongodb';
import { TrainingPlanAssistant } from '@/server/ai/trainingPlanAssistant';
import { aiActionHistory } from '@/server/database/collections';
import { getPricePer1K } from '@/server/ai/price';
import type { ApiHandlerContext } from '@/apis/types';
import type { ProcessUserMessageRequest, ProcessUserMessageResponse, ActionHistoryItem } from '../types';
import { getChatContext } from './getChatContext';
import { mapToActionHistoryItem } from '../utils/mappers';

/**
 * Process a user message and generate AI actions
 */
export const processUserMessage = async (
  params: ProcessUserMessageRequest,
  context: ApiHandlerContext
): Promise<ProcessUserMessageResponse> => {
  const { userId } = context;
  if (!userId) {
    return { message: '', actions: [], error: 'User not authenticated' };
  }

  try {
    // Get chat context
    const contextResponse = await getChatContext({ planId: params.planId }, context);
    if (contextResponse.error) {
      return { message: '', actions: [], error: contextResponse.error };
    }

    // Process message with AI
    const assistant = new TrainingPlanAssistant(params.modelId);
    const aiResponse = await assistant.processMessage(params.message, contextResponse.context);

    // Save actions to history as pending
    const actionHistoryItems: ActionHistoryItem[] = [];
    for (const action of aiResponse.actions) {
      const historyEntry = await aiActionHistory.createActionHistory({
        userId: new ObjectId(userId),
        planId: params.planId ? new ObjectId(params.planId) : undefined,
        actionType: action.actionType,
        actionData: action.actionData,
        description: action.description,
        status: 'pending',
      });
      actionHistoryItems.push(mapToActionHistoryItem(historyEntry));
    }

    // Calculate costs
    let usage;
    if (aiResponse.usage && params.modelId) {
      const { inputTokens, outputTokens } = aiResponse.usage;
      const prices = getPricePer1K(params.modelId, inputTokens + outputTokens);
      const inputCost = (inputTokens / 1000) * prices.inputCost;
      const outputCost = (outputTokens / 1000) * prices.outputCost;
      usage = {
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
      };
    }

    return {
      message: aiResponse.message,
      actions: actionHistoryItems,
      usage,
    };
  } catch (error) {
    console.error('Error processing user message:', error);
    return {
      message: '',
      actions: [],
      error: error instanceof Error ? error.message : 'Failed to process message',
    };
  }
};

