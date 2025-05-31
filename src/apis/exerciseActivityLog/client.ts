import {
    GetActivityLogParams,
    GetActivityLogResponse,
    UpdateActivityLogParams,
    UpdateActivityLogResponse,
    DeleteActivityLogParams,
    DeleteActivityLogResponse,
    GetActivitySummaryParams,
    GetActivitySummaryResponse
} from './types';
import {
    getActivityLogsApiName,
    updateActivityLogApiName,
    deleteActivityLogApiName,
    getActivitySummaryApiName
} from './index';
import apiClient from '@/client/utils/apiClient';
import type { CacheResult } from "@/common/cache/types";


/**
 * Get activity logs for the current user
 */
export async function getActivityLogs(params?: GetActivityLogParams): Promise<CacheResult<GetActivityLogResponse>> {
    return apiClient.call<GetActivityLogResponse, GetActivityLogParams>(
        getActivityLogsApiName,
        params || {}
    );
}

/**
 * Update an activity log
 */
export async function updateActivityLog(params: UpdateActivityLogParams): Promise<CacheResult<UpdateActivityLogResponse>> {
    return apiClient.call<UpdateActivityLogResponse, UpdateActivityLogParams>(
        updateActivityLogApiName,
        params
    );
}

/**
 * Delete an activity log
 */
export async function deleteActivityLog(params: DeleteActivityLogParams): Promise<CacheResult<DeleteActivityLogResponse>> {
    return apiClient.call<DeleteActivityLogResponse, DeleteActivityLogParams>(
        deleteActivityLogApiName,
        params
    );
}

/**
 * Get activity summary for a date range
 */
export async function getActivitySummary(params: GetActivitySummaryParams): Promise<CacheResult<GetActivitySummaryResponse>> {
    return apiClient.call<GetActivitySummaryResponse, GetActivitySummaryParams>(
        getActivitySummaryApiName,
        params
    );
} 