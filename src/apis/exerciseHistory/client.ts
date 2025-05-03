import { apiClient } from "@/client/utils/apiClient";
import type { CacheResult } from "@/server/cache/types";
import { GetExerciseHistoryRequest, GetExerciseHistoryResponse } from "./types";
import { nameGetHistory } from "./index";

/**
 * Client function for getting exercise history.
 */
export const getExerciseHistory = async (params: GetExerciseHistoryRequest): Promise<CacheResult<GetExerciseHistoryResponse>> => {
    return apiClient.call<CacheResult<GetExerciseHistoryResponse>, GetExerciseHistoryRequest>(
        nameGetHistory,
        params,
        { disableCache: true } // Ensure we always get fresh data
    );
}; 