import { ObjectId } from 'mongodb';

/**
 * Base type for an Exercise stored in an exercise
 */
export interface ExerciseBase {
    _id: ObjectId;
    userId: ObjectId;
    trainingPlanId: ObjectId;  // Plan this exercise belongs to
    exerciseDefinitionId: ObjectId;  // Exercise definition (name, type, etc.)
    sets: number;  // Number of sets
    reps: number;  // Number of reps per set
    weight?: number;  // Optional weight for the exercise
    durationSeconds?: number; // Optional
    order?: number;  // Order in the plan
    comments?: string;  // Optional notes/comments
    createdAt: Date;
    updatedAt: Date;
}

// GET /exercises (Read/List exercises for a plan)
export interface GetExercisesRequest {
    trainingPlanId: string;
}
export type GetExercisesResponse = ExerciseBase[];

// POST /exercises (Add a new exercise to a plan)
export interface AddExerciseRequest {
    trainingPlanId: string;
    exerciseDefinitionId: string;
    sets: number;
    reps: number;
    weight?: number;
    durationSeconds?: number;
    comments?: string;
}
export type AddExerciseResponse = ExerciseBase;

// PUT /exercises/:id (Update an exercise in a plan)
export interface UpdateExerciseRequest {
    exerciseId: string;
    trainingPlanId: string;
    updates: Partial<Pick<ExerciseBase, 'sets' | 'reps' | 'weight' | 'durationSeconds' | 'order' | 'comments'>>;
}
export type UpdateExerciseResponse = ExerciseBase;

// DELETE /exercises/:id (Remove an exercise from a plan)
export interface DeleteExerciseRequest {
    exerciseId: string;
    trainingPlanId: string;
}
export type DeleteExerciseResponse = {
    success: boolean;
    message: string;
}; 