import { apiClient } from "@/client/utils/apiClient";
import type { CacheResult } from "@/common/cache/types";
import { GetExerciseHistoryRequest, GetExerciseHistoryResponse } from "./types";
import { nameGetHistory } from "./index";

/**
 * Client function for getting exercise history.
 */
export const getExerciseHistory = async (params: GetExerciseHistoryRequest): Promise<CacheResult<GetExerciseHistoryResponse>> => {
    return apiClient.call<GetExerciseHistoryResponse, GetExerciseHistoryRequest>(
        nameGetHistory,
        params,
        { disableCache: true } // Ensure we always get fresh data
    );
}; 