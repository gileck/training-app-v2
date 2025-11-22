import { ObjectId } from 'mongodb';
import { aiActionHistory } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { GetActionHistoryRequest, GetActionHistoryResponse } from '../types';
import { mapToActionHistoryItem } from '../utils/mappers';

/**
 * Get action history
 */
export const getActionHistory = async (
  params: GetActionHistoryRequest,
  context: ApiHandlerContext
): Promise<GetActionHistoryResponse> => {
  const { userId } = context;
  if (!userId) {
    return { actions: [], error: 'User not authenticated' };
  }

  try {
    const limit = params.limit || 100;
    let actions: aiActionHistory.AIActionHistory[];

    if (params.planId) {
      actions = await aiActionHistory.getActionHistoryForPlan(params.planId, new ObjectId(userId), limit);
    } else {
      actions = await aiActionHistory.getActionHistoryForUser(new ObjectId(userId), limit);
    }

    return {
      actions: actions.map(mapToActionHistoryItem),
    };
  } catch (error) {
    console.error('Error getting action history:', error);
    return {
      actions: [],
      error: error instanceof Error ? error.message : 'Failed to get action history',
    };
  }
};

