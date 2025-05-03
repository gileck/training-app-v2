import { getDb } from '@/server/database';
import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { GetExerciseHistoryRequest, GetExerciseHistoryResponse } from './types';
import { nameGetHistory } from './index';

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
        const db = await getDb();
        const userIdObj = new ObjectId(userId);
        const exerciseIdObj = new ObjectId(exerciseId);

        // Build query based on provided parameters
        const query: {
            userId: ObjectId;
            exerciseId: ObjectId;
            date?: {
                $gte?: Date;
                $lte?: Date;
            };
        } = {
            userId: userIdObj,
            exerciseId: exerciseIdObj
        };

        // Add date range filters if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const startDateTime = new Date(startDate);
                if (isNaN(startDateTime.getTime())) {
                    throw new Error("Invalid start date format. Use YYYY-MM-DD format.");
                }
                query.date.$gte = startDateTime;
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                if (isNaN(endDateTime.getTime())) {
                    throw new Error("Invalid end date format. Use YYYY-MM-DD format.");
                }
                // Adjust end date to include the entire day
                endDateTime.setHours(23, 59, 59, 999);
                query.date.$lte = endDateTime;
            }
        }

        // Fetch activity logs from the database
        const activityLogs = await db.collection('exerciseActivityLog')
            .find(query)
            .sort({ date: -1 }) // Most recent first
            .limit(limit)
            .toArray();

        // Format the response
        const activityEntries = activityLogs.map(log => ({
            date: new Date(log.date).toISOString().split('T')[0],
            setsCompleted: log.setsCompleted || 0
        }));

        return {
            exerciseId,
            activityEntries
        };
    } catch (error) {
        throw new Error(`Failed to fetch exercise history: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 