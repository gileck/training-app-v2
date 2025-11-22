import { ActionType, ActionStatus } from '@/server/database/collections/aiActionHistory/types';

/**
 * A structured action that the AI suggests
 */
export interface AIAction {
  actionType: ActionType;
  actionData: Record<string, unknown>;
  description: string; // Human-readable description for the user
}

/**
 * A chat message in the conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionHistoryItem[]; // Actions associated with this message
}

/**
 * Action history item (client-side representation)
 */
export interface ActionHistoryItem {
  _id: string;
  actionType: ActionType;
  actionData: Record<string, unknown>;
  description: string;
  status: ActionStatus;
  resultData?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Context information for AI processing
 */
export interface ChatContext {
  planId?: string;
  planName?: string;
  planDurationWeeks?: number;
  exercises?: Array<{
    _id: string;
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    durationSeconds?: number;
  }>;
  savedWorkouts?: Array<{
    _id: string;
    name: string;
    exerciseCount: number;
  }>;
  availableExerciseDefinitions?: Array<{
    _id: string;
    name: string;
    category?: string;
  }>;
}

// Request types

export interface ProcessUserMessageRequest {
  message: string;
  planId?: string;
  conversationHistory?: ChatMessage[];
  modelId?: string;
}

export interface ConfirmActionRequest {
  actionId: string;
}

export interface RejectActionRequest {
  actionId: string;
}

export interface UndoActionRequest {
  actionId: string;
}

export interface ConfirmMultipleActionsRequest {
  actionIds: string[];
}

export interface GetActionHistoryRequest {
  planId?: string;
  limit?: number;
}

export interface GetChatContextRequest {
  planId?: string;
}

export interface CreateConversationRequest {
  planId?: string;
  title?: string;
  initialMessage?: string;
}

export interface GetConversationRequest {
  conversationId: string;
}

export interface ListConversationsRequest {
  planId?: string;
  status?: 'active' | 'archived';
  limit?: number;
}

export interface UpdateConversationRequest {
  conversationId: string;
  title?: string;
  status?: 'active' | 'archived';
  messages?: ChatMessage[];
}

export interface DeleteConversationRequest {
  conversationId: string;
}

// Response types

export interface ProcessUserMessageResponse {
  message: string; // AI's response message
  actions: ActionHistoryItem[]; // Suggested actions
  error?: string;
}

export interface ConfirmActionResponse {
  success: boolean;
  action: ActionHistoryItem;
  message?: string;
  error?: string;
}

export interface RejectActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UndoActionResponse {
  success: boolean;
  action: ActionHistoryItem;
  message?: string;
  error?: string;
}

export interface ConfirmMultipleActionsResponse {
  results: ConfirmActionResponse[];
  successCount: number;
  failureCount: number;
  errors: Array<{ actionId: string; error: string }>;
}

export interface GetActionHistoryResponse {
  actions: ActionHistoryItem[];
  error?: string;
}

export interface GetChatContextResponse {
  context: ChatContext;
  error?: string;
}

export interface Conversation {
  _id: string;
  planId?: string;
  title: string;
  messages: ChatMessage[];
  status: 'active' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  error?: string;
}

export interface GetConversationResponse {
  conversation: Conversation | null;
  error?: string;
}

export interface ListConversationsResponse {
  conversations: Conversation[];
  error?: string;
}

export interface UpdateConversationResponse {
  conversation: Conversation | null;
  success: boolean;
  error?: string;
}

export interface DeleteConversationResponse {
  success: boolean;
  error?: string;
}

export interface SuggestedAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category: 'plan' | 'exercise' | 'workout' | 'general';
}

export interface GetSuggestedActionsRequest {
  planId?: string;
}

export interface GetSuggestedActionsResponse {
  suggestions: SuggestedAction[];
  examplePrompts: string[];
  error?: string;
}

