import { apiClient } from '@/client/utils/apiClient';
import type { CacheResult } from '@/server/cache/types';
import {
    GetDailyActivityRequest,
    GetDailyActivityResponse
} from './types';
import {
    getDailyActivityApiName
} from './index';

// Client function for getting daily activity summary
export const getDailyActivity = async (
    params: GetDailyActivityRequest
): Promise<CacheResult<GetDailyActivityResponse>> => {
    return apiClient.call<CacheResult<GetDailyActivityResponse>, GetDailyActivityRequest>(
        getDailyActivityApiName,
        params
    );
};

// Alias for getDailyActivity to maintain compatibility with existing code
export const getActivitySummary = async (
    params: {
        startDate: string;
        endDate: string;
        groupBy?: 'day' | 'week' | 'month';
    }
): Promise<CacheResult<{
    success: boolean;
    data?: GetDailyActivityResponse;
    error?: string;
}>> => {
    try {
        const response = await getDailyActivity({
            startDate: params.startDate,
            endDate: params.endDate
        });
        
        return {
            data: {
                success: true,
                data: response.data
            },
            isFromCache: response.isFromCache
        };
    } catch (error) {
        return {
            data: {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            isFromCache: false
        };
    }
}; 