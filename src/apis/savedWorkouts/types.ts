import { ObjectId } from 'mongodb';
import { ExerciseBase } from '../exercises/types';

// Exercise within a saved workout
export interface SavedWorkoutExercise {
    exerciseId: ObjectId; // Reference to exercises._id
    order: number; // Integer
}

// Base type for Saved Workout
export interface SavedWorkout {
    _id: ObjectId;
    userId: ObjectId;
    name: string;
    exercises: SavedWorkoutExercise[]; // Array of exercises with their order
    trainingPlanId: ObjectId; // Reference to trainingPlans._id
    createdAt: Date;
    updatedAt: Date;
}

// Extended interface including exercise details (for API responses)
export interface SavedWorkoutWithExercises extends Omit<SavedWorkout, 'exercises' | 'trainingPlanId'> {
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
    exerciseId: string; // Changed from exerciseDefinitionId to exerciseId
}

export type AddExerciseToSavedWorkoutResponse = { success: boolean; message: string; } | { error: string };

// --- API Types for Remove Exercise from Saved Workout --- //
export interface RemoveExerciseFromSavedWorkoutRequest {
    workoutId: string;
    exerciseIdToRemove: string; // Changed from exerciseDefinitionIdToRemove to match our updated schema
}

export type RemoveExerciseFromSavedWorkoutResponse = SavedWorkoutWithExercises | { error: string };

// --- API Types for Rename Saved Workout --- //
export interface RenameSavedWorkoutRequest {
    workoutId: string;
    newName: string;
}

export type RenameSavedWorkoutResponse = SavedWorkout | { error: string }; 