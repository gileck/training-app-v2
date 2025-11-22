import { ObjectId } from 'mongodb';

/**
 * Status of an AI action
 */
export type ActionStatus = 'pending' | 'confirmed' | 'rejected' | 'undone' | 'failed';

/**
 * Type of actions the AI assistant can perform
 */
export type ActionType = 
  // Training plan actions
  | 'createPlan' 
  | 'updatePlan' 
  | 'deletePlan' 
  | 'setActivePlan'
  // Exercise definition actions
  | 'createCustomExercise'
  // Exercise actions
  | 'addExercise' 
  | 'updateExercise' 
  | 'deleteExercise'
  // Workout actions
  | 'createWorkout' 
  | 'renameWorkout' 
  | 'deleteWorkout' 
  | 'addExerciseToWorkout' 
  | 'removeExerciseFromWorkout';

/**
 * AI Action History document stored in the database
 */
export interface AIActionHistory {
  _id: ObjectId;
  userId: ObjectId;
  planId?: ObjectId; // Optional for plan creation
  actionType: ActionType;
  actionData: Record<string, unknown>; // The parameters for the action
  description: string; // Human-readable description
  status: ActionStatus;
  originalState?: Record<string, unknown>; // State before action for undo
  resultData?: Record<string, unknown>; // Result after confirmation (e.g., new IDs)
  errorMessage?: string; // Error message if status is 'failed'
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type for creating a new AI action history entry
 */
export type AIActionHistoryCreate = Omit<AIActionHistory, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating an AI action history entry
 */
export type AIActionHistoryUpdate = Partial<Omit<AIActionHistory, '_id' | 'userId' | 'createdAt'>>;

