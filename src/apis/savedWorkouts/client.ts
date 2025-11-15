import apiClient from '@/client/utils/apiClient';
import type { CacheResult } from '@/common/cache/types';
import {
    SavedWorkout,
    GetAllSavedWorkoutsRequest,
    GetSavedWorkoutDetailsRequest,
    GetSavedWorkoutDetailsResponse,
    CreateSavedWorkoutRequest,
    CreateSavedWorkoutResponse,
    DeleteSavedWorkoutRequest,
    DeleteSavedWorkoutResponse,
    AddExerciseToSavedWorkoutRequest,
    AddExerciseToSavedWorkoutResponse,
    RemoveExerciseFromSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutResponse,
    RenameSavedWorkoutRequest,
    RenameSavedWorkoutResponse
} from './types';
import {
    getAllApiName,
    getDetailsApiName,
    createApiName,
    deleteApiName,
    addExerciseApiName,
    removeExerciseApiName,
    renameApiName
} from './index';


// Client function for getting all saved workouts
export const getAllSavedWorkouts = async (
    params: GetAllSavedWorkoutsRequest
): Promise<CacheResult<SavedWorkout[]>> => {
    return apiClient.call<SavedWorkout[], GetAllSavedWorkoutsRequest>(
        getAllApiName,
        params // Pass the params object which may contain trainingPlanId
    );
};

// Client function for getting the details of a saved workout
export const getSavedWorkoutDetails = async (
    params: GetSavedWorkoutDetailsRequest
): Promise<CacheResult<GetSavedWorkoutDetailsResponse>> => {
    return apiClient.call<GetSavedWorkoutDetailsResponse, GetSavedWorkoutDetailsRequest>(
        getDetailsApiName,
        params
    );
};

// Client function for creating a new saved workout
export const createSavedWorkout = async (
    params: CreateSavedWorkoutRequest
): Promise<CacheResult<CreateSavedWorkoutResponse>> => {
    return apiClient.call<CreateSavedWorkoutResponse, CreateSavedWorkoutRequest>(
        createApiName,
        params,
        { bypassCache: true } // Bypass cache to ensure we get fresh data
    );
};

// Client function for deleting a saved workout
export const deleteSavedWorkout = async (
    params: DeleteSavedWorkoutRequest
): Promise<CacheResult<DeleteSavedWorkoutResponse>> => {
    return apiClient.call<DeleteSavedWorkoutResponse, DeleteSavedWorkoutRequest>(
        deleteApiName,
        params
    );
};

/**
 * Client function to add an exercise to a saved workout.
 */
export const addExerciseToSavedWorkout = async (
    params: AddExerciseToSavedWorkoutRequest
): Promise<CacheResult<AddExerciseToSavedWorkoutResponse>> => {
    return apiClient.call<AddExerciseToSavedWorkoutResponse, AddExerciseToSavedWorkoutRequest>(
        addExerciseApiName,
        params,
        { bypassCache: true } // Typically, updates should bypass GET cache
    );
};

// --- Client function to remove an exercise from a saved workout --- //
export const removeExerciseFromSavedWorkout = async (request: RemoveExerciseFromSavedWorkoutRequest): Promise<CacheResult<RemoveExerciseFromSavedWorkoutResponse>> => {
    return apiClient.call<RemoveExerciseFromSavedWorkoutResponse, RemoveExerciseFromSavedWorkoutRequest>(
        removeExerciseApiName,
        request
    );
};

// --- Client function to rename a saved workout --- //
export const renameSavedWorkout = async (request: RenameSavedWorkoutRequest): Promise<CacheResult<RenameSavedWorkoutResponse>> => {
    return apiClient.call<RenameSavedWorkoutResponse, RenameSavedWorkoutRequest>(
        renameApiName,
        request,
        { bypassCache: true } // Ensure updated data is fetched next time if needed, and not cached with old name
    );
}; 