import { ObjectId } from 'mongodb';

// Representation of a Training Plan document
export interface TrainingPlan {
    _id: ObjectId;
    userId: ObjectId; // Reference to the user
    name: string;
    durationWeeks: number;
    createdAt: Date;
    updatedAt: Date;
}

// --- API Request/Response Types ---

// GET /trainingPlans (Get all plans for user)
export type GetAllTrainingPlansRequest = Record<string, never>; // Use Record<string, never>
export type GetAllTrainingPlansResponse = TrainingPlan[] | { error?: string };

// GET /trainingPlans/:planId (Get specific plan)
export interface GetTrainingPlanRequest {
    planId: string; // Passed as param
}
export type GetTrainingPlanResponse = TrainingPlan | { error?: string };

// POST /trainingPlans (Create plan)
export interface CreateTrainingPlanRequest {
    name: string;
    durationWeeks: number;
}
export type CreateTrainingPlanResponse = TrainingPlan | { error?: string };

// PUT /trainingPlans/:planId (Update plan)
export interface UpdateTrainingPlanRequest {
    planId: string;
    name?: string;
    durationWeeks?: number;
}
export type UpdateTrainingPlanResponse = TrainingPlan | { error?: string };

// DELETE /trainingPlans/:planId (Delete plan)
export interface DeleteTrainingPlanRequest {
    planId: string;
}
export type DeleteTrainingPlanResponse = { success: boolean; message?: string; error?: string };

// POST /trainingPlans/:planId/duplicate (Duplicate plan)
export interface DuplicateTrainingPlanRequest {
    planId: string;
}
export type DuplicateTrainingPlanResponse = TrainingPlan | { error?: string }; // Returns the new plan 