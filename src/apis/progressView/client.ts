import { apiClient } from '@/client/utils/apiClient';
import type { CacheResult } from '@/server/cache/types';
import {
    GetDailyActivityRequest,
    GetDailyActivityResponse
} from './types';
import {
    getDailyActivityApiName
} from './server';

// Client function for getting daily activity summary
export const getDailyActivity = async (
    params: GetDailyActivityRequest
): Promise<CacheResult<GetDailyActivityResponse>> => {
    return apiClient.call<CacheResult<GetDailyActivityResponse>, GetDailyActivityRequest>(
        getDailyActivityApiName,
        params
    );
}; 