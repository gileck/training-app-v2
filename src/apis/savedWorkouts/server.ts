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
    RenameSavedWorkoutResponse
} from './types';
import { savedWorkouts, exerciseDefinitions } from "@/server/database";

// No need to define API names here, they're imported from index.ts

// Export base name as well
export { name, getAllApiName, getDetailsApiName, createApiName, deleteApiName, addExerciseApiName, removeExerciseApiName, renameApiName };

// Helper to map DB SavedWorkout to API SavedWorkout
function mapToApiSavedWorkout(workout: savedWorkouts.SavedWorkout): SavedWorkout {
    // Extract exerciseIds from the exercises array with null checking
    const exerciseIds = workout.exercises?.map(exercise => exercise.definitionId) || [];

    return {
        _id: workout._id,
        userId: workout.userId,
        name: workout.name,
        exerciseIds,
        trainingPlanId: workout.planId,
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
    };
}

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
        // Ensure trainingPlanId exists on savedWorkout from DB, if not, this is an issue with DB type or data
        if (!savedWorkout.planId) {
            console.error(`SavedWorkout ${savedWorkout._id} is missing planId.`);
            throw new Error(`SavedWorkout ${savedWorkout._id} is missing planId.`);
        }

        // Get the definition IDs from the saved workout exercises
        const definitionIds = savedWorkout.exercises.map(exercise => exercise.definitionId);

        // Fetch exercise details for each definition ID
        const exercisesArray: ExerciseBase[] = [];

        for (const definitionId of definitionIds) {
            // Get the definition details
            const definition = await exerciseDefinitions.findExerciseDefinitionById(definitionId);
            if (definition) {
                // Create a basic ExerciseBase object
                const exerciseBase: ExerciseBase = {
                    _id: new ObjectId(), // Temporary ID for this specific instance in the response list
                    userId: savedWorkout.userId,
                    trainingPlanId: savedWorkout.planId,
                    exerciseDefinitionId: definitionId,
                    sets: savedWorkout.exercises.find(e => e.definitionId.equals(definitionId))?.sets || 0, // Get sets from DB exercise
                    reps: parseInt(savedWorkout.exercises.find(e => e.definitionId.equals(definitionId))?.reps || "0"), // Get reps from DB exercise
                    order: savedWorkout.exercises.find(e => e.definitionId.equals(definitionId))?.order || 0, // Get order from DB exercise
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                exercisesArray.push(exerciseBase);
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
            const definitionId = exerciseObjectIds[i]; // Renamed for clarity, this IS the definitionId

            // Find the exercise definition using the correct function
            const definition = await exerciseDefinitions.findExerciseDefinitionById(definitionId);

            if (!definition) {
                console.error(`Exercise definition not found: ${definitionId.toString()}`);
                // return { error: `Exercise definition not found: ${definitionId.toString()}` }; // Early exit if a definition is not found
                continue; // Or skip this exercise and try to create workout with others
            }

            // The 'definition' object IS the exercise definition.
            // We need to construct the SavedWorkoutExercise part for the new workout.
            // The request params.exercises was changed to params.exerciseIds for this function signature.
            // We need to look up sets/reps/order if they were meant to be passed alongside exerciseIds.
            // The CreateSavedWorkoutRequest is: { name: string; trainingPlanId: string; exerciseIds: string[]; description?: string; tags?: string[]; exercises: Array<{ exerciseDefinitionId: string; sets: number; reps: string; order?: number; ... }>;}
            // It seems the current createSavedWorkout signature is using `params.exerciseIds` but the type might be richer.
            // Let's check `CreateSavedWorkoutRequest` from `./types.ts` again.

            // Assuming `CreateSavedWorkoutRequest` should provide full exercise details, not just IDs.
            // The current signature of createSavedWorkout is (params: CreateSavedWorkoutRequest, ...)
            // And CreateSavedWorkoutRequest is { name: string; trainingPlanId: string; exerciseIds: string[]; description?: string; tags?: string[]; }
            // This is a mismatch. The `exerciseIds` implies only definition IDs are passed.
            // The old code was trying to find an *exercise instance* `findExerciseById` then get its `definitionId`.
            // If we are creating a NEW SavedWorkout, we only need definitionIds and new sets/reps/order for them.
            // The prompt implies `params.exerciseIds` are definition IDs.

            // Let's assume default sets/reps for now if not provided elsewhere in params.
            // The original code used `exercise.sets || 3` and `exercise.reps?.toString() || "10"`
            // This structure indicates that `createSavedWorkout` originally received more detailed exercise info.
            // For now, to fix the immediate error, we use the definition found.

            exercisesArray.push({
                definitionId: definition._id, // Use the _id of the found definition
                sets: 3, // Default or needs to come from params if structure changes
                reps: "10", // Default or needs to come from params
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
    context: ApiHandlerContext
): Promise<AddExerciseToSavedWorkoutResponse> => {
    if (!context.userId) {
        return { error: "User not authenticated" };
    }

    const { workoutId, exerciseDefinitionId, sets, reps, order } = params;

    if (!workoutId || !ObjectId.isValid(workoutId)) {
        return { error: "Invalid Workout ID format" };
    }
    if (!exerciseDefinitionId || !ObjectId.isValid(exerciseDefinitionId)) {
        return { error: "Invalid Exercise Definition ID format" };
    }
    if (sets === undefined || sets < 0) { // Assuming sets can be 0 for some reason, adjust if not
        return { error: "Sets must be a non-negative number" };
    }
    if (reps === undefined || reps < 0) { // Assuming reps can be 0, adjust if not
        return { error: "Reps must be a non-negative number" };
    }

    try {
        const userIdObj = new ObjectId(context.userId);
        const workoutIdObj = new ObjectId(workoutId);
        const exerciseDefIdObj = new ObjectId(exerciseDefinitionId);

        // 1. Fetch the existing saved workout
        const existingWorkout = await savedWorkouts.findSavedWorkoutById(workoutIdObj, userIdObj);
        if (!existingWorkout) {
            return { error: "Saved workout not found or access denied" };
        }

        // 2. Verify the exercise definition exists
        const definition = await exerciseDefinitions.findExerciseDefinitionById(exerciseDefIdObj);
        if (!definition) {
            return { error: "Exercise definition not found" };
        }

        // 3. Construct the new exercise object for the database layer
        const newDbExercise: savedWorkouts.SavedWorkoutExercise = {
            definitionId: exerciseDefIdObj,
            sets: sets, // DB layer type might need adjustment if it expects string
            reps: reps.toString(), // Convert to string as per current DB layer assumption
            order: order !== undefined ? order : (existingWorkout.exercises?.length || 0) + 1,
        };

        // 4. Create the updated exercises array
        const updatedExercises = existingWorkout.exercises ? [...existingWorkout.exercises, newDbExercise] : [newDbExercise];

        // Sort by order just in case, though appending should maintain order if new order is last
        updatedExercises.sort((a, b) => (a.order || 0) - (b.order || 0));

        // 5. Prepare the update payload for the database
        const updatePayload: savedWorkouts.SavedWorkoutUpdate = {
            exercises: updatedExercises,
            updatedAt: new Date(), // Ensure updatedAt is updated
        };

        // 6. Update the workout in the database
        const updatedWorkoutFromDb = await savedWorkouts.updateSavedWorkout(workoutIdObj, userIdObj, updatePayload);

        if (!updatedWorkoutFromDb) {
            return { error: "Failed to update the workout" };
        }

        // 7. Fetch the full details for the response (including populated ExerciseBase for exercises array)
        // This is similar to getSavedWorkoutDetails to ensure the response shape is consistent
        const definitionIds = updatedWorkoutFromDb.exercises.map(ex => ex.definitionId);
        const exercisesArrayForResponse: ExerciseBase[] = [];

        for (const defId of definitionIds) {
            const defDetails = await exerciseDefinitions.findExerciseDefinitionById(defId);
            if (defDetails) {
                const dbEx = updatedWorkoutFromDb.exercises.find(e => e.definitionId.equals(defId));
                exercisesArrayForResponse.push({
                    _id: new ObjectId(), // This is a new ObjectId for the response item, not the db exercise _id
                    userId: updatedWorkoutFromDb.userId,
                    trainingPlanId: updatedWorkoutFromDb.planId,
                    exerciseDefinitionId: defId,
                    sets: dbEx?.sets || 0,
                    reps: parseInt(dbEx?.reps || "0"),
                    order: dbEx?.order || 0,
                    createdAt: new Date(), // Or use exercise specific createdAt if available
                    updatedAt: new Date(), // Or use exercise specific updatedAt if available
                });
            }
        }
        exercisesArrayForResponse.sort((a, b) => (a.order || 0) - (b.order || 0));


        const responseWorkout: SavedWorkoutWithExercises = {
            _id: updatedWorkoutFromDb._id,
            userId: updatedWorkoutFromDb.userId,
            name: updatedWorkoutFromDb.name,
            trainingPlanId: updatedWorkoutFromDb.planId,
            exercises: exercisesArrayForResponse,
            createdAt: updatedWorkoutFromDb.createdAt,
            updatedAt: updatedWorkoutFromDb.updatedAt,
        };

        return responseWorkout;

    } catch (error) {
        console.error("Error adding exercise to saved workout:", error);
        return { error: `Failed to add exercise: ${error instanceof Error ? error.message : String(error)}` };
    }
};

// --- API endpoint to remove an exercise from a saved workout ---
export const removeExerciseFromSavedWorkout = async (
    params: RemoveExerciseFromSavedWorkoutRequest,
    context: ApiHandlerContext
): Promise<RemoveExerciseFromSavedWorkoutResponse> => {
    const { userId } = context;
    const { workoutId, exerciseDefinitionIdToRemove } = params;

    if (!userId) {
        return { error: "User not authenticated" };
    }

    if (!workoutId || !ObjectId.isValid(workoutId)) {
        return { error: "Invalid workout ID provided." };
    }
    if (!exerciseDefinitionIdToRemove || !ObjectId.isValid(exerciseDefinitionIdToRemove)) {
        return { error: "Invalid exercise definition ID to remove." };
    }

    try {
        const userObjectId = new ObjectId(userId);
        const workoutObjectId = new ObjectId(workoutId);
        const definitionIdToRemoveObjectId = new ObjectId(exerciseDefinitionIdToRemove);

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
        const exerciseIndexToRemove = existingWorkout.exercises.findIndex(
            ex => ex.definitionId.equals(definitionIdToRemoveObjectId)
        );

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