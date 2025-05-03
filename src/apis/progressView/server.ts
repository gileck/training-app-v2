import { getDb } from '@/server/database';
import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { name as baseName } from './index';
import {
    GetDailyActivityRequest,
    GetDailyActivityResponse,
    DailyActivitySummary
} from './types';

// --- API Names ---
export const getDailyActivityApiName = `${baseName}/getDailyActivity`;

// Export base name as well
export { baseName as name };

// --- Task 33: API endpoint to get aggregated daily activity --- //
export const getDailyActivity = async (
    params: GetDailyActivityRequest,
    context: ApiHandlerContext
): Promise<GetDailyActivityResponse> => {
    const { userId } = context;
    const { startDate, endDate } = params;

    if (!userId) {
        throw new Error("User not authenticated");
    }

    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
    }

    try {
        const db = await getDb();
        const userIdObj = new ObjectId(userId);

        // Convert date strings to Date objects
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);

        // Adjust the end date to include the entire day
        endDateTime.setHours(23, 59, 59, 999);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            throw new Error("Invalid date format. Use YYYY-MM-DD format.");
        }

        if (startDateTime > endDateTime) {
            throw new Error("Start date must be before or equal to end date");
        }

        // Get exercise activity logs for the date range
        const activityLogs = await db.collection('exerciseActivityLog').find({
            userId: userIdObj,
            date: {
                $gte: startDateTime,
                $lte: endDateTime
            }
        }).toArray();

        // Get exercise definitions to get their types
        const exerciseIds = [...new Set(activityLogs.map(log => log.exerciseId))];
        const exerciseDefinitionIds = await db.collection('exercises').find({
            _id: { $in: exerciseIds.map(id => new ObjectId(id.toString())) }
        }).project({ _id: 1, exerciseDefinitionId: 1 }).toArray();

        // Map exercise IDs to their definition IDs
        const exerciseToDefinitionMap = exerciseDefinitionIds.reduce((map, exercise) => {
            map[exercise._id.toString()] = exercise.exerciseDefinitionId;
            return map;
        }, {});

        // Get exercise types from definitions
        const definitionIds = [...new Set(Object.values(exerciseToDefinitionMap))];
        const exerciseDefinitions = await db.collection('exerciseDefinitions').find({
            _id: { $in: definitionIds.map(id => new ObjectId(id.toString())) }
        }).project({ _id: 1, primaryMuscle: 1 }).toArray();

        // Map definition IDs to their primary muscle group
        const definitionToTypeMap = exerciseDefinitions.reduce((map, def) => {
            map[def._id.toString()] = def.primaryMuscle || 'Other';
            return map;
        }, {});

        // Generate daily summaries
        const dailySummaries: Record<string, DailyActivitySummary> = {};

        // Create a date range to ensure all days are represented
        const currentDate = new Date(startDateTime);
        while (currentDate <= endDateTime) {
            const dateString = currentDate.toISOString().split('T')[0];
            dailySummaries[dateString] = {
                date: dateString,
                totalSetsCompleted: 0,
                totalExercisesCompleted: 0,
                exerciseTypes: {}
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Aggregate activity logs by date
        activityLogs.forEach(log => {
            const dateString = new Date(log.date).toISOString().split('T')[0];
            const summary = dailySummaries[dateString];

            if (summary) {
                summary.totalSetsCompleted += log.setsCompleted || 0;

                if (log.isExerciseDone) {
                    summary.totalExercisesCompleted += 1;
                }

                // Get exercise type
                const definitionId = exerciseToDefinitionMap[log.exerciseId.toString()];
                if (definitionId) {
                    const exerciseType = definitionToTypeMap[definitionId.toString()] || 'Other';
                    summary.exerciseTypes[exerciseType] = (summary.exerciseTypes[exerciseType] || 0) + 1;
                }
            }
        });

        // Convert the object to an array and sort by date
        return Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        throw new Error(`Failed to fetch daily activity: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 