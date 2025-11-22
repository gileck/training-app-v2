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

export interface GetActionHistoryRequest {
  planId?: string;
  limit?: number;
}

export interface GetChatContextRequest {
  planId?: string;
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

export interface GetActionHistoryResponse {
  actions: ActionHistoryItem[];
  error?: string;
}

export interface GetChatContextResponse {
  context: ChatContext;
  error?: string;
}

