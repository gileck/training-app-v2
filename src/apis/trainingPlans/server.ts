import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '@/apis/types';
import {
    GetAllTrainingPlansRequest,
    GetAllTrainingPlansResponse,
    GetTrainingPlanRequest,
    GetTrainingPlanResponse,
    CreateTrainingPlanRequest,
    CreateTrainingPlanResponse,
    UpdateTrainingPlanRequest,
    UpdateTrainingPlanResponse,
    DeleteTrainingPlanRequest,
    DeleteTrainingPlanResponse,
    DuplicateTrainingPlanRequest,
    DuplicateTrainingPlanResponse,
    SetActiveTrainingPlanResponse,
    GetActiveTrainingPlanResponse
} from './types';

// --- API Name Imports ---
import {
    getByIdApiName as getTrainingPlanApiName,
    getAllApiName as getAllTrainingPlansApiName,
    createApiName as createTrainingPlanApiName,
    updateApiName as updateTrainingPlanApiName,
    deleteApiName as deleteTrainingPlanApiName,
    duplicateApiName as duplicateTrainingPlanApiName,
    setActiveApiName as setActiveTrainingPlanApiName,
    getActiveApiName as getActiveTrainingPlanApiName
} from './index';

import { trainingPlans } from '@/server/database/collections';

// Re-export API names for registration
export {
    getTrainingPlanApiName,
    getAllTrainingPlansApiName,
    createTrainingPlanApiName,
    updateTrainingPlanApiName,
    deleteTrainingPlanApiName,
    duplicateTrainingPlanApiName,
    setActiveTrainingPlanApiName,
    getActiveTrainingPlanApiName
};

// --- API Handlers ---

/**
 * Task 15: Get all training plans for the logged-in user
 */
export const getAllTrainingPlans = async (_params: GetAllTrainingPlansRequest, context: ApiHandlerContext): Promise<GetAllTrainingPlansResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    try {
        // Use the database layer to get all training plans
        const plans = await trainingPlans.findTrainingPlansForUser(context.userId);
        return plans;
    } catch (error) {
        console.error("Error getting all training plans:", error);
        return { error: "Failed to retrieve training plans." };
    }
};

/**
 * Task 16: Get a specific training plan by ID
 */
export const getTrainingPlanById = async (params: GetTrainingPlanRequest, context: ApiHandlerContext): Promise<GetTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    if (!params.planId) {
        return { error: "Plan ID is required." };
    }

    try {
        // Use the database layer to find the plan
        const plan = await trainingPlans.findTrainingPlanById(params.planId, context.userId);

        if (!plan) {
            return { error: "Training plan not found or access denied." };
        }
        return plan;
    } catch (error) {
        console.error("Error getting training plan by ID:", error);
        return { error: "Failed to retrieve training plan." };
    }
};

/**
 * Task 17: Create a new training plan
 */
export const createTrainingPlan = async (params: CreateTrainingPlanRequest, context: ApiHandlerContext): Promise<CreateTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    if (!params.name || !params.durationWeeks || params.durationWeeks <= 0) {
        return { error: "Valid plan name and positive duration (weeks) are required." };
    }

    try {
        const userIdObj = new ObjectId(context.userId);

        // Get count of existing plans to determine if this is the first one
        const existingPlans = await trainingPlans.findTrainingPlansForUser(userIdObj);
        const isFirstPlan = existingPlans.length === 0;

        const now = new Date();
        const newPlanDoc: trainingPlans.TrainingPlanCreate = {
            userId: userIdObj,
            name: params.name,
            durationWeeks: params.durationWeeks,
            isActive: isFirstPlan, // Set isActive based on whether it's the first plan
            createdAt: now,
            updatedAt: now,
        };

        // Use the database layer to insert the new plan
        const createdPlan = await trainingPlans.insertTrainingPlan(newPlanDoc);
        return createdPlan;
    } catch (error) {
        console.error("Error creating training plan:", error);
        return { error: "Failed to create training plan." };
    }
};

/**
 * Task 18: Update an existing training plan
 */
export const updateTrainingPlan = async (params: UpdateTrainingPlanRequest, context: ApiHandlerContext): Promise<UpdateTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    if (!params.planId) {
        return { error: "Plan ID is required for update." };
    }
    if (!params.name && params.durationWeeks === undefined) {
        return { error: "No update fields provided (name or durationWeeks)." };
    }
    if (params.durationWeeks !== undefined && params.durationWeeks <= 0) {
        return { error: "Duration (weeks) must be positive." };
    }

    try {
        // First verify the plan exists and belongs to the user
        const existingPlan = await trainingPlans.findTrainingPlanById(params.planId, context.userId);
        if (!existingPlan) {
            return { error: "Training plan not found or access denied." };
        }

        const updates: trainingPlans.TrainingPlanUpdate = {
            updatedAt: new Date()
        };
        if (params.name) updates.name = params.name;
        if (params.durationWeeks !== undefined) updates.durationWeeks = params.durationWeeks;

        // Use the database layer to update the plan
        const updatedPlan = await trainingPlans.updateTrainingPlan(params.planId, context.userId, updates);

        if (!updatedPlan) {
            return { error: "Update failed or plan not found." };
        }

        return updatedPlan;
    } catch (error) {
        console.error("Error updating training plan:", error);
        return { error: "Failed to update training plan." };
    }
};

/**
 * Task 19: Delete a training plan (and associated data)
 */
export const deleteTrainingPlan = async (params: DeleteTrainingPlanRequest, context: ApiHandlerContext): Promise<DeleteTrainingPlanResponse> => {
    if (!context.userId) {
        return { success: false, message: "Unauthorized" };
    }
    if (!params.planId) {
        return { success: false, message: "Plan ID is required." };
    }
    if (!ObjectId.isValid(params.planId)) {
        return { success: false, message: "Invalid Plan ID format." };
    }

    try {
        // Use the database layer to delete the plan and all associated data
        const deleted = await trainingPlans.deleteTrainingPlan(params.planId, context.userId);

        if (deleted) {
            return { success: true, message: "Training plan and associated data deleted." };
        } else {
            return { success: false, message: "Training plan not found or access denied (during delete)." };
        }
    } catch (error) {
        console.error("Error deleting training plan:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Failed to delete training plan: ${errorMessage}` };
    }
};

/**
 * Task 20: Duplicate an existing training plan (including exercises)
 */
export const duplicateTrainingPlan = async (params: DuplicateTrainingPlanRequest, context: ApiHandlerContext): Promise<DuplicateTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    if (!params.planId) {
        return { error: "Original Plan ID is required." };
    }

    try {
        // Use the database layer to duplicate the plan
        // Generate the new name for the duplicate plan
        const originalPlan = await trainingPlans.findTrainingPlanById(params.planId, context.userId);
        if (!originalPlan) {
            return { error: "Original training plan not found or access denied." };
        }

        const newName = `${originalPlan.name} (Copy)`;
        const duplicatedPlan = await trainingPlans.duplicateTrainingPlan(
            params.planId,
            context.userId,
            newName
        );

        if (!duplicatedPlan) {
            return { error: "Failed to duplicate training plan." };
        }

        return duplicatedPlan;
    } catch (error) {
        console.error("Error duplicating training plan:", error);
        return { error: `Failed to duplicate training plan: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Task X: Set a Training Plan as Active
 */
export const setActiveTrainingPlan = async (
    params: { planId: string },
    context: ApiHandlerContext
): Promise<SetActiveTrainingPlanResponse> => {
    if (!context.userId) {
        return { success: false, message: "Unauthorized" };
    }
    if (!params.planId || !ObjectId.isValid(params.planId)) {
        return { success: false, message: "Invalid Plan ID format." };
    }

    try {
        // Use the database layer to set the plan as active
        const updatedPlan = await trainingPlans.setTrainingPlanActive(params.planId, context.userId);

        if (!updatedPlan) {
            return { success: false, message: "Training plan not found or access denied." };
        }

        return { success: true, message: "Training plan set as active." };
    } catch (error) {
        console.error("Error setting active training plan:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Failed to set active training plan: ${errorMessage}` };
    }
};

/**
 * Get the active training plan for the current user
 */
export const getActiveTrainingPlan = async (
    _params: Record<string, never>, // No params needed
    context: ApiHandlerContext
): Promise<GetActiveTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized", plan: null };
    }
    
    try {
        // Use the database layer to get the active training plan
        const activePlan = await trainingPlans.findActiveTrainingPlan(context.userId);

        if (!activePlan) {
            return { error: "No active training plan found", plan: null };
        }

        return activePlan;
    } catch (error) {
        console.error("Error fetching active training plan:", error);
        return { error: "Failed to retrieve active training plan", plan: null };
    }
}; 