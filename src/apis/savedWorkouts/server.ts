import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { ExerciseBase } from '../exercises/types';
import {
    name,
    getAllApiName,
    getDetailsApiName,
    createApiName,
    deleteApiName,
    addExerciseApiName,
    removeExerciseApiName,
    renameApiName
} from './index';
import {
    SavedWorkout,
    GetAllSavedWorkoutsRequest,
    GetSavedWorkoutDetailsRequest,
    GetSavedWorkoutDetailsResponse,
    CreateSavedWorkoutRequest,
    CreateSavedWorkoutResponse,
    DeleteSavedWorkoutRequest,
    DeleteSavedWorkoutResponse,
    SavedWorkoutWithExercises,
    AddExerciseToSavedWorkoutRequest,
    AddExerciseToSavedWorkoutResponse,
    RemoveExerciseFromSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutResponse,
    RenameSavedWorkoutRequest,
    RenameSavedWorkoutResponse,
} from './types';
import { savedWorkouts, exerciseDefinitions, exercises, getDb } from "@/server/database";
import { ExerciseDefinition } from '../exerciseDefinitions/types';

// No need to define API names here, they're imported from index.ts

// Export base name as well
export { name, getAllApiName, getDetailsApiName, createApiName, deleteApiName, addExerciseApiName, removeExerciseApiName, renameApiName };

// Helper to map DB SavedWorkout to API SavedWorkout
function mapToApiSavedWorkout(workout: savedWorkouts.SavedWorkout): SavedWorkout {
    return {
        _id: workout._id,
        userId: workout.userId,
        name: workout.name,
        exercises: workout.exercises, // Use exercises array directly
        trainingPlanId: workout.planId,
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
    };
}

// Helper to validate ObjectId
const isValidObjectId = (id: string) => ObjectId.isValid(id) && new ObjectId(id).toString() === id;

// Utility function to convert to ObjectId
const toObjectId = (id: string) => new ObjectId(id);

// --- Task 29: API endpoint to get all saved workouts for the user ---
export const getAllSavedWorkouts = async (
    params: GetAllSavedWorkoutsRequest,
    context: ApiHandlerContext
): Promise<SavedWorkout[]> => {
    const { userId } = context;
    if (!userId) {
        console.error("User not authenticated for getAllSavedWorkouts");
        return [];
    }
    const userIdObj = new ObjectId(userId);

    let trainingPlanIdObj: ObjectId | undefined = undefined;
    if (params.trainingPlanId) {
        if (ObjectId.isValid(params.trainingPlanId)) {
            trainingPlanIdObj = new ObjectId(params.trainingPlanId);
        } else {
            console.warn(
                "Invalid trainingPlanId format provided to getAllSavedWorkouts:",
                params.trainingPlanId
            );
            // Potentially return error or empty array if strict checking is desired
        }
    }

    const filter: { planId?: ObjectId } | undefined = trainingPlanIdObj
        ? { planId: trainingPlanIdObj }
        : undefined;

    try {
        const workoutDocs = await savedWorkouts.findSavedWorkoutsForUser(userIdObj, filter);
        return workoutDocs.map(mapToApiSavedWorkout);
    } catch (error) {
        console.error("Error fetching saved workouts:", error);
        return []; // Or throw a more specific error
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
        // Get the saved workout from the database layer
        const savedWorkout = await savedWorkouts.findSavedWorkoutById(workoutId, userId);

        if (!savedWorkout) {
            return null;
        }
        
        // Ensure planId exists on savedWorkout from DB
        if (!savedWorkout.planId) {
            console.error(`SavedWorkout ${savedWorkout._id} is missing planId.`);
            throw new Error(`SavedWorkout ${savedWorkout._id} is missing planId.`);
        }

        // Get the exercise IDs from the saved workout exercises
        const exerciseIds = savedWorkout.exercises.map(exercise => exercise.exerciseId);

        // Fetch exercise details for each exercise ID
        const exercisesArray: ExerciseBase[] = [];

        for (const exerciseId of exerciseIds) {
            // Get the exercise first - must pass userId for permission check
            const exercise = await exercises.findExerciseById(exerciseId, savedWorkout.userId);
            
            if (exercise && exercise.definitionId) {
                // Get the definition details using the definition ID from the exercise
                const definition = await exerciseDefinitions.findExerciseDefinitionById(exercise.definitionId);
                
                if (definition) {
                    // Create a basic ExerciseBase object
                    const exerciseBase: ExerciseBase = {
                        _id: exerciseId, // Use the actual exercise ID
                        userId: savedWorkout.userId,
                        trainingPlanId: savedWorkout.planId,
                        exerciseDefinitionId: exercise.definitionId,
                        sets: exercise.sets || 0,
                        reps: parseInt(exercise.reps) || 0, // reps is a string in Exercise type
                        order: savedWorkout.exercises.find(e => e.exerciseId.equals(exerciseId))?.order || 0,
                        createdAt: exercise.createdAt,
                        updatedAt: exercise.updatedAt
                    };
                    exercisesArray.push(exerciseBase);
                }
            }
        }

        // Build the response with full exercise details
        const result: SavedWorkoutWithExercises = {
            _id: savedWorkout._id,
            userId: savedWorkout.userId,
            name: savedWorkout.name,
            trainingPlanId: savedWorkout.planId,
            exercises: exercisesArray,
            createdAt: savedWorkout.createdAt,
            updatedAt: savedWorkout.updatedAt
        };

        return result;
    } catch (error) {
        console.error("Failed to fetch saved workout details:", error);
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

    // Updated validation: Only require name and trainingPlanId.
    // exerciseIds can be an empty array for creating an empty workout shell.
    if (!params.name || !params.trainingPlanId) {
        return { error: "Name and Training Plan ID are required" };
    }

    if (!ObjectId.isValid(params.trainingPlanId)) {
        return { error: "Invalid Training Plan ID format" };
    }

    try {
        const userIdObj = new ObjectId(context.userId);
        const trainingPlanIdObj = new ObjectId(params.trainingPlanId);

        // Convert exercise ID strings to ObjectIds
        const exerciseObjectIds: ObjectId[] = [];
        for (const idStr of params.exerciseIds) {
            if (ObjectId.isValid(idStr)) {
                exerciseObjectIds.push(new ObjectId(idStr));
            } else {
                console.error(`Invalid exercise ID format: ${idStr}`);
                return { error: `Invalid exercise ID format: ${idStr}` };
            }
        }

        // Create the exercises array with definition IDs
        const exercisesArray: savedWorkouts.SavedWorkoutExercise[] = [];

        // Get each exercise individually using the proper function
        for (let i = 0; i < exerciseObjectIds.length; i++) {
            const exerciseId = exerciseObjectIds[i]; // Renamed for clarity, this IS the definitionId
            exercisesArray.push({
                exerciseId,
                order: i + 1
            });
        }
        if (exercisesArray.length === 0 && params.exerciseIds.length > 0) {
            return { error: "Could not create workout with the provided exercises" };
        }
        const now = new Date();
        const newWorkout: savedWorkouts.SavedWorkoutCreate = {
            userId: userIdObj,
            name: params.name,
            planId: trainingPlanIdObj,
            exercises: exercisesArray,
            createdAt: now,
            updatedAt: now
        };

        // Use the database layer to create the saved workout
        const createdWorkout = await savedWorkouts.insertSavedWorkout(newWorkout);

        // Map back to API format
        return mapToApiSavedWorkout(createdWorkout);
    } catch (error) {
        console.error("Error creating saved workout:", error);
        return { error: `Failed to create saved workout: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// --- API endpoint to add an exercise to a saved workout ---
export const addExerciseToSavedWorkout = async (
    params: AddExerciseToSavedWorkoutRequest,
    { userId }: ApiHandlerContext
): Promise<AddExerciseToSavedWorkoutResponse> => {
    const { workoutId, exerciseId } = params;

    if (!userId) {
        return { error: 'User not authenticated' };
    }

    if (!isValidObjectId(workoutId) || !isValidObjectId(exerciseId)) {
        return { error: 'Invalid workout ID or exercise ID format.' };
    }

    try {
        // First check if the exercise exists
        const exercise = await exercises.findExerciseById(exerciseId, userId);
        if (!exercise) {
            return { error: 'Exercise not found.' };
        }

        // Use the database layer function to add the exercise to the workout
        // This function already handles checking for duplicates and adding the exercise with proper order
        const updatedWorkout = await savedWorkouts.addExerciseToSavedWorkout(
            workoutId,
            userId,
            exerciseId
        );

        if (!updatedWorkout) {
            return { error: 'Workout not found or could not be updated.' };
        }

        // Return a simple success response
        return { 
            success: true, 
            message: 'Exercise added to workout successfully.' 
        };

    } catch (error) {
        console.error('Error in addExerciseToSavedWorkout:', error);
        return { error: error instanceof Error ? error.message : 'An unexpected error occurred.' };
    }
};

// --- API endpoint to remove an exercise from a saved workout ---
export const removeExerciseFromSavedWorkout = async (
    params: RemoveExerciseFromSavedWorkoutRequest,
    context: ApiHandlerContext
): Promise<RemoveExerciseFromSavedWorkoutResponse> => {
    const { userId } = context;
    const { workoutId, exerciseIdToRemove } = params;

    if (!userId) {
        return { error: "User not authenticated" };
    }

    if (!workoutId || !ObjectId.isValid(workoutId)) {
        return { error: "Invalid workout ID provided." };
    }
    if (!exerciseIdToRemove || !ObjectId.isValid(exerciseIdToRemove)) {
        return { error: "Invalid exercise ID to remove." };
    }

    try {
        const userObjectId = new ObjectId(userId);
        const workoutObjectId = new ObjectId(workoutId);
        const exerciseIdToRemoveObjectId = new ObjectId(exerciseIdToRemove);

        // Fetch the existing workout from the database
        const existingWorkout = await savedWorkouts.findSavedWorkoutById(workoutObjectId.toHexString(), userObjectId);

        if (!existingWorkout) {
            return { error: "Saved workout not found." };
        }

        // Ensure exercises array exists
        if (!existingWorkout.exercises) {
            existingWorkout.exercises = [];
        }

        // Find the index of the first exercise matching the definitionId to remove
        // Find the exercise with the matching exerciseId
        const exerciseIndexToRemove = existingWorkout.exercises.findIndex(ex => {
            return !!ex.exerciseId && ex.exerciseId.equals(exerciseIdToRemoveObjectId);
        });

        if (exerciseIndexToRemove === -1) {
            return { error: "Exercise not found in this workout." };
        }

        // Remove the exercise from the array
        existingWorkout.exercises.splice(exerciseIndexToRemove, 1);

        // Re-calculate order for remaining exercises if 'order' field is used and needs to be sequential
        // For simplicity, if 'order' exists, we can re-index it.
        // This part depends on how 'order' is managed. If it's not strictly sequential or not present, this can be skipped.
        existingWorkout.exercises.forEach((ex, index) => {
            if (typeof ex.order !== 'undefined') {
                ex.order = index + 1; // Assuming order is 1-based
            }
        });


        // Update the workout in the database
        // The `updateSavedWorkout` method should accept the `exercises` array.
        // This is a potential point of error if the DB method expects a different structure.
        const updated = await savedWorkouts.updateSavedWorkout(workoutObjectId.toHexString(), userObjectId, {
            exercises: existingWorkout.exercises,
            updatedAt: new Date()
        });

        if (!updated) {
            return { error: "Failed to update the workout in the database." };
        }

        // Fetch the updated workout details to return the full SavedWorkoutWithExercises object
        const updatedWorkoutDetails = await getSavedWorkoutDetails({ workoutId: workoutObjectId.toHexString() }, context);

        if (!updatedWorkoutDetails) {
            return { error: "Failed to retrieve updated workout details after removing exercise." };
        }

        return updatedWorkoutDetails;

    } catch (error) {
        console.error("Error removing exercise from saved workout:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return { error: `Server error: ${errorMessage}` };
    }
};

// --- API endpoint to rename a saved workout ---
export const renameSavedWorkout = async (
    params: RenameSavedWorkoutRequest,
    context: ApiHandlerContext
): Promise<RenameSavedWorkoutResponse> => {
    const { userId } = context;
    const { workoutId, newName } = params;

    if (!userId) {
        return { error: "User not authenticated" };
    }
    if (!workoutId || !ObjectId.isValid(workoutId)) {
        return { error: "Invalid workout ID" };
    }
    if (!newName || newName.trim().length === 0) {
        return { error: "New name cannot be empty" };
    }
    if (newName.length > 100) { // Basic validation for name length
        return { error: "New name is too long (max 100 characters)" };
    }

    try {
        const userObjectId = new ObjectId(userId);
        const workoutObjectId = new ObjectId(workoutId);

        // Check if workout exists and belongs to the user (implicit in updateSavedWorkout by userId)
        const workoutToUpdate = await savedWorkouts.findSavedWorkoutById(workoutObjectId.toHexString(), userObjectId);
        if (!workoutToUpdate) {
            return { error: "Workout not found or access denied" };
        }

        const updatePayload: savedWorkouts.SavedWorkoutUpdate = {
            name: newName.trim(),
            updatedAt: new Date(),
        };

        const updatedWorkout = await savedWorkouts.updateSavedWorkout(workoutObjectId.toHexString(), userObjectId, updatePayload);

        if (!updatedWorkout) {
            return { error: "Failed to rename workout" };
        }

        return mapToApiSavedWorkout(updatedWorkout);
    } catch (error) {
        console.error("Error renaming saved workout:", error);
        return { error: `Failed to rename workout: ${error instanceof Error ? error.message : String(error)}` };
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

    try {
        // Use the database layer to delete the saved workout
        const deleted = await savedWorkouts.deleteSavedWorkout(params.workoutId, context.userId);

        if (!deleted) {
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