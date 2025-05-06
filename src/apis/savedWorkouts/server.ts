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
import { savedWorkouts, exerciseDefinitions, exercises } from '@/server/database/collections';

// No need to define API names here, they're imported from index.ts

// Export base name as well
export { name, getAllApiName, getDetailsApiName, createApiName, deleteApiName };

// Helper to map DB SavedWorkout to API SavedWorkout
function mapToApiSavedWorkout(workout: savedWorkouts.SavedWorkout): SavedWorkout {
    // Extract exerciseIds from the exercises array with null checking
    const exerciseIds = workout.exercises?.map(exercise => exercise.definitionId) || [];
    
    return {
        _id: workout._id,
        userId: workout.userId,
        name: workout.name,
        exerciseIds,
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt
    };
}

// --- Task 29: API endpoint to get all saved workouts for the user ---
export const getAllSavedWorkouts = async (
    _params: GetAllSavedWorkoutsRequest,
    context: ApiHandlerContext
): Promise<GetAllSavedWorkoutsResponse> => {
    if (!context.userId) {
        throw new Error("User not authenticated");
    }

    try {
        // Use the database layer to get all saved workouts for the user
        const workoutsFromDB = await savedWorkouts.findSavedWorkoutsForUser(context.userId);
        
        // Map to the API response format
        const workouts = workoutsFromDB.map(mapToApiSavedWorkout);
        
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
        // Get the saved workout from the database layer
        const savedWorkout = await savedWorkouts.findSavedWorkoutById(workoutId, userId);

        if (!savedWorkout) {
            return null;
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
                    _id: new ObjectId(), // Temporary ID
                    userId: savedWorkout.userId,
                    trainingPlanId: new ObjectId(), // Temporary
                    exerciseDefinitionId: definitionId,
                    sets: 0,
                    reps: 0,
                    order: 0,
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

    if (!params.name || !params.exerciseIds || params.exerciseIds.length === 0) {
        return { error: "Name and at least one exercise are required" };
    }

    try {
        const userIdObj = new ObjectId(context.userId);
        
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
            const exerciseId = exerciseObjectIds[i];
            
            // Find the exercise using the exported function
            const exercise = await exercises.findExerciseById(exerciseId, userIdObj);
            
            if (!exercise) {
                console.error(`Exercise not found: ${exerciseId.toString()}`);
                continue;
            }
            
            // Verify definition exists
            if (!exercise.definitionId) {
                console.error(`Exercise ${exercise._id} has no definitionId`);
                continue;
            }
            
            const definitionId = exercise.definitionId;
            
            try {
                // Verify the definition exists
                const definition = await exerciseDefinitions.findExerciseDefinitionById(definitionId);
                
                if (!definition) {
                    console.error(`Exercise definition not found: ${definitionId.toString()}`);
                    continue;
                }
                
                // Add to exercises array
                exercisesArray.push({
                    definitionId: definitionId,
                    sets: exercise.sets || 3, // Use exercise sets or default
                    reps: exercise.reps?.toString() || "10",
                    order: i + 1
                });
            } catch (err) {
                console.error(`Error processing definition ID ${definitionId}: ${err instanceof Error ? err.message : String(err)}`);
                continue; // Skip this one but continue with others
            }
        }
        
        if (exercisesArray.length === 0) {
            return { error: "Could not create workout with the provided exercises" };
        }

        const now = new Date();
        const newWorkout: savedWorkouts.SavedWorkoutCreate = {
            userId: userIdObj,
            name: params.name,
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