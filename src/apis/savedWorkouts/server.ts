import { getDb } from '@/server/database';
import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { ExerciseBase } from '../exercises/types';
import {
    name,
    getAllApiName,
    getDetailsApiName,
    createApiName,
    deleteApiName
} from './index';
import {
    SavedWorkout,
    GetAllSavedWorkoutsRequest,
    GetAllSavedWorkoutsResponse,
    GetSavedWorkoutDetailsRequest,
    GetSavedWorkoutDetailsResponse,
    CreateSavedWorkoutRequest,
    CreateSavedWorkoutResponse,
    DeleteSavedWorkoutRequest,
    DeleteSavedWorkoutResponse,
    SavedWorkoutWithExercises
} from './types';

// No need to define API names here, they're imported from index.ts

// Export base name as well
export { name, getAllApiName, getDetailsApiName, createApiName, deleteApiName };

// --- Task 29: API endpoint to get all saved workouts for the user ---
export const getAllSavedWorkouts = async (
    _params: GetAllSavedWorkoutsRequest,
    context: ApiHandlerContext
): Promise<GetAllSavedWorkoutsResponse> => {
    if (!context.userId) {
        throw new Error("User not authenticated");
    }

    const userIdObj = new ObjectId(context.userId);
    const db = await getDb();

    try {
        const workouts = await db.collection<SavedWorkout>('savedWorkouts')
            .find({ userId: userIdObj })
            .sort({ createdAt: -1 })
            .toArray();

        return workouts;
    } catch (error) {
        console.error("Error getting saved workouts:", error);
        return [];
    }
};

// --- Task 32: API endpoint to get details of a saved workout (including exercise details) ---
export const getSavedWorkoutDetails = async (
    params: GetSavedWorkoutDetailsRequest,
    context: ApiHandlerContext
): Promise<GetSavedWorkoutDetailsResponse> => {
    const { userId } = context;
    const { workoutId } = params;

    if (!userId) {
        throw new Error("User not authenticated");
    }

    if (!workoutId || !ObjectId.isValid(workoutId)) {
        throw new Error("Invalid workout ID");
    }

    try {
        const db = await getDb();
        const userIdObj = new ObjectId(userId);
        const workoutIdObj = new ObjectId(workoutId);

        // Find the saved workout
        const savedWorkout = await db.collection<SavedWorkout>('savedWorkouts').findOne({
            _id: workoutIdObj,
            userId: userIdObj
        });

        if (!savedWorkout) {
            return null;
        }

        // Fetch the exercises for this saved workout
        const exerciseIds = savedWorkout.exerciseIds.map(id => id);
        const exercises = await db.collection('exercises')
            .find({ _id: { $in: exerciseIds } })
            .toArray();

        // Build the response with full exercise details
        const result: SavedWorkoutWithExercises = {
            ...savedWorkout,
            exercises: exercises as ExerciseBase[]
        };

        return result;
    } catch {
        throw new Error("Failed to fetch saved workout details");
    }
};

// --- Task 30: API endpoint to create a saved workout from selected exercise IDs ---
export const createSavedWorkout = async (
    params: CreateSavedWorkoutRequest,
    context: ApiHandlerContext
): Promise<CreateSavedWorkoutResponse> => {
    if (!context.userId) {
        return { error: "User not authenticated" };
    }

    if (!params.name || !params.exerciseIds || params.exerciseIds.length === 0) {
        return { error: "Name and at least one exercise are required" };
    }

    const userIdObj = new ObjectId(context.userId);
    const db = await getDb();

    // Convert exercise ID strings to ObjectIds
    const exerciseObjectIds: ObjectId[] = [];
    try {
        for (const idStr of params.exerciseIds) {
            if (ObjectId.isValid(idStr)) {
                exerciseObjectIds.push(new ObjectId(idStr));
            } else {
                return { error: `Invalid exercise ID format: ${idStr}` };
            }
        }

        // Verify all exercises exist and belong to the user
        const exerciseCount = await db.collection('exercises').countDocuments({
            _id: { $in: exerciseObjectIds },
            userId: userIdObj
        });

        if (exerciseCount !== exerciseObjectIds.length) {
            return { error: "One or more exercises do not exist or do not belong to this user" };
        }

        const now = new Date();
        const newWorkout: Omit<SavedWorkout, '_id'> = {
            userId: userIdObj,
            name: params.name,
            description: params.description,
            exerciseIds: exerciseObjectIds,
            createdAt: now,
            updatedAt: now
        };

        const result = await db.collection('savedWorkouts').insertOne(newWorkout as SavedWorkout);

        if (!result.insertedId) {
            throw new Error("Failed to insert workout");
        }

        const createdWorkout: SavedWorkout = {
            _id: result.insertedId,
            ...newWorkout
        };

        return createdWorkout;
    } catch (error) {
        console.error("Error creating saved workout:", error);
        return { error: `Failed to create saved workout: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// --- Task 31: API endpoint to delete a saved workout ---
export const deleteSavedWorkout = async (
    params: DeleteSavedWorkoutRequest,
    context: ApiHandlerContext
): Promise<DeleteSavedWorkoutResponse> => {
    if (!context.userId) {
        return { success: false, message: "User not authenticated" };
    }

    if (!params.workoutId || !ObjectId.isValid(params.workoutId)) {
        return { success: false, message: "Invalid workout ID format" };
    }

    const userIdObj = new ObjectId(context.userId);
    const workoutIdObj = new ObjectId(params.workoutId);
    const db = await getDb();

    try {
        const result = await db.collection('savedWorkouts').deleteOne({
            _id: workoutIdObj,
            userId: userIdObj
        });

        if (result.deletedCount === 0) {
            return {
                success: false,
                message: "Workout not found or you don't have permission to delete it"
            };
        }

        return {
            success: true,
            message: "Workout deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting saved workout:", error);
        return {
            success: false,
            message: `Failed to delete workout: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}; 