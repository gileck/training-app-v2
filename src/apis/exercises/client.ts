import { apiClient } from "@/client/utils/apiClient";
import type { CacheResult } from "@/server/cache/types";
import {
    GetExercisesRequest, GetExercisesResponse,
    AddExerciseRequest, AddExerciseResponse,
    UpdateExerciseRequest, UpdateExerciseResponse,
    DeleteExerciseRequest, DeleteExerciseResponse
} from "./types";
import {
    name as getExercisesApiName,
    nameAdd as addExerciseApiName,
    nameUpdate as updateExerciseApiName,
    nameDelete as deleteExerciseApiName
} from "./index"; // Import API names

/**
 * Client function to fetch exercises for a specific training plan.
 */
export const getExercises = async (params: GetExercisesRequest): Promise<CacheResult<GetExercisesResponse>> => {
    return apiClient.call<CacheResult<GetExercisesResponse>, GetExercisesRequest>(
        getExercisesApiName,
        params
        // Caching options can be added here if needed
    );
};

/**
 * Client function to add a new exercise to a training plan.
 */
export const addExercise = async (params: AddExerciseRequest): Promise<CacheResult<AddExerciseResponse>> => {
    return apiClient.call<CacheResult<AddExerciseResponse>, AddExerciseRequest>(
        addExerciseApiName,
        params,
        { disableCache: true } // Disable cache as this modifies data
    );
};

/**
 * Client function to update an existing exercise within a plan.
 */
export const updateExercise = async (params: UpdateExerciseRequest): Promise<CacheResult<UpdateExerciseResponse>> => {
    return apiClient.call<CacheResult<UpdateExerciseResponse>, UpdateExerciseRequest>(
        updateExerciseApiName,
        params,
        { disableCache: true } // Disable cache as this modifies data
    );
};

/**
 * Client function to delete an exercise from a plan.
 */
export const deleteExercise = async (params: DeleteExerciseRequest): Promise<CacheResult<DeleteExerciseResponse>> => {
    return apiClient.call<CacheResult<DeleteExerciseResponse>, DeleteExerciseRequest>(
        deleteExerciseApiName,
        params,
        { disableCache: true } // Disable cache as this modifies data
    );
}; 