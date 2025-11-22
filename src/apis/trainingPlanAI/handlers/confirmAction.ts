import { ObjectId } from 'mongodb';
import { aiActionHistory } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { ConfirmActionRequest, ConfirmActionResponse, ActionHistoryItem } from '../types';
import { mapToActionHistoryItem } from '../utils/mappers';
import { captureStateForUndo } from '../actions/captureState';
import { executeAction } from '../actions/executeAction';

/**
 * Confirm and execute an action
 */
export const confirmAction = async (
  params: ConfirmActionRequest,
  context: ApiHandlerContext
): Promise<ConfirmActionResponse> => {
  const { userId } = context;
  if (!userId) {
    return { success: false, action: {} as ActionHistoryItem, error: 'User not authenticated' };
  }

  try {
    // Get the action from history
    const action = await aiActionHistory.findActionHistoryById(params.actionId, new ObjectId(userId));
    if (!action) {
      return { success: false, action: {} as ActionHistoryItem, error: 'Action not found' };
    }

    if (action.status !== 'pending') {
      return { success: false, action: mapToActionHistoryItem(action), error: 'Action is not pending' };
    }

    // Capture state for undo
    const originalState = await captureStateForUndo(action.actionType, action.actionData, userId);

    // Execute the action
    const executionResult = await executeAction(action.actionType, action.actionData, context);

    if (!executionResult.success) {
      // Update action status to failed
      const updatedAction = await aiActionHistory.updateActionHistory(
        params.actionId,
        new ObjectId(userId),
        {
          status: 'failed',
          errorMessage: executionResult.error,
        }
      );
      return {
        success: false,
        action: updatedAction ? mapToActionHistoryItem(updatedAction) : ({} as ActionHistoryItem),
        error: executionResult.error,
      };
    }

    // Update action status to confirmed
    const updatedAction = await aiActionHistory.updateActionHistory(
      params.actionId,
      new ObjectId(userId),
      {
        status: 'confirmed',
        originalState,
        resultData: executionResult.result,
      }
    );

    return {
      success: true,
      action: updatedAction ? mapToActionHistoryItem(updatedAction) : ({} as ActionHistoryItem),
      message: 'Action executed successfully',
    };
  } catch (error) {
    console.error('Error confirming action:', error);
    return {
      success: false,
      action: {} as ActionHistoryItem,
      error: error instanceof Error ? error.message : 'Failed to confirm action',
    };
  }
};

