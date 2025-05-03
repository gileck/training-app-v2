import { Db, ObjectId } from 'mongodb';
import { getDb, getMongoClient } from '@/server/database';
import { ApiHandlerContext } from '@/apis/types';
import {
    TrainingPlan,
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

// --- Helper: Ensure Plan Ownership & Existence ---
async function getPlanAndCheckOwnership(db: Db, planId: string, userId: string): Promise<TrainingPlan | null> {
    if (!ObjectId.isValid(planId)) {
        return null; // Invalid ID format
    }
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid User ID format in context"); // Should not happen if middleware is correct
    }

    const plan = await db.collection<TrainingPlan>('trainingPlans').findOne({
        _id: new ObjectId(planId),
        userId: new ObjectId(userId) // Check ownership
    });
    return plan;
}

// --- API Handlers ---

/**
 * Task 15: Get all training plans for the logged-in user
 */
export const getAllTrainingPlans = async (_params: GetAllTrainingPlansRequest, context: ApiHandlerContext): Promise<GetAllTrainingPlansResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized" };
    }
    try {
        const db = await getDb();
        const plans = await db.collection<TrainingPlan>('trainingPlans').find({ userId: new ObjectId(context.userId) }).sort({ createdAt: -1 }).toArray();
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
        const db = await getDb();
        const plan = await getPlanAndCheckOwnership(db, params.planId, context.userId);

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

    const userIdObj = new ObjectId(context.userId);

    try {
        const db = await getDb();

        // Check if this is the user's first plan
        const existingPlanCount = await db.collection('trainingPlans').countDocuments({ userId: userIdObj });
        const isFirstPlan = existingPlanCount === 0;

        const now = new Date();
        const newPlanDoc: Omit<TrainingPlan, '_id'> = { // Use Omit to ensure all fields are covered
            userId: userIdObj,
            name: params.name,
            durationWeeks: params.durationWeeks,
            isActive: isFirstPlan, // Set isActive based on whether it's the first plan
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('trainingPlans').insertOne(newPlanDoc);

        if (!result.insertedId) {
            throw new Error("Failed to insert training plan.");
        }

        const createdPlan: TrainingPlan = {
            _id: result.insertedId,
            ...newPlanDoc,
        };
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
        const db = await getDb();
        // Verify ownership before update
        const existingPlan = await getPlanAndCheckOwnership(db, params.planId, context.userId);
        if (!existingPlan) {
            return { error: "Training plan not found or access denied." };
        }

        const updates: Partial<TrainingPlan> = {};
        if (params.name) updates.name = params.name;
        if (params.durationWeeks !== undefined) updates.durationWeeks = params.durationWeeks;
        updates.updatedAt = new Date();

        const result = await db.collection<TrainingPlan>('trainingPlans').findOneAndUpdate(
            { _id: new ObjectId(params.planId) }, // Filter by ID (ownership already checked)
            { $set: updates },
            { returnDocument: 'after' } // Return the updated document
        );

        if (!result) {
            // Should not happen if findOne worked, but check anyway
            return { error: "Update failed or plan not found." };
        }

        return result as TrainingPlan; // Cast because returnDocument: 'after' guarantees it

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

    const planIdObj = new ObjectId(params.planId);
    const userIdObj = new ObjectId(context.userId);
    const mongoClient = await getMongoClient();
    const session = mongoClient.startSession();

    try {
        let deletedCount = 0;
        await session.withTransaction(async () => {
            const db = mongoClient.db();
            // 1. Verify ownership & existence of the plan itself
            const plan = await db.collection('trainingPlans').findOne({ _id: planIdObj, userId: userIdObj }, { session });
            if (!plan) {
                throw new Error("Training plan not found or access denied.");
            }

            // 4. Get exerciseIds BEFORE deleting exercises
            const exerciseIds = await db.collection('exercises').find({ planId: planIdObj }, { projection: { _id: 1 }, session }).map(ex => ex._id).toArray();

            // 2. Delete associated Exercises
            await db.collection('exercises').deleteMany({ planId: planIdObj }, { session });

            // 3. Delete associated Weekly Progress
            await db.collection('weeklyProgress').deleteMany({ planId: planIdObj, userId: userIdObj }, { session });

            // 4. Delete associated Daily Logs
            if (exerciseIds.length > 0) {
                await db.collection('exerciseActivityLog').deleteMany({ exerciseId: { $in: exerciseIds }, userId: userIdObj }, { session });
            }

            // 5. Delete the Training Plan itself
            const deleteResult = await db.collection('trainingPlans').deleteOne({ _id: planIdObj, userId: userIdObj }, { session });
            deletedCount = deleteResult.deletedCount;
        });

        await session.endSession();

        if (deletedCount > 0) {
            return { success: true, message: "Training plan and associated data deleted." };
        } else {
            return { success: false, message: "Training plan not found or access denied (during delete)." };
        }

    } catch (error) {
        await session.endSession();
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

    const originalPlanIdObj = new ObjectId(params.planId);
    const userIdObj = new ObjectId(context.userId);
    const mongoClient = await getMongoClient();
    const session = mongoClient.startSession();

    try {
        let newPlan: TrainingPlan | null = null;
        await session.withTransaction(async () => {
            const db = mongoClient.db();
            // 1. Find the original plan and check ownership
            const originalPlan = await db.collection<TrainingPlan>('trainingPlans').findOne({ _id: originalPlanIdObj, userId: userIdObj }, { session });
            if (!originalPlan) {
                throw new Error("Original training plan not found or access denied.");
            }

            // 2. Create the new plan document (adjust name, reset dates, set isActive to false)
            const now = new Date();
            const newPlanData: Omit<TrainingPlan, '_id'> = {
                userId: userIdObj,
                name: `${originalPlan.name} (Copy)`,
                durationWeeks: originalPlan.durationWeeks,
                isActive: false, // Ensure duplicated plan is not active
                createdAt: now,
                updatedAt: now,
            };
            const insertPlanResult = await db.collection('trainingPlans').insertOne(newPlanData, { session });
            if (!insertPlanResult.insertedId) {
                throw new Error("Failed to insert new training plan.");
            }
            const newPlanId = insertPlanResult.insertedId;

            // 3. Find original exercises
            const originalExercises = await db.collection('exercises').find({ planId: originalPlanIdObj }, { session }).toArray();

            // 4. Create new exercises linked to the new plan
            if (originalExercises.length > 0) {
                const newExercises = originalExercises.map(ex => ({
                    ...ex,
                    _id: new ObjectId(), // Generate new ID for the exercise copy
                    planId: newPlanId, // Link to the new plan
                    createdAt: now,
                    updatedAt: now,
                }));
                await db.collection('exercises').insertMany(newExercises, { session });
            }

            // Store the complete new plan to return later
            newPlan = { _id: newPlanId, ...newPlanData };
        });

        await session.endSession();

        if (newPlan) {
            return newPlan;
        } else {
            // This case should ideally not be reached if the transaction succeeded without error
            // but the plan wasn't assigned. Log an error if it happens.
            console.error("Duplicate transaction completed but new plan data is missing.");
            return { error: "Failed to retrieve duplicated plan data after transaction." };
        }

    } catch (error) {
        await session.endSession();
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

    const planIdObj = new ObjectId(params.planId);
    const userIdObj = new ObjectId(context.userId);

    try {
        const db = await getDb();

        // 1. Verify the target plan exists and belongs to the user
        const targetPlan = await db.collection<TrainingPlan>('trainingPlans').findOne({ _id: planIdObj, userId: userIdObj });
        if (!targetPlan) {
            return { success: false, message: "Training plan not found or access denied." };
        }

        // 2. Use bulkWrite for atomic update
        const bulkOps = [
            {
                // Deactivate all other plans for this user
                updateMany: {
                    filter: { userId: userIdObj, _id: { $ne: planIdObj }, isActive: true },
                    update: { $set: { isActive: false, updatedAt: new Date() } }
                }
            },
            {
                // Activate the target plan
                updateOne: {
                    filter: { _id: planIdObj, userId: userIdObj },
                    update: { $set: { isActive: true, updatedAt: new Date() } }
                }
            }
        ];

        const result = await db.collection('trainingPlans').bulkWrite(bulkOps, { ordered: false });

        // Check results (optional but good practice)
        if (result.modifiedCount === undefined || result.modifiedCount < 1) {
            console.warn("Set active plan operation resulted in no modifications. Plan might have already been active.")
        }

        return { success: true, message: "Training plan set as active." };

    } catch (error) {
        console.error("Error setting active training plan:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Failed to set active training plan: ${errorMessage}` };
    }
};

/**
 * Task X: Get the Active Training Plan for the User
 */
export const getActiveTrainingPlan = async (
    _params: Record<string, never>, // No params needed
    context: ApiHandlerContext
): Promise<GetActiveTrainingPlanResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized", plan: null };
    }

    const userIdObj = new ObjectId(context.userId);

    try {
        const db = await getDb();

        // Find the plan marked as active for this user
        const activePlan = await db.collection<TrainingPlan>('trainingPlans').findOne({
            userId: userIdObj,
            isActive: true
        });

        if (!activePlan) {
            // It's okay if no plan is active, return null plan
            return { plan: null };
        }

        return activePlan; // Return the found active plan

    } catch (error) {
        console.error("Error getting active training plan:", error);
        return { error: `Failed to retrieve active training plan: ${error instanceof Error ? error.message : String(error)}`, plan: null };
    }
}; 