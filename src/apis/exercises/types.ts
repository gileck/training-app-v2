import { Types } from 'mongoose';

// Base Exercise structure (mirroring the Mongoose model structure)
// Adapt this based on the actual fields in your Exercise model
export interface ExerciseBase {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    trainingPlanId: Types.ObjectId;
    exerciseDefinitionId: Types.ObjectId; // Link to the definition
    sets: number;
    reps: number;
    weight?: number; // Optional
    restTimeSeconds?: number; // Optional
    order: number; // To maintain sequence within the plan
    comments?: string; // Optional notes for the exercise instance
    createdAt: Date;
    updatedAt: Date;
}

// --- Get Exercises ---
export type GetExercisesRequest = {
    trainingPlanId: string; // Passed in the API call parameters, not body
};
export type GetExercisesResponse = ExerciseBase[];

// --- Add Exercise ---
export type AddExerciseRequest = {
    trainingPlanId: string; // Plan to add to
    exerciseDefinitionId: string; // Definition to use
    sets: number;
    reps: number;
    weight?: number;
    restTimeSeconds?: number;
    comments?: string;
    // Order might be handled automatically on the server
};
export type AddExerciseResponse = ExerciseBase; // Return the newly created exercise

// --- Update Exercise ---
export type UpdateExerciseRequest = {
    exerciseId: string; // ID of the exercise to update
    trainingPlanId: string; // For verification/context
    updates: Partial<Pick<ExerciseBase, 'sets' | 'reps' | 'weight' | 'restTimeSeconds' | 'order' | 'comments'>>; // Allow partial updates
};
export type UpdateExerciseResponse = ExerciseBase; // Return the updated exercise

// --- Delete Exercise ---
export type DeleteExerciseRequest = {
    exerciseId: string; // ID of the exercise to delete
    trainingPlanId: string; // For verification/context
};
export type DeleteExerciseResponse = {
    success: boolean;
    message?: string;
}; 