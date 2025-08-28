import { apiClient } from "@/client/utils/apiClient";
import type { GetAllExerciseDefinitionsRequest, GetAllExerciseDefinitionsResponse, GetExerciseDefinitionByIdRequestParams, GetExerciseDefinitionByIdResponse } from "./types";
import type { CacheResult } from "@/common/cache/types";
// Import the specific API names exported from server.ts
import { getAllOptionsApiName, getByIdApiName } from "./index";

// Client function for getting all options
export const getAllExerciseDefinitionOptions = async (): Promise<CacheResult<GetAllExerciseDefinitionsResponse>> => {
    return apiClient.call<GetAllExerciseDefinitionsResponse, GetAllExerciseDefinitionsRequest>(
        getAllOptionsApiName, // Use the specific name for this API call
        {},
        {
            staleWhileRevalidate: true,
            disableCache: false,
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