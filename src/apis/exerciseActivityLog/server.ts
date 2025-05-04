import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { 
    GetActivityLogParams, 
    GetActivityLogResponse, 
    UpdateActivityLogParams, 
    UpdateActivityLogResponse,
    DeleteActivityLogParams,
    DeleteActivityLogResponse,
    GetActivitySummaryParams,
    GetActivitySummaryResponse,
    ExerciseActivityLogWithDetails,
    DailyActivitySummary
} from './types';

// Re-export API names from index.ts
import {
    name,
    getActivityLogsApiName,
    updateActivityLogApiName,
    deleteActivityLogApiName,
    getActivitySummaryApiName
} from './index';

// Re-export all API names
export {
    name,
    getActivityLogsApiName,
    updateActivityLogApiName,
    deleteActivityLogApiName,
    getActivitySummaryApiName
};

/**
 * Get activity logs for the current user
 */
export async function getActivityLogs(
    params: GetActivityLogParams,
    context: { userId?: string }
): Promise<GetActivityLogResponse> {
    try {
        if (!context.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { startDate, endDate, planId, exerciseId } = params;
        // console.log('getActivityLogs params:', { startDate, endDate, planId, exerciseId, userId: context.userId });
        
        const db = await getDb();

        // Build the query
        const query: Record<string, unknown> = { userId: new ObjectId(context.userId) };
        
        // Important: When querying for dates in MongoDB, we need to ensure:
        // 1. We're using proper Date objects
        // 2. The date range makes sense (start date <= end date)
        // 3. Handle timezone issues consistently
        
        // Add date range to query if provided
        if (startDate || endDate) {
            query.date = {};
            
            if (startDate) {
                const startDateObj = new Date(startDate);
                // Keep exact timestamp rather than normalizing to beginning of day
                (query.date as Record<string, Date>).$gte = startDateObj;
            }
            
            if (endDate) {
                const endDateObj = new Date(endDate);
                // Set time to end of day (23:59:59) to include full day
                endDateObj.setUTCHours(23, 59, 59, 999);
                (query.date as Record<string, Date>).$lte = endDateObj;
            }
        }
        
        if (planId) {
            query.planId = planId;
        }
        
        if (exerciseId) {
            query.exerciseId = exerciseId;
        }

        // Log original query for debugging
        // console.log('Raw MongoDB query:', JSON.stringify(query));
        
        // Create a clean query that won't be stringified inappropriately
        const mongoQuery: Record<string, unknown> = { userId: new ObjectId(context.userId) };
        
        // Handle date range properly
        if (startDate || endDate) {
            mongoQuery.date = {} as Record<string, Date>;
            
            if (startDate) {
                (mongoQuery.date as Record<string, Date>).$gte = new Date(startDate);
            }
            
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setUTCHours(23, 59, 59, 999);
                (mongoQuery.date as Record<string, Date>).$lte = endDateObj;
            }
        }
        
        // Add other filters
        if (planId) {
            mongoQuery.planId = planId;
        }
        
        if (exerciseId) {
            mongoQuery.exerciseId = exerciseId;
        }
        
        // console.log('MongoDB query (before execution):', mongoQuery);
        
        // const AllActivityLogs = await db.collection('exerciseActivityLog').find({}).sort({ date: -1 }).toArray();
        // console.log('All activity logs count:', AllActivityLogs);
        
        // Use the properly constructed mongoQuery
        const activityLogs = await db.collection('exerciseActivityLog').find(mongoQuery).sort({ date: -1 }).toArray();
        // console.log('Activity logs found:', activityLogs.length);
        
        if (activityLogs.length === 0) {
            // If no logs found, try a more basic query to confirm data exists
            const basicQuery = { userId: new ObjectId(context.userId) };
            const allUserLogs = await db.collection('exerciseActivityLog').find(basicQuery).limit(10).toArray();
            // console.log('All user logs count:', allUserLogs.length);
            if (allUserLogs.length > 0) {
                // console.log('Sample log date:', allUserLogs[0].date);
                
                // Try without date filtering to see if that's the issue
                const noDateQuery = { ...mongoQuery };
                delete noDateQuery.date;
                const logsWithoutDateFilter = await db.collection('exerciseActivityLog').find(noDateQuery).limit(10).toArray();
                // console.log('Logs without date filter:', logsWithoutDateFilter.length);
                
                if (logsWithoutDateFilter.length > 0) {
                    return { 
                        success: true, 
                        data: [], 
                        error: `No activity logs found within date range (${startDate} to ${endDate}). Your logs are from different dates.` 
                    };
                }
            }
            
            return { success: true, data: [] };
        }
        
        // Enrich with exercise and plan details
        const enrichedLogs: ExerciseActivityLogWithDetails[] = await Promise.all(
            activityLogs.map(async (log: Record<string, unknown>) => {
                // Get exercise name from exercise definition
                const exercise = await db.collection('exercises').findOne({ 
                    _id: new ObjectId(log.exerciseId as string) 
                });
                const definitionId = exercise?.exerciseDefinitionId;
                const definition = definitionId 
                    ? await db.collection('exerciseDefinitions').findOne({ _id: new ObjectId(definitionId) })
                    : null;
                
                // Get plan name
                const plan = await db.collection('trainingPlans').findOne({ 
                    _id: new ObjectId(log.planId as string) 
                });
                
                return {
                    ...log,
                    _id: (log._id as ObjectId).toString(),
                    userId: log.userId as string,
                    date: log.date as Date,
                    planId: log.planId as string,
                    exerciseId: log.exerciseId as string,
                    exerciseDefinitionId: log.exerciseDefinitionId as string,
                    setsCompleted: log.setsCompleted as number,
                    weekNumber: log.weekNumber as number,
                    exerciseName: definition?.name || 'Unknown Exercise',
                    planName: plan?.name || 'Unknown Plan',
                    primaryMuscle: definition?.primaryMuscle,
                    weight: exercise?.weight,
                    reps: exercise?.reps
                };
            })
        );

        return { success: true, data: enrichedLogs };
    } catch (error) {
        console.error('Error getting activity logs:', error);
        return { success: false, error: 'Failed to get activity logs' };
    }
}

/**
 * Update an activity log
 */
export async function updateActivityLog(
    params: UpdateActivityLogParams,
    context: { userId?: string }
): Promise<UpdateActivityLogResponse> {
    try {
        if (!context.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { activityId, setsCompleted, date } = params;
        if (!activityId) {
            return { success: false, error: 'Activity ID is required' };
        }

        const db = await getDb();
        
        // Verify ownership
        const existingActivity = await db.collection('exerciseActivityLog').findOne({
            _id: new ObjectId(activityId),
            userId: new ObjectId(context.userId)
        });

        if (!existingActivity) {
            return { success: false, error: 'Activity not found' };
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (setsCompleted !== undefined) {
            updateData.setsCompleted = setsCompleted;
        }
        if (date) {
            // Don't normalize the date - keep the exact timestamp
            updateData.date = new Date(date);
        }

        // Update the activity
        await db.collection('exerciseActivityLog').updateOne(
            { _id: new ObjectId(activityId) },
            { $set: updateData }
        );

        // Get updated activity with details
        const updatedActivity = await db.collection('exerciseActivityLog').findOne({
            _id: new ObjectId(activityId)
        });
        
        if (!updatedActivity) {
            return { success: false, error: 'Failed to retrieve updated activity' };
        }
        
        // Enrich with exercise and plan details
        const exercise = await db.collection('exercises').findOne({ 
            _id: new ObjectId(updatedActivity.exerciseId) 
        });
        const definitionId = exercise?.exerciseDefinitionId;
        const definition = definitionId 
            ? await db.collection('exerciseDefinitions').findOne({ 
                _id: new ObjectId(definitionId) 
            })
            : null;
        
        const plan = await db.collection('trainingPlans').findOne({ 
            _id: new ObjectId(updatedActivity.planId) 
        });
        
        const enrichedActivity: ExerciseActivityLogWithDetails = {
            _id: updatedActivity._id.toString(),
            userId: updatedActivity.userId,
            date: updatedActivity.date,
            planId: updatedActivity.planId,
            exerciseId: updatedActivity.exerciseId,
            exerciseDefinitionId: updatedActivity.exerciseDefinitionId,
            setsCompleted: updatedActivity.setsCompleted,
            weekNumber: updatedActivity.weekNumber,
            exerciseName: definition?.name || 'Unknown Exercise',
            planName: plan?.name || 'Unknown Plan',
            primaryMuscle: definition?.primaryMuscle,
            weight: exercise?.weight,
            reps: exercise?.reps
        };

        return { success: true, data: enrichedActivity };
    } catch (error) {
        console.error('Error updating activity log:', error);
        return { success: false, error: 'Failed to update activity log' };
    }
}

/**
 * Delete an activity log
 */
export async function deleteActivityLog(
    params: DeleteActivityLogParams,
    context: { userId?: string }
): Promise<DeleteActivityLogResponse> {
    try {
        if (!context.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { activityId } = params;
        if (!activityId) {
            return { success: false, error: 'Activity ID is required' };
        }

        const db = await getDb();
        
        // Verify ownership
        const existingActivity = await db.collection('exerciseActivityLog').findOne({
            _id: new ObjectId(activityId),
            userId: new ObjectId(context.userId)
        });

        if (!existingActivity) {
            return { success: false, error: 'Activity not found' };
        }

        // Delete the activity
        await db.collection('exerciseActivityLog').deleteOne({ _id: new ObjectId(activityId) });

        return { success: true };
    } catch (error) {
        console.error('Error deleting activity log:', error);
        return { success: false, error: 'Failed to delete activity log' };
    }
}

/**
 * Get activity summary for a date range
 */
export async function getActivitySummary(
    params: GetActivitySummaryParams,
    context: { userId?: string }
): Promise<GetActivitySummaryResponse> {
    try {
        if (!context.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { startDate, endDate, groupBy = 'day' } = params;
        
        if (!startDate || !endDate) {
            return { success: false, error: 'Start date and end date are required' };
        }

        const db = await getDb();

        // Define date format based on groupBy
        let dateFormat;
        let groupingStage;
        
        switch (groupBy) {
            case 'week':
                dateFormat = { $dateToString: { format: "%Y-W%U", date: "$date" } };
                groupingStage = {
                    year: { $year: "$date" },
                    week: { $week: "$date" }
                };
                break;
            case 'month':
                dateFormat = { $dateToString: { format: "%Y-%m", date: "$date" } };
                groupingStage = {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                };
                break;
            case 'day':
            default:
                dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
                groupingStage = {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" }
                };
                break;
        }

        // Aggregate to get daily summaries
        const pipeline = [
            {
                $match: {
                    userId: new ObjectId(context.userId),
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $lookup: {
                    from: "exercises",
                    localField: "exerciseId",
                    foreignField: "_id",
                    as: "exercise"
                }
            },
            {
                $unwind: {
                    path: "$exercise",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "exerciseDefinitions",
                    localField: "exercise.exerciseDefinitionId",
                    foreignField: "_id",
                    as: "definition"
                }
            },
            {
                $unwind: {
                    path: "$definition",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        ...groupingStage,
                        primaryMuscle: "$definition.primaryMuscle"
                    },
                    totalSets: { $sum: "$setsCompleted" },
                    uniqueExercises: { $addToSet: "$exerciseId" },
                    formattedDate: { $first: dateFormat }
                }
            },
            {
                $group: {
                    _id: "$formattedDate",
                    totalSets: { $sum: "$totalSets" },
                    exerciseCount: { $sum: { $size: "$uniqueExercises" } },
                    muscleGroups: {
                        $push: {
                            k: "$_id.primaryMuscle",
                            v: "$totalSets"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalSets: 1,
                    exerciseCount: 1,
                    muscleGroups: {
                        $arrayToObject: {
                            $filter: {
                                input: "$muscleGroups",
                                as: "item",
                                cond: { $ne: ["$$item.k", null] }
                            }
                        }
                    }
                }
            },
            {
                $sort: { date: 1 }
            }
        ];

        const summaries = await db.collection('exerciseActivityLog').aggregate(pipeline).toArray() as unknown as DailyActivitySummary[];

        return {
            success: true,
            data: summaries
        };
    } catch (error) {
        console.error('Error getting activity summary:', error);
        return { success: false, error: 'Failed to get activity summary' };
    }
}
