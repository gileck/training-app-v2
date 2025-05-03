import { Db, ObjectId } from 'mongodb';
import { getDb } from '@/server/database'; // Assuming getDb fetches the native Db instance
import { ApiHandlerContext } from '../types';
import {
    GetExercisesRequest, GetExercisesResponse,
    AddExerciseRequest, AddExerciseResponse,
    UpdateExerciseRequest, UpdateExerciseResponse,
    DeleteExerciseRequest, DeleteExerciseResponse,
    ExerciseBase
} from './types';
import { name as getExercisesApiName, nameAdd as addExerciseApiName, nameUpdate as updateExerciseApiName, nameDelete as deleteExerciseApiName } from './index';
// Define the structure expected in the 'exercises' collection
// Align this with database-schema.md and ExerciseBase type
interface ExerciseDocument {
    _id: ObjectId;
    userId: ObjectId;
    // Use planId and definitionId as per database-schema.md
    planId: ObjectId; // Changed from trainingPlanId to match schema
    definitionId: ObjectId; // Changed from exerciseDefinitionId to match schema
    sets: number;
    reps: string; // Schema uses string for reps (e.g., "8-12")
    weight?: string; // Optional
    durationSeconds?: number; // Optional
    targetMusclesOverride?: string[]; // Optional
    comments?: string; // Optional
    orderInPlan?: number; // Schema uses orderInPlan
    createdAt: Date;
    updatedAt: Date;
}

// Helper to validate ownership and plan existence using MongoDB driver
async function validatePlanOwnership(db: Db, planId: string, userId: string): Promise<boolean> {
    if (!userId || !ObjectId.isValid(userId)) {
        console.error('Invalid userId provided to validatePlanOwnership');
        return false;
    }
    if (!ObjectId.isValid(planId)) {
        return false;
    }
    const plan = await db.collection('trainingPlans').findOne({ _id: new ObjectId(planId), userId: new ObjectId(userId) });
    return !!plan;
}

// Helper to map DB doc to API response type (ExerciseBase)
function mapDocumentToExerciseBase(doc: ExerciseDocument): ExerciseBase {
    // Perform necessary transformations (e.g., string reps/weight to number if needed by ExerciseBase)
    // For now, assuming ExerciseBase aligns or can handle the schema types
    return {
        _id: doc._id,
        userId: doc.userId,
        trainingPlanId: doc.planId, // Map planId from DB doc to trainingPlanId in Base type
        exerciseDefinitionId: doc.definitionId, // Map definitionId
        sets: doc.sets,
        // Need to decide how to handle string reps/weight if ExerciseBase expects numbers
        // This basic mapping keeps them as they are in the document for now.
        reps: parseInt(doc.reps, 10) || 0, // Example: Attempt to parse reps string to number
        weight: doc.weight ? parseFloat(doc.weight) : undefined, // Example: Attempt to parse weight string to number
        restTimeSeconds: doc.durationSeconds, // Map durationSeconds
        order: doc.orderInPlan || 0, // Map orderInPlan, provide default
        comments: doc.comments,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
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

    const db = await getDb();
    if (!await validatePlanOwnership(db, trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    const planIdObj = new ObjectId(trainingPlanId);
    const userIdObj = new ObjectId(userId);

    const exercisesCursor = db.collection<ExerciseDocument>('exercises').find({
        planId: planIdObj,
        userId: userIdObj // Assuming userId is also stored on exercises for ownership check
    }).sort({ orderInPlan: 1 }); // Sort by orderInPlan

    const exercisesArray = await exercisesCursor.toArray();

    // Map documents to the API response type
    return exercisesArray.map(mapDocumentToExerciseBase);
};

// --- Add Exercise to Plan ---
export const addExerciseToPlan = async (
    params: AddExerciseRequest,
    context: ApiHandlerContext
): Promise<AddExerciseResponse> => {
    const { userId } = context;
    const { trainingPlanId, exerciseDefinitionId, sets, reps, weight, restTimeSeconds, comments } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(exerciseDefinitionId)) throw new Error("Invalid Exercise Definition ID format.");

    const db = await getDb();
    if (!await validatePlanOwnership(db, trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    // Optional: Verify exerciseDefinitionId exists in 'exerciseDefinitions' collection
    // const definitionExists = await db.collection('exerciseDefinitions').findOne({ _id: new ObjectId(exerciseDefinitionId) });
    // if (!definitionExists) throw new Error("Exercise Definition not found.");

    const planIdObj = new ObjectId(trainingPlanId);
    const userIdObj = new ObjectId(userId);

    // Determine the order for the new exercise
    const lastExercise = await db.collection<ExerciseDocument>('exercises').findOne(
        { planId: planIdObj, userId: userIdObj },
        { sort: { orderInPlan: -1 }, projection: { orderInPlan: 1 } }
    );
    const order = lastExercise?.orderInPlan ? lastExercise.orderInPlan + 1 : 1;

    const now = new Date();
    const newExerciseDoc: Omit<ExerciseDocument, '_id'> = {
        userId: userIdObj,
        planId: planIdObj,
        definitionId: new ObjectId(exerciseDefinitionId),
        sets,
        reps: String(reps), // Convert number reps to string for schema
        orderInPlan: order,
        createdAt: now,
        updatedAt: now,
        ...(weight !== undefined && { weight: String(weight) }), // Convert number weight to string
        ...(restTimeSeconds !== undefined && { durationSeconds: restTimeSeconds }),
        ...(comments !== undefined && { comments }),
    };

    const result = await db.collection<ExerciseDocument>('exercises').insertOne(newExerciseDoc as ExerciseDocument);

    if (!result.insertedId) {
        throw new Error("Failed to insert exercise.");
    }

    const createdDoc = { ...newExerciseDoc, _id: result.insertedId };

    // Map the created document back to the API response type
    return mapDocumentToExerciseBase(createdDoc);
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

    const db = await getDb();
    // Validate plan ownership first
    if (!await validatePlanOwnership(db, trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    const exerciseIdObj = new ObjectId(exerciseId);
    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(trainingPlanId);

    // Construct the $set update object, converting API types to DB types if needed
    const updateFields: Partial<ExerciseDocument> = {};
    if (updates.sets !== undefined) updateFields.sets = updates.sets;
    if (updates.reps !== undefined) updateFields.reps = String(updates.reps); // Convert to string
    if (updates.weight !== undefined) updateFields.weight = String(updates.weight); // Convert to string
    if (updates.restTimeSeconds !== undefined) updateFields.durationSeconds = updates.restTimeSeconds;
    if (updates.order !== undefined) updateFields.orderInPlan = updates.order;
    if (updates.comments !== undefined) updateFields.comments = updates.comments;

    if (Object.keys(updateFields).length === 0) {
        throw new Error("No valid fields provided for update.");
    }

    updateFields.updatedAt = new Date();

    const result = await db.collection<ExerciseDocument>('exercises').findOneAndUpdate(
        {
            _id: exerciseIdObj,
            userId: userIdObj, // Ensure user owns the exercise
            planId: planIdObj // Ensure exercise belongs to the correct plan
        },
        { $set: updateFields },
        { returnDocument: 'after' } // Return the updated document
    );

    if (!result) {
        // Check if the exercise exists but belongs to another user/plan, or doesn't exist
        const exists = await db.collection('exercises').findOne({ _id: exerciseIdObj });
        if (!exists) {
            throw new Error("Exercise not found.");
        } else {
            throw new Error("Exercise found, but permission denied for update (wrong user or plan).");
        }
    }

    // Map the updated document back to the API response type
    return mapDocumentToExerciseBase(result as ExerciseDocument); // Cast needed as findOneAndUpdate returns generic Document
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

    const db = await getDb();
    if (!await validatePlanOwnership(db, trainingPlanId, userId)) {
        throw new Error("Training Plan not found or user does not have permission.");
    }

    const exerciseIdObj = new ObjectId(exerciseId);
    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(trainingPlanId);

    const result = await db.collection('exercises').deleteOne({
        _id: exerciseIdObj,
        userId: userIdObj, // Ensure user owns the exercise
        planId: planIdObj // Ensure exercise belongs to the correct plan
    });

    if (result.deletedCount === 0) {
        console.warn(`Attempted to delete non-existent or unauthorized exercise: ${exerciseId} by user: ${userId}`);
        // Check if the exercise exists but belongs to another user/plan, or doesn't exist
        const exists = await db.collection('exercises').findOne({ _id: exerciseIdObj });
        if (!exists) {
            return { success: false, message: "Exercise not found." };
        } else {
            return { success: false, message: "Permission denied to delete this exercise (wrong user or plan)." };
        }
    }

    // Optional: Consider re-ordering remaining exercises if necessary

    return { success: true };
};

// Export names for registration
export { getExercisesApiName, addExerciseApiName, updateExerciseApiName, deleteExerciseApiName }; 