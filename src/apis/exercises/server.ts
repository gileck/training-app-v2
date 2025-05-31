import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import {
    GetExercisesRequest, GetExercisesResponse,
    AddExerciseRequest, AddExerciseResponse,
    UpdateExerciseRequest, UpdateExerciseResponse,
    DeleteExerciseRequest, DeleteExerciseResponse,
    ExerciseBase
} from './types';
import { name as getExercisesApiName, nameAdd as addExerciseApiName, nameUpdate as updateExerciseApiName, nameDelete as deleteExerciseApiName } from './index';
import { exercises, trainingPlans } from '@/server/database/collections';

// Helper to validate plan ownership
async function validatePlanOwnership(planId: string, userId: string): Promise<boolean> {
    if (!userId || !ObjectId.isValid(userId)) {
        console.error('Invalid userId provided to validatePlanOwnership');
        return false;
    }
    if (!ObjectId.isValid(planId)) {
        return false;
    }
    const plan = await trainingPlans.findTrainingPlanById(planId, userId);
    return !!plan;
}

// Helper to map DB Exercise to API ExerciseBase
function mapToExerciseBase(exercise: exercises.Exercise): ExerciseBase {
    return {
        _id: exercise._id.toString(),
        userId: exercise.userId.toString(),
        trainingPlanId: exercise.planId.toString(), // Map planId to trainingPlanId
        exerciseDefinitionId: exercise.definitionId.toString(), // Map definitionId
        sets: exercise.sets,
        reps: parseInt(exercise.reps, 10) || 0, // Convert string reps to number
        weight: exercise.weight ? parseFloat(exercise.weight) : undefined,
        durationSeconds: exercise.durationSeconds,
        order: exercise.orderInPlan || 0,
        comments: exercise.comments,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt
    };
}

// --- Get Exercises for Plan ---
export const getExercisesForPlan = async (
    params: GetExercisesRequest,
    context: ApiHandlerContext
): Promise<GetExercisesResponse> => {
    const { userId } = context;
    const { trainingPlanId } = params;

    if (!userId) throw new Error("User not authenticated");

    if (!await validatePlanOwnership(trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    // Use the new database layer to get exercises
    const exercisesArray = await exercises.findExercisesForPlan(trainingPlanId, userId);

    // Map to the API response type
    return exercisesArray.map(mapToExerciseBase);
};

// --- Add Exercise to Plan ---
export const addExerciseToPlan = async (
    params: AddExerciseRequest,
    context: ApiHandlerContext
): Promise<AddExerciseResponse> => {
    const { userId } = context;
    const { trainingPlanId, exerciseDefinitionId, sets, reps, weight, durationSeconds, comments } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(exerciseDefinitionId)) throw new Error("Invalid Exercise Definition ID format.");

    if (!await validatePlanOwnership(trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    // Get the next order value 
    const order = await exercises.getNextExerciseOrder(trainingPlanId, userId);

    const now = new Date();
    const newExercise: exercises.ExerciseCreate = {
        userId: new ObjectId(userId),
        planId: new ObjectId(trainingPlanId),
        definitionId: new ObjectId(exerciseDefinitionId),
        sets,
        reps: String(reps), // Convert number reps to string for schema
        orderInPlan: order,
        createdAt: now,
        updatedAt: now,
        ...(weight !== undefined && { weight: String(weight) }), // Convert number weight to string
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(comments !== undefined && { comments }),
    };

    // Use the new database layer to insert the exercise
    const createdExercise = await exercises.insertExercise(newExercise);

    // Map the created document back to the API response type
    return mapToExerciseBase(createdExercise);
};

// --- Update Exercise in Plan ---
export const updateExerciseInPlan = async (
    params: UpdateExerciseRequest,
    context: ApiHandlerContext
): Promise<UpdateExerciseResponse> => {
    const { userId } = context;
    const { exerciseId, trainingPlanId, updates } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(exerciseId)) throw new Error("Invalid Exercise ID format.");

    // Validate plan ownership first
    if (!await validatePlanOwnership(trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    // Construct the update object
    const updateFields: exercises.ExerciseUpdate = {
        updatedAt: new Date()
    };

    if (updates.sets !== undefined) updateFields.sets = updates.sets;
    if (updates.reps !== undefined) updateFields.reps = String(updates.reps); // Convert to string
    if (updates.weight !== undefined) updateFields.weight = String(updates.weight); // Convert to string
    if (updates.durationSeconds !== undefined) updateFields.durationSeconds = updates.durationSeconds;
    if (updates.order !== undefined) updateFields.orderInPlan = updates.order;
    if (updates.comments !== undefined) updateFields.comments = updates.comments;

    if (Object.keys(updateFields).length <= 1) { // Just updatedAt
        throw new Error("No valid fields provided for update.");
    }

    // Use the new database layer to update the exercise
    const updatedExercise = await exercises.updateExercise(exerciseId, userId, trainingPlanId, updateFields);

    if (!updatedExercise) {
        // Check if the exercise exists at all
        const exists = await exercises.findExerciseById(exerciseId, userId);
        if (!exists) {
            throw new Error("Exercise not found.");
        } else {
            throw new Error("Exercise found, but permission denied for update (wrong user or plan).");
        }
    }

    // Map the updated document back to the API response type
    return mapToExerciseBase(updatedExercise);
};

// --- Delete Exercise from Plan ---
export const deleteExerciseFromPlan = async (
    params: DeleteExerciseRequest,
    context: ApiHandlerContext
): Promise<DeleteExerciseResponse> => {
    const { userId } = context;
    const { exerciseId, trainingPlanId } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(exerciseId)) throw new Error("Invalid Exercise ID format.");

    if (!await validatePlanOwnership(trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    // Use the new database layer to delete the exercise
    const deleted = await exercises.deleteExercise(exerciseId, userId, trainingPlanId);

    if (!deleted) {
        // Check if the exercise exists but belongs to another user/plan, or doesn't exist
        const exists = await exercises.findExerciseById(exerciseId, userId);
        if (!exists) {
            return { success: false, message: "Exercise not found." };
        } else {
            return { success: false, message: "Permission denied to delete this exercise (wrong user or plan)." };
        }
    }

    return { success: true, message: "Exercise deleted successfully." };
};

// Export names for registration
export { getExercisesApiName, addExerciseApiName, updateExerciseApiName, deleteExerciseApiName }; 