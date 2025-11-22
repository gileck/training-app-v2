import { ObjectId } from 'mongodb';
import { aiActionHistory } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { ActionType } from '@/server/database/collections/aiActionHistory/types';
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

    // For creation actions (addExercise, createWorkout, createPlan, createCustomExercise),
    // we use resultData to know what was created. For update/delete actions, we use originalState.
    const creationActions: ActionType[] = ['createPlan', 'addExercise', 'createWorkout', 'createCustomExercise'];
    const isCreationAction = creationActions.includes(action.actionType);
    
    if (!isCreationAction && !action.originalState) {
      return {
        success: false,
        action: mapToActionHistoryItem(action),
        error: 'No undo information available',
      };
    }

    if (isCreationAction && !action.resultData) {
      return {
        success: false,
        action: mapToActionHistoryItem(action),
        error: 'No result data available for undo',
      };
    }

    // Undo the action - pass both originalState and resultData
    const undoResult = await undoActionExecution(
      action.actionType,
      action.originalState || {},
      action.resultData || {},
      context
    );

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

