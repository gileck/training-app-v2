import type { ActionHistoryItem } from '../types';
import type { AIActionHistory } from '@/server/database/collections/aiActionHistory/types';

/**
 * Helper to convert DB action history to API format
 */
export function mapToActionHistoryItem(action: AIActionHistory): ActionHistoryItem {
  return {
    _id: action._id.toString(),
    actionType: action.actionType,
    actionData: action.actionData,
    description: action.description,
    status: action.status,
    resultData: action.resultData,
    errorMessage: action.errorMessage,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}

