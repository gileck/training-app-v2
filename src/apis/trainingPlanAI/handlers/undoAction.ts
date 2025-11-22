import { ObjectId } from 'mongodb';
import { aiActionHistory } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { UndoActionRequest, UndoActionResponse, ActionHistoryItem } from '../types';
import { mapToActionHistoryItem } from '../utils/mappers';
import { undoActionExecution } from '../actions/undoAction';

/**
 * Undo a confirmed action
 */
export const undoAction = async (
  params: UndoActionRequest,
  context: ApiHandlerContext
): Promise<UndoActionResponse> => {
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

    if (action.status !== 'confirmed') {
      return {
        success: false,
        action: mapToActionHistoryItem(action),
        error: 'Can only undo confirmed actions',
      };
    }

    if (!action.originalState) {
      return {
        success: false,
        action: mapToActionHistoryItem(action),
        error: 'No undo information available',
      };
    }

    // Undo the action
    const undoResult = await undoActionExecution(action.actionType, action.originalState, context);

    if (!undoResult.success) {
      return {
        success: false,
        action: mapToActionHistoryItem(action),
        error: undoResult.error || 'Failed to undo action',
      };
    }

    // Update action status to undone
    const updatedAction = await aiActionHistory.updateActionHistory(
      params.actionId,
      new ObjectId(userId),
      { status: 'undone' }
    );

    return {
      success: true,
      action: updatedAction ? mapToActionHistoryItem(updatedAction) : ({} as ActionHistoryItem),
      message: 'Action undone successfully',
    };
  } catch (error) {
    console.error('Error undoing action:', error);
    return {
      success: false,
      action: {} as ActionHistoryItem,
      error: error instanceof Error ? error.message : 'Failed to undo action',
    };
  }
};

