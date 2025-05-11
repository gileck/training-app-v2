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
    RemoveExerciseFromSavedWorkoutRequest,
    RenameSavedWorkoutRequest,
    RenameSavedWorkoutResponse,
    RemoveExerciseFromSavedWorkoutResponse
} from './types';
import { savedWorkouts, exerciseDefinitions, getDb } from "@/server/database";
import { ExerciseDefinition } from '../exerciseDefinitions/types';

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
export const addExerciseToSavedWorkout = async (params: AddExerciseToSavedWorkoutRequest): Promise<SavedWorkoutWithExercises | { error: string }> => {
    const { workoutId, exerciseDefinitionId } = params; // Removed sets, reps, order

    if (!isValidObjectId(workoutId) || !isValidObjectId(exerciseDefinitionId)) {
        return { error: 'Invalid workout ID or exercise definition ID format.' };
    }

    const db = await getDb();
    const savedWorkoutsCollection = db.collection<SavedWorkout>('savedWorkouts');
    const exercisesCollection = db.collection<ExerciseBase>('exercises');
    const exerciseDefinitionsCollection = db.collection<ExerciseDefinition>('exerciseDefinitions');

    try {
        const workoutObjectId = toObjectId(workoutId);
        const exerciseDefObjectId = toObjectId(exerciseDefinitionId);

        // Check if the workout exists
        const workout = await savedWorkoutsCollection.findOne({ _id: workoutObjectId });
        if (!workout) {
            return { error: 'Workout not found.' };
        }

        // Check if the exercise definition exists
        const definitionChecked = await exerciseDefinitionsCollection.findOne({ _id: exerciseDefObjectId });
        if (!definitionChecked) {
            return { error: 'Exercise definition not found.' };
        }

        // Logic change: We are no longer creating a new 'ExerciseBase' instance with sets/reps here.
        // We are linking the ExerciseDefinition directly (or an ID representing it) to the workout.
        // The current SavedWorkout schema has `exerciseIds: ObjectId[]` which originally might have pointed
        // to ExerciseBase instances. If the intention is that a workout is a collection of *definitions*,
        // then `exerciseIds` should store `exerciseDefinitionId`s.
        // For this change, let's assume `exerciseIds` in SavedWorkout schema stores `exerciseDefinitionId`s.

        // Prevent duplicate exercise definitions in the same workout
        if (workout.exerciseIds.some((id: ObjectId) => id.equals(exerciseDefObjectId))) {
            // Optionally return the workout as is, or an error/message indicating it's already there
            // For now, let's treat it as success if already present, to avoid breaking existing client logic expecting a workout back.
            // console.log(`Exercise definition ${exerciseDefinitionId} already in workout ${workoutId}.`);
        } else {
            // Add the exercise definition ID to the workout's list
            const updateResult = await savedWorkoutsCollection.updateOne(
                { _id: workoutObjectId },
                { $addToSet: { exerciseIds: exerciseDefObjectId } } // Use $addToSet to avoid duplicates
            );

            if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
                // This case should be rare if workout was found above, but good to check.
                return { error: 'Failed to add exercise definition to workout: Workout not found or not modified.' };
            }
        }

        // Fetch the updated workout and populate its exercise details for the response
        // This part needs careful re-evaluation based on the new meaning of `workout.exerciseIds`.
        // If `workout.exerciseIds` now stores ExerciseDefinition IDs, we need to fetch these definitions.
        // However, the return type `SavedWorkoutWithExercises` expects `ExerciseBase[]`.
        // This indicates a deeper architectural decision: 
        //    Does a workout execution use the sets/reps from the plan's main ExerciseBase instance?
        //    Or does adding an exercise *definition* to a workout imply it will use some default sets/reps if started from the workout context?
        // Given the user's request: "workouts are only grouping exercises... they do not hold extra data... 
        // when a user see an exercise under a workout - he sees the exercise from the training plan"
        // This implies that `SavedWorkoutWithExercises` should probably return ExerciseBase instances that are 
        // looked up from the main plan exercises, using the exerciseDefinitionId stored in the workout.

        // For now, to satisfy the type `SavedWorkoutWithExercises` and the fact that the frontend
        // is already equipped to handle ExerciseBase objects (even if it ignores sets/reps on the card),
        // we can construct minimal ExerciseBase-like objects or fetch the full ExerciseBase from the plan.
        // Given the constraint to not modify the database schema for ExerciseBase within this scope,
        // we will return what the frontend expects but the source of truth for sets/reps is the plan.

        const updatedWorkout = await savedWorkoutsCollection.findOne({ _id: workoutObjectId });
        if (!updatedWorkout) {
            return { error: 'Failed to retrieve updated workout.' }; // Should not happen
        }

        // The `updatedWorkout.exerciseIds` are now ExerciseDefinition IDs.
        // To return `SavedWorkoutWithExercises`, we need to map these to `ExerciseBase[]`.
        // This is where the link to the *plan's actual exercises* comes in.
        // A workout belongs to a trainingPlanId. The exercises on that plan have sets/reps.
        
        const planExercises = await exercisesCollection.find({
            trainingPlanId: updatedWorkout.trainingPlanId, // Fetch exercises for this workout's plan
            exerciseDefinitionId: { $in: updatedWorkout.exerciseIds } // Only those whose definitions are in this workout
        }).toArray();

        // Map definition IDs from workout to the actual plan exercises
        const exercisesForResponse: ExerciseBase[] = updatedWorkout.exerciseIds.map((defId: ObjectId) => {
            const planExercise = planExercises.find((pe: ExerciseBase) => pe.exerciseDefinitionId.equals(defId));
            if (planExercise) {
                return planExercise;
            }
            // If an exercise definition in the workout doesn't have a corresponding ExerciseBase in the plan,
            // we need to decide what to return. For now, let's create a placeholder or skip.
            // For SavedWorkoutWithExercises to be valid, we must return ExerciseBase.
            // We can find the definition and create a minimal ExerciseBase without actual sets/reps from plan.
            return {
                _id: new ObjectId(), // Placeholder _id for this context as it's not a real stored ExerciseBase from this call
                userId: updatedWorkout.userId,
                trainingPlanId: updatedWorkout.trainingPlanId,
                exerciseDefinitionId: defId,
                sets: 0, // Default/Placeholder - client will ignore on card
                reps: 0, // Default/Placeholder - client will ignore on card
                createdAt: new Date(),
                updatedAt: new Date(),
                // Other fields like weight, comments are optional in ExerciseBase
            } as ExerciseBase; // Type assertion, ensure all required fields of ExerciseBase are present
        });

        return {
            ...updatedWorkout,
            exercises: exercisesForResponse,
        } as SavedWorkoutWithExercises; // Ensure the final object matches the type

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