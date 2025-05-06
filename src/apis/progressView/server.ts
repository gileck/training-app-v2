import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { name as baseName } from './index';
import {
    GetDailyActivityRequest,
    GetDailyActivityResponse,
    DailyActivitySummary
} from './types';
import { exerciseActivityLog, exercises, exerciseDefinitions } from '@/server/database/collections';

// Export base name as well
export { baseName as name };

export * from './index';

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

        // Get exercise activity logs for the date range using the collections layer
        const activityLogs = await exerciseActivityLog.findActivityLogsForUser(userIdObj, {
            date: {
                $gte: startDateTime,
                $lte: endDateTime
            }
        });

        console.log('activityLogs', activityLogs);

        // Generate daily summaries
        const dailySummaries: Record<string, DailyActivitySummary> = {};

        // Debug entire date range 
        console.log(`Creating date range from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

        // Create a date range to ensure all days are represented
        const currentDate = new Date(startDateTime);
        while (currentDate <= endDateTime) {
            // Use the same date string format consistently throughout the code
            const dateString = currentDate.toISOString().split('T')[0];
            console.log(`Adding date to summaries: ${dateString}`);
            
            dailySummaries[dateString] = {
                date: dateString,
                totalSetsCompleted: 0,
                totalExercisesCompleted: 0,
                exerciseTypes: {}
            };
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Get exercise definitions to get their types
        const exerciseIds = [...new Set(activityLogs.map(log => log.exerciseId))].filter(id => id);
        
        // Handle empty exerciseIds case
        if (exerciseIds.length === 0) {
            // Return empty summaries if no exercise IDs
            return Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
        }
        
        // Create a map to store exercise ID to definition ID mappings
        const exerciseToDefinitionMap: Record<string, ObjectId> = {};
        
        // For each exercise ID, find the exercise and get its definition ID
        for (const exerciseId of exerciseIds) {
            const exercise = await exercises.findExerciseById(exerciseId, userId);
            if (exercise && exercise.definitionId) {
                exerciseToDefinitionMap[exerciseId.toString()] = exercise.definitionId;
            }
        }

        // Map exercise IDs to their definition IDs
        const definitionValues = Object.values(exerciseToDefinitionMap).filter(id => id);
        const definitionIds = [...new Set(definitionValues)];
        
        // Handle empty definitionIds case
        if (definitionIds.length === 0) {
            // Return the summaries without muscle group data
            const result = Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
            console.log('result', result);
            return result;
        }
        
        // Create a map to store definition ID to muscle group mappings
        const definitionToTypeMap: Record<string, string> = {};
        
        // For each definition ID, find the definition and get its primary muscle
        for (const definitionId of definitionIds) {
            const definition = await exerciseDefinitions.findExerciseDefinitionById(definitionId);
            if (definition && definition.primaryMuscle) {
                definitionToTypeMap[definitionId.toString()] = definition.primaryMuscle;
            }
        }

        // Aggregate activity logs by date
        activityLogs.forEach(log => {
            // Get the stored date directly from the log
            const logDate = log.date;
            
            // Create date string in the same format as the dailySummaries keys
            const dateObj = new Date(logDate);
            const dateString = dateObj.toISOString().split('T')[0];
            
            console.log(`Processing log: raw date=${logDate}, ISO date=${dateString}, setsCompleted=${log.setsCompleted}`);
            
            const summary = dailySummaries[dateString];

            if (summary) {
                summary.totalSetsCompleted += log.setsCompleted || 0;

                if (log.exerciseId) {
                    summary.totalExercisesCompleted += 1;
                }

                // Get exercise type
                if (log.exerciseId) {
                    const exerciseIdStr = log.exerciseId.toString();
                    const definitionId = exerciseToDefinitionMap[exerciseIdStr];
                    if (definitionId) {
                        const definitionIdStr = definitionId.toString();
                        const exerciseType = definitionToTypeMap[definitionIdStr] || 'Other';
                        summary.exerciseTypes[exerciseType] = (summary.exerciseTypes[exerciseType] || 0) + 1;
                    }
                }
            } else {
                console.warn(`No summary found for date ${dateString} from log date ${logDate}`);
                // Create a custom format to debug why this date might be missing
                const year = dateObj.getFullYear();
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const day = dateObj.getDate().toString().padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;
                console.warn(`Alternative format: ${formattedDate}`);
                console.warn(`Available dates in summary:`, Object.keys(dailySummaries));
            }
        });
        
        // Debug log the final summaries
        console.log('Final daily summaries:', JSON.stringify(Object.values(dailySummaries), null, 2));

        // Convert the object to an array and sort by date
        const result = Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
        console.log('result', result);
        return result;
    } catch (error) {
        throw new Error(`Failed to fetch daily activity: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 