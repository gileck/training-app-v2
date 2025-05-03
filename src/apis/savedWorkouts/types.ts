import { ObjectId } from 'mongodb';
import { ExerciseBase } from '../exercises/types';

// Base type for Saved Workout
export interface SavedWorkout {
    _id: ObjectId;
    userId: ObjectId;
    name: string;
    description?: string;
    exerciseIds: ObjectId[]; // References to exercises
    createdAt: Date;
    updatedAt: Date;
}

// Extended interface including exercise details (for API responses)
export interface SavedWorkoutWithExercises extends Omit<SavedWorkout, 'exerciseIds'> {
    exercises: ExerciseBase[]; // Full exercise objects
}

// GET /savedWorkouts (Get all saved workouts)
export type GetAllSavedWorkoutsRequest = Record<string, never>;
export type GetAllSavedWorkoutsResponse = SavedWorkout[];

// POST /savedWorkouts (Create saved workout)
export interface CreateSavedWorkoutRequest {
    name: string;
    description?: string;
    exerciseIds: string[]; // Array of exercise IDs as strings
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