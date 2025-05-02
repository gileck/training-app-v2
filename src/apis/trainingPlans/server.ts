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
    DuplicateTrainingPlanResponse
} from './types';
import { name as baseName } from './index';

// --- API Names ---
export const getAllApiName = `${baseName}/getAll`;
export const getByIdApiName = `${baseName}/getById`;
export const createApiName = `${baseName}/create`;
export const updateApiName = `${baseName}/update`;
export const deleteApiName = `${baseName}/delete`;
export const duplicateApiName = `${baseName}/duplicate`;

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

    try {
        const db = await getDb();
        const now = new Date();
        const newPlanDoc = {
            userId: new ObjectId(context.userId),
            name: params.name,
            durationWeeks: params.durationWeeks,
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
        return { success: false, error: "Unauthorized" };
    }
    if (!params.planId) {
        return { success: false, error: "Plan ID is required." };
    }
    if (!ObjectId.isValid(params.planId)) {
        return { success: false, error: "Invalid Plan ID format." };
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
            return { success: false, error: "Training plan not found or access denied." };
        }

    } catch (error) {
        await session.endSession();
        console.error("Error deleting training plan:", error);
        return { success: false, error: `Failed to delete training plan: ${error instanceof Error ? error.message : String(error)}` };
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

            // 2. Create the new plan document (adjust name, reset dates)
            const now = new Date();
            const newPlanData = {
                userId: userIdObj,
                name: `${originalPlan.name} (Copy)`,
                durationWeeks: originalPlan.durationWeeks,
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

            // 4. Create new exercise documents linked to the new plan
            if (originalExercises.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newExerciseDocs = originalExercises.map((ex: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _id, ...rest } = ex; // Destructure ok, but _id var unused
                    return {
                        ...rest,
                        _id: new ObjectId(),
                        planId: newPlanId,
                        createdAt: now,
                        updatedAt: now,
                    };
                });
                await db.collection('exercises').insertMany(newExerciseDocs, { session });
            }

            // Retrieve the full new plan document to return
            newPlan = await db.collection<TrainingPlan>('trainingPlans').findOne({ _id: newPlanId }, { session });
            if (!newPlan) {
                throw new Error("Failed to retrieve duplicated plan after creation.");
            }
        });
        await session.endSession();

        if (newPlan) {
            return newPlan;
        } else {
            return { error: "Duplication failed unexpectedly." };
        }

    } catch (error) {
        await session.endSession();
        console.error("Error duplicating training plan:", error);
        return { error: `Failed to duplicate training plan: ${error instanceof Error ? error.message : String(error)}` };
    }
}; 