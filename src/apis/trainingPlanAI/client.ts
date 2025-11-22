import apiClient from '@/client/utils/apiClient';
import { CacheResult } from '@/common/cache/types';
import {
  processUserMessageApiName,
  confirmActionApiName,
  rejectActionApiName,
  undoActionApiName,
  getActionHistoryApiName,
  getChatContextApiName,
} from './index';
import type {
  ProcessUserMessageRequest,
  ProcessUserMessageResponse,
  ConfirmActionRequest,
  ConfirmActionResponse,
  RejectActionRequest,
  RejectActionResponse,
  UndoActionRequest,
  UndoActionResponse,
  GetActionHistoryRequest,
  GetActionHistoryResponse,
  GetChatContextRequest,
  GetChatContextResponse,
} from './types';

/**
 * Process a user message and get AI-suggested actions
 */
export const processUserMessage = async (
  params: ProcessUserMessageRequest
): Promise<CacheResult<ProcessUserMessageResponse>> => {
  return apiClient.call(processUserMessageApiName, params);
};

/**
 * Confirm and execute an AI-suggested action
 */
export const confirmAction = async (
  params: ConfirmActionRequest
): Promise<CacheResult<ConfirmActionResponse>> => {
  return apiClient.call(confirmActionApiName, params);
};

/**
 * Reject an AI-suggested action
 */
export const rejectAction = async (
  params: RejectActionRequest
): Promise<CacheResult<RejectActionResponse>> => {
  return apiClient.call(rejectActionApiName, params);
};

/**
 * Undo a previously confirmed action
 */
export const undoAction = async (
  params: UndoActionRequest
): Promise<CacheResult<UndoActionResponse>> => {
  return apiClient.call(undoActionApiName, params);
};

/**
 * Get action history for a plan
 */
export const getActionHistory = async (
  params: GetActionHistoryRequest
): Promise<CacheResult<GetActionHistoryResponse>> => {
  return apiClient.call(getActionHistoryApiName, params);
};

/**
 * Get chat context for AI processing
 */
export const getChatContext = async (
  params: GetChatContextRequest
): Promise<CacheResult<GetChatContextResponse>> => {
  return apiClient.call(getChatContextApiName, params);
};
