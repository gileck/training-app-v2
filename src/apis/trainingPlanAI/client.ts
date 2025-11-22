import apiClient from '@/client/utils/apiClient';
import { CacheResult } from '@/common/cache/types';
import {
  processUserMessageApiName,
  confirmActionApiName,
  confirmMultipleActionsApiName,
  rejectActionApiName,
  undoActionApiName,
  getActionHistoryApiName,
  getChatContextApiName,
  createConversationApiName,
  getConversationApiName,
  listConversationsApiName,
  updateConversationApiName,
  deleteConversationApiName,
  getSuggestedActionsApiName,
} from './index';
import type {
  ProcessUserMessageRequest,
  ProcessUserMessageResponse,
  ConfirmActionRequest,
  ConfirmActionResponse,
  ConfirmMultipleActionsRequest,
  ConfirmMultipleActionsResponse,
  RejectActionRequest,
  RejectActionResponse,
  UndoActionRequest,
  UndoActionResponse,
  GetActionHistoryRequest,
  GetActionHistoryResponse,
  GetChatContextRequest,
  GetChatContextResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  GetConversationRequest,
  GetConversationResponse,
  ListConversationsRequest,
  ListConversationsResponse,
  UpdateConversationRequest,
  UpdateConversationResponse,
  DeleteConversationRequest,
  DeleteConversationResponse,
  GetSuggestedActionsRequest,
  GetSuggestedActionsResponse,
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
 * Confirm and execute multiple AI-suggested actions in parallel
 */
export const confirmMultipleActions = async (
  params: ConfirmMultipleActionsRequest
): Promise<CacheResult<ConfirmMultipleActionsResponse>> => {
  return apiClient.call(confirmMultipleActionsApiName, params);
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

/**
 * Create a new conversation
 */
export const createConversation = async (
  params: CreateConversationRequest
): Promise<CacheResult<CreateConversationResponse>> => {
  return apiClient.call(createConversationApiName, params);
};

/**
 * Get a specific conversation
 */
export const getConversation = async (
  params: GetConversationRequest
): Promise<CacheResult<GetConversationResponse>> => {
  return apiClient.call(getConversationApiName, params);
};

/**
 * List all conversations
 */
export const listConversations = async (
  params: ListConversationsRequest
): Promise<CacheResult<ListConversationsResponse>> => {
  return apiClient.call(listConversationsApiName, params);
};

/**
 * Update conversation metadata
 */
export const updateConversation = async (
  params: UpdateConversationRequest
): Promise<CacheResult<UpdateConversationResponse>> => {
  return apiClient.call(updateConversationApiName, params);
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  params: DeleteConversationRequest
): Promise<CacheResult<DeleteConversationResponse>> => {
  return apiClient.call(deleteConversationApiName, params);
};

/**
 * Get suggested actions based on current context
 */
export const getSuggestedActions = async (
  params: GetSuggestedActionsRequest
): Promise<CacheResult<GetSuggestedActionsResponse>> => {
  return apiClient.call(getSuggestedActionsApiName, params);
};

