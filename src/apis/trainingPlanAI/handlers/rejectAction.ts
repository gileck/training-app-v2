import { ObjectId } from 'mongodb';
import { aiActionHistory } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { RejectActionRequest, RejectActionResponse } from '../types';

/**
 * Reject an action
 */
export const rejectAction = async (
  params: RejectActionRequest,
  context: ApiHandlerContext
): Promise<RejectActionResponse> => {
  const { userId } = context;
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Update action status to rejected
    const updatedAction = await aiActionHistory.updateActionHistory(
      params.actionId,
      new ObjectId(userId),
      { status: 'rejected' }
    );

    if (!updatedAction) {
      return { success: false, error: 'Action not found' };
    }

    return { success: true, message: 'Action rejected' };
  } catch (error) {
    console.error('Error rejecting action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject action',
    };
  }
};

