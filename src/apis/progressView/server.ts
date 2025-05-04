import { getDb } from '@/server/database';
import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../types';
import { name as baseName } from './index';
import {
    GetDailyActivityRequest,
    GetDailyActivityResponse,
    DailyActivitySummary
} from './types';



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
        const exerciseIds = [...new Set(activityLogs.map(log => log.exerciseId))].filter(id => id); // Filter out undefined/null
        
        // Handle empty exerciseIds case
        if (exerciseIds.length === 0) {
            // Return empty summaries if no exercise IDs
            return Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
        }
        
        // Convert exercise IDs to ObjectIds safely, filtering out any that fail conversion
        const validExerciseObjectIds: ObjectId[] = [];
        for (const id of exerciseIds) {
            try {
                const objectId = new ObjectId(typeof id === 'string' ? id : id?.toString());
                validExerciseObjectIds.push(objectId);
            } catch (error) {
                console.error(`Invalid exercise ID: ${id}`, error instanceof Error ? error.message : String(error));
                // Skip invalid IDs
            }
        }
        
        // If no valid IDs after conversion, return early
        if (validExerciseObjectIds.length === 0) {
            return Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
        }
        
        const exerciseDefinitionIds = await db.collection('exercises').find({
            _id: { $in: validExerciseObjectIds }
        }).project({ _id: 1, exerciseDefinitionId: 1 }).toArray();

        // Map exercise IDs to their definition IDs
        const exerciseToDefinitionMap: Record<string, ObjectId> = {};
        for (const exercise of exerciseDefinitionIds) {
            if (exercise && exercise._id) {
                exerciseToDefinitionMap[exercise._id.toString()] = exercise.exerciseDefinitionId;
            }
        }

        // Get exercise types from definitions - only if we have any definitions
        const definitionValues = Object.values(exerciseToDefinitionMap).filter(id => id);
        const definitionIds = [...new Set(definitionValues)];
        
        // Handle empty definitionIds case
        if (definitionIds.length === 0) {
            // Return the summaries without muscle group data
            const result = Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
            console.log('result', result);
            return result;
        }
        
        // Convert definition IDs to ObjectIds safely
        const validDefinitionObjectIds: ObjectId[] = [];
        for (const id of definitionIds) {
            try {
                const objectId = new ObjectId(typeof id === 'string' ? id : id?.toString());
                validDefinitionObjectIds.push(objectId);
            } catch (error) {
                console.error(`Invalid definition ID: ${id}`, error instanceof Error ? error.message : String(error));
                // Skip invalid IDs
            }
        }
        
        // If no valid definition IDs, return early
        if (validDefinitionObjectIds.length === 0) {
            const result = Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
            console.log('result', result);
            return result;
        }
        
        const exerciseDefinitions = await db.collection('exerciseDefinitions').find({
            _id: { $in: validDefinitionObjectIds }
        }).project({ _id: 1, primaryMuscle: 1 }).toArray();

        // Map definition IDs to their primary muscle group
        const definitionToTypeMap: Record<string, string> = {};
        for (const def of exerciseDefinitions) {
            if (def && def._id) {
                definitionToTypeMap[def._id.toString()] = def.primaryMuscle || 'Other';
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
        const result =  Object.values(dailySummaries).sort((a, b) => a.date.localeCompare(b.date));
        console.log('result', result);
        return result;
    } catch (error) {
        throw new Error(`Failed to fetch daily activity: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 