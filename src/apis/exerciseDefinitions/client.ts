import { apiClient } from "@/client/utils/apiClient";
import type { 
    GetAllExerciseDefinitionsRequest, 
    GetAllExerciseDefinitionsResponse, 
    GetExerciseDefinitionByIdRequestParams, 
    GetExerciseDefinitionByIdResponse,
    CreateExerciseDefinitionRequest,
    CreateExerciseDefinitionResponse
} from "./types";
import type { CacheResult } from "@/common/cache/types";
// Import the specific API names exported from server.ts
import { getAllOptionsApiName, getByIdApiName, createExerciseDefinitionApiName } from "./index";

// Client function for getting all options
// @param options.bypassCache - When true, fetches fresh data from server without using cache.
//                               Useful after creating/updating exercise definitions to ensure UI has latest data.
export const getAllExerciseDefinitionOptions = async (options?: { bypassCache?: boolean }): Promise<CacheResult<GetAllExerciseDefinitionsResponse>> => {
    return apiClient.call<GetAllExerciseDefinitionsResponse, GetAllExerciseDefinitionsRequest>(
        getAllOptionsApiName, // Use the specific name for this API call
        {},
        {
            staleWhileRevalidate: !options?.bypassCache,
            disableCache: options?.bypassCache || false,
            bypassCache: options?.bypassCache || false,
        }
    );
};

// Client function for getting a single definition by ID
export const getExerciseDefinitionById = async (params: GetExerciseDefinitionByIdRequestParams): Promise<CacheResult<GetExerciseDefinitionByIdResponse>> => {
    return apiClient.call<GetExerciseDefinitionByIdResponse, GetExerciseDefinitionByIdRequestParams>(
        getByIdApiName, // Use the specific name for this API call
        params,
        {
            staleWhileRevalidate: true,
            disableCache: false,
        }
    );
};

// Client function for creating a new custom exercise definition
export const createExerciseDefinition = async (params: CreateExerciseDefinitionRequest): Promise<CacheResult<CreateExerciseDefinitionResponse>> => {
    return apiClient.call<CreateExerciseDefinitionResponse, CreateExerciseDefinitionRequest>(
        createExerciseDefinitionApiName,
        params,
        {
            staleWhileRevalidate: false,
            disableCache: true, // Don't cache create operations
        }
    );
}; 