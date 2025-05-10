import { ObjectId } from 'mongodb';
import { ExerciseBase } from '../exercises/types';

// Base type for Saved Workout
export interface SavedWorkout {
    _id: ObjectId;
    userId: ObjectId;
    name: string;
    exerciseIds: ObjectId[]; // References to exercises
    trainingPlanId: ObjectId; // Added trainingPlanId
    createdAt: Date;
    updatedAt: Date;
}

// Extended interface including exercise details (for API responses)
export interface SavedWorkoutWithExercises extends Omit<SavedWorkout, 'exerciseIds' | 'trainingPlanId'> {
    exercises: ExerciseBase[]; // Full exercise objects
    trainingPlanId: ObjectId; // Added trainingPlanId explicitly
}

// GET /savedWorkouts (Get all saved workouts)
export interface GetAllSavedWorkoutsRequest {
    trainingPlanId?: string; // Optional: If provided, filter workouts for this plan
}
export type GetAllSavedWorkoutsResponse = SavedWorkout[];

// POST /savedWorkouts (Create saved workout)
export interface CreateSavedWorkoutRequest {
    name: string;
    exerciseIds: string[]; // Array of exercise IDs as strings
    trainingPlanId: string; // Added trainingPlanId
}
export type CreateSavedWorkoutResponse = SavedWorkout | { error: string };

// DELETE /savedWorkouts/:id (Delete saved workout)
export interface DeleteSavedWorkoutRequest {
    workoutId: string;
}
export type DeleteSavedWorkoutResponse = { success: boolean; message: string };

// --- API Types for GET /saved-workouts/:id (Get Details) --- //
export interface GetSavedWorkoutDetailsRequest {
    workoutId: string; // ID of the saved workout to retrieve
}
export type GetSavedWorkoutDetailsResponse = SavedWorkoutWithExercises | null; // Full workout details with exercises 

// --- API Types for Add Exercise to Saved Workout --- //
export interface AddExerciseToSavedWorkoutRequest {
    workoutId: string;
    exerciseDefinitionId: string;
    sets: number;
    reps: number; // Assuming reps will be a number here, but DB stores as string. Conversion in server handler.
    order?: number; // Optional, server can determine if not provided
}

export type AddExerciseToSavedWorkoutResponse = SavedWorkoutWithExercises | { error: string };

// --- API Types for Remove Exercise from Saved Workout --- //
export interface RemoveExerciseFromSavedWorkoutRequest {
    workoutId: string;
    exerciseDefinitionIdToRemove: string; // The ExerciseDefinition ID to remove
}

export type RemoveExerciseFromSavedWorkoutResponse = SavedWorkoutWithExercises | { error: string };

// --- API Types for Rename Saved Workout --- //
export interface RenameSavedWorkoutRequest {
    workoutId: string;
    newName: string;
}

export type RenameSavedWorkoutResponse = SavedWorkout | { error: string }; 