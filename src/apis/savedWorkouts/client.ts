import { apiClient } from '@/client/utils/apiClient';
import type { CacheResult } from '@/server/cache/types';
import {
    GetAllSavedWorkoutsRequest,
    GetAllSavedWorkoutsResponse,
    GetSavedWorkoutDetailsRequest,
    GetSavedWorkoutDetailsResponse,
    CreateSavedWorkoutRequest,
    CreateSavedWorkoutResponse,
    DeleteSavedWorkoutRequest,
    DeleteSavedWorkoutResponse
} from './types';
import {
    getAllApiName,
    getDetailsApiName,
    createApiName,
    deleteApiName
} from './index';

// Client function for getting all saved workouts
export const getAllSavedWorkouts = async (): Promise<CacheResult<GetAllSavedWorkoutsResponse>> => {
    return apiClient.call<CacheResult<GetAllSavedWorkoutsResponse>, GetAllSavedWorkoutsRequest>(
        getAllApiName,
        {} // No parameters needed
    );
};

// Client function for getting the details of a saved workout
export const getSavedWorkoutDetails = async (
    params: GetSavedWorkoutDetailsRequest
): Promise<CacheResult<GetSavedWorkoutDetailsResponse>> => {
    return apiClient.call<CacheResult<GetSavedWorkoutDetailsResponse>, GetSavedWorkoutDetailsRequest>(
        getDetailsApiName,
        params
    );
};

// Client function for creating a new saved workout
export const createSavedWorkout = async (
    params: CreateSavedWorkoutRequest
): Promise<CacheResult<CreateSavedWorkoutResponse>> => {
    return apiClient.call<CacheResult<CreateSavedWorkoutResponse>, CreateSavedWorkoutRequest>(
        createApiName,
        params
    );
};

// Client function for deleting a saved workout
export const deleteSavedWorkout = async (
    params: DeleteSavedWorkoutRequest
): Promise<CacheResult<DeleteSavedWorkoutResponse>> => {
    return apiClient.call<CacheResult<DeleteSavedWorkoutResponse>, DeleteSavedWorkoutRequest>(
        deleteApiName,
        params
    );
}; 