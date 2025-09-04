import type { CacheResult } from "@/common/cache/types";
import apiClient from "@/client/utils/apiClient";
import {
    getAllApiName,
    getByIdApiName,
    createApiName,
    updateApiName,
    deleteApiName,
    duplicateApiName,
    setActiveApiName,
    getActiveApiName
} from "./index"; // Import names from index
import type {
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
    DuplicateTrainingPlanResponse,
    SetActiveTrainingPlanRequest,
    SetActiveTrainingPlanResponse,
    GetActiveTrainingPlanResponse
} from "./types";

/**
 * Task 15 (Client): Get all training plans
 */
export const getAllTrainingPlans = async (params: GetAllTrainingPlansRequest = {}): Promise<CacheResult<GetAllTrainingPlansResponse>> => {
    return apiClient.call<GetAllTrainingPlansResponse, GetAllTrainingPlansRequest>(
        getAllApiName,
        params,
        { bypassCache: true } // Ensure fresh list to avoid stale cached plans after mutations
    );
};

/**
 * Task 16 (Client): Get a specific training plan by ID
 */
export const getTrainingPlanById = async (params: GetTrainingPlanRequest): Promise<CacheResult<GetTrainingPlanResponse>> => {
    return apiClient.call<GetTrainingPlanResponse, GetTrainingPlanRequest>(
        getByIdApiName,
        params
    );
};

/**
 * Task 17 (Client): Create a new training plan
 */
export const createTrainingPlan = async (params: CreateTrainingPlanRequest): Promise<CacheResult<CreateTrainingPlanResponse>> => {
    return apiClient.call<CreateTrainingPlanResponse, CreateTrainingPlanRequest>(
        createApiName,
        params,
        { bypassCache: true } // Bypass cache on create to ensure fresh list if re-fetched soon
    );
};

/**
 * Task 18 (Client): Update an existing training plan
 */
export const updateTrainingPlan = async (params: UpdateTrainingPlanRequest): Promise<CacheResult<UpdateTrainingPlanResponse>> => {
    return apiClient.call<UpdateTrainingPlanResponse, UpdateTrainingPlanRequest>(
        updateApiName,
        params,
        { bypassCache: true } // Bypass cache on update
    );
};

/**
 * Task 19 (Client): Delete a training plan
 */
export const deleteTrainingPlan = async (params: DeleteTrainingPlanRequest): Promise<CacheResult<DeleteTrainingPlanResponse>> => {
    return apiClient.call<DeleteTrainingPlanResponse, DeleteTrainingPlanRequest>(
        deleteApiName,
        params,
        { bypassCache: true } // Bypass cache on delete
    );
};

/**
 * Task 20 (Client): Duplicate a training plan
 */
export const duplicateTrainingPlan = async (params: DuplicateTrainingPlanRequest): Promise<CacheResult<DuplicateTrainingPlanResponse>> => {
    return apiClient.call<DuplicateTrainingPlanResponse, DuplicateTrainingPlanRequest>(
        duplicateApiName,
        params,
        { bypassCache: true } // Bypass cache on duplicate
    );
};

/**
 * Task X (Client): Set Active Training Plan
 */
export const setActiveTrainingPlan = async (params: SetActiveTrainingPlanRequest): Promise<CacheResult<SetActiveTrainingPlanResponse>> => {
    return apiClient.call<SetActiveTrainingPlanResponse, SetActiveTrainingPlanRequest>(
        setActiveApiName,
        params,
        { bypassCache: true } // Bypass cache on set active
    );
};

// Task X: Get Active Training Plan
export const getActiveTrainingPlan = async (): Promise<CacheResult<GetActiveTrainingPlanResponse>> => {
    // No params needed for the request body
    return apiClient.call<GetActiveTrainingPlanResponse, Record<string, never>>(
        getActiveApiName,
        {},
        { bypassCache: true } // Ensure active plan reflects latest server state
    );
}; 