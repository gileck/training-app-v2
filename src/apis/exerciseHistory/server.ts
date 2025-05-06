import { ApiHandlerContext } from '../types';
import { GetExerciseHistoryRequest, GetExerciseHistoryResponse } from './types';
import { nameGetHistory } from './index';
import { exerciseActivityLog } from '@/server/database/collections';

// --- API Name --- //
export const getHistoryApiName = nameGetHistory;

/**
 * Retrieves the exercise activity history for a specific exercise
 */
export const getExerciseHistory = async (
    params: GetExerciseHistoryRequest,
    context: ApiHandlerContext
): Promise<GetExerciseHistoryResponse> => {
    const { userId } = context;
    const { exerciseId, startDate, endDate, limit = 30 } = params;

    if (!userId) {
        throw new Error("User not authenticated");
    }

    if (!exerciseId) {
        throw new Error("Exercise ID is required");
    }

    try {
        // Use the new collection function to get exercise history
        const activityEntries = await exerciseActivityLog.getExerciseHistory(
            exerciseId,
            userId,
            { startDate, endDate, limit }
        );

        return {
            exerciseId,
            activityEntries
        };
    } catch (error) {
        throw new Error(`Failed to fetch exercise history: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 