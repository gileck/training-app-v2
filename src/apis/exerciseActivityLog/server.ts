import { ObjectId } from 'mongodb';
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
import { exerciseActivityLog, exercises, exerciseDefinitions, trainingPlans } from '@/server/database/collections';
import { ExerciseActivityLog } from '@/server/database/collections/exerciseActivityLog/types';

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
        const userIdObj = new ObjectId(context.userId);
        
        // Create filter for activity logs
        const filter: Record<string, unknown> = {};
        
        // Add date range to filter if provided
        if (startDate || endDate) {
            filter.date = {};
            
            if (startDate) {
                (filter.date as Record<string, Date>).$gte = new Date(startDate);
            }
            
            if (endDate) {
                const endDateObj = new Date(endDate);
                // Set time to end of day (23:59:59) to include full day
                endDateObj.setUTCHours(23, 59, 59, 999);
                (filter.date as Record<string, Date>).$lte = endDateObj;
            }
        }
        
        // Add plan filter if provided
        if (planId) {
            filter.planId = new ObjectId(planId);
        }
        
        // Add exercise filter if provided
        if (exerciseId) {
            filter.exerciseId = new ObjectId(exerciseId);
        }
        
        // Get activity logs using the database layer
        const activityLogs = await exerciseActivityLog.findActivityLogsForUser(userIdObj, filter);
        
        if (activityLogs.length === 0) {
            // Check if there are any logs for this user
            const allUserLogs = await exerciseActivityLog.findActivityLogsForUser(userIdObj, {});
            
            if (allUserLogs.length > 0) {
                // Try without date filtering to see if that's the issue
                const noDateFilter = { ...filter };
                delete noDateFilter.date;
                
                const logsWithoutDateFilter = await exerciseActivityLog.findActivityLogsForUser(userIdObj, noDateFilter);
                
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
            activityLogs.map(async (log: ExerciseActivityLog) => {
                // Get exercise details
                const exercise = await exercises.findExerciseById(log.exerciseId, userIdObj);
                let definitionName = 'Unknown Exercise';
                let primaryMuscle = undefined;
                
                if (exercise?.definitionId) {
                    const definition = await exerciseDefinitions.findExerciseDefinitionById(exercise.definitionId);
                    if (definition) {
                        definitionName = definition.name;
                        primaryMuscle = definition.primaryMuscle;
                    }
                }
                
                // Get plan name
                let planName = 'Unknown Plan';
                if (log.planId) {
                    const plan = await trainingPlans.findTrainingPlanById(log.planId, userIdObj);
                    if (plan) {
                        planName = plan.name;
                    }
                }
                
                return {
                    _id: log._id.toString(),
                    userId: log.userId.toString(),
                    date: log.date,
                    planId: log.planId.toString(),
                    exerciseId: log.exerciseId.toString(),
                    exerciseDefinitionId: (exercise?.definitionId || log.exerciseId).toString(),
                    setsCompleted: log.setsCompleted,
                    weekNumber: log.weekNumber,
                    exerciseName: definitionName,
                    planName: planName,
                    primaryMuscle: primaryMuscle,
                    weight: exercise?.weight,
                    reps: exercise?.reps ? parseInt(exercise.reps, 10) : undefined
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

        const userId = new ObjectId(context.userId);
        const activityIdObj = new ObjectId(activityId);
        
        // Verify ownership using the database layer
        const existingActivity = await exerciseActivityLog.findActivityLogById(activityIdObj, userId);

        if (!existingActivity) {
            return { success: false, error: 'Activity not found' };
        }

        // Build update object
        const now = new Date();
        const updateData: exerciseActivityLog.ExerciseActivityLogUpdate = {
            updatedAt: now
        };
        
        if (setsCompleted !== undefined) {
            updateData.setsCompleted = setsCompleted;
        }
        
        if (date) {
            updateData.date = new Date(date);
        }

        // Update the activity using the database layer
        const updatedActivity = await exerciseActivityLog.updateActivityLog(activityIdObj, userId, updateData);

        if (!updatedActivity) {
            return { success: false, error: 'Failed to update activity' };
        }
        
        // Enrich with exercise and plan details similar to getActivityLogs
        const exercise = await exercises.findExerciseById(updatedActivity.exerciseId, userId);
        let definitionName = 'Unknown Exercise';
        let primaryMuscle = undefined;
        
        if (exercise?.definitionId) {
            const definition = await exerciseDefinitions.findExerciseDefinitionById(exercise.definitionId);
            if (definition) {
                definitionName = definition.name;
                primaryMuscle = definition.primaryMuscle;
            }
        }
        
        // Get plan name
        let planName = 'Unknown Plan';
        if (updatedActivity.planId) {
            const plan = await trainingPlans.findTrainingPlanById(updatedActivity.planId, userId);
            if (plan) {
                planName = plan.name;
            }
        }
        
        const enrichedActivity: ExerciseActivityLogWithDetails = {
            _id: updatedActivity._id.toString(),
            userId: updatedActivity.userId.toString(),
            date: updatedActivity.date,
            planId: updatedActivity.planId.toString(),
            exerciseId: updatedActivity.exerciseId.toString(),
            exerciseDefinitionId: (exercise?.definitionId || updatedActivity.exerciseId).toString(),
            setsCompleted: updatedActivity.setsCompleted,
            weekNumber: updatedActivity.weekNumber,
            exerciseName: definitionName,
            planName: planName,
            primaryMuscle: primaryMuscle,
            weight: exercise?.weight,
            reps: exercise?.reps ? parseInt(exercise.reps, 10) : undefined
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

        const userId = new ObjectId(context.userId);
        const activityIdObj = new ObjectId(activityId);
        
        // Verify ownership using the database layer
        const existingActivity = await exerciseActivityLog.findActivityLogById(activityIdObj, userId);

        if (!existingActivity) {
            return { success: false, error: 'Activity not found' };
        }

        // Delete the activity using the database layer
        const deleted = await exerciseActivityLog.deleteActivityLog(activityIdObj, userId);

        if (!deleted) {
            return { success: false, error: 'Failed to delete activity' };
        }

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

        const userId = new ObjectId(context.userId);
        
        // Get activity logs for the date range
        const filter: Record<string, unknown> = {
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const activityLogs = await exerciseActivityLog.findActivityLogsForUser(userId, filter);
        
        if (activityLogs.length === 0) {
            return { success: true, data: [] };
        }
        
        // Get all exercise definitions for the muscle groups
        const exerciseDefinitionsCache = new Map();
        
        // Get all unique exerciseIds from the logs
        const exerciseIds = [...new Set(activityLogs.map(log => log.exerciseId.toString()))];
        
        // Fetch exercise details in parallel
        await Promise.all(
            exerciseIds.map(async (exerciseId) => {
                const exercise = await exercises.findExerciseById(new ObjectId(exerciseId), userId);
                if (exercise?.definitionId) {
                    const definition = await exerciseDefinitions.findExerciseDefinitionById(exercise.definitionId);
                    if (definition) {
                        exerciseDefinitionsCache.set(exerciseId, {
                            name: definition.name,
                            primaryMuscle: definition.primaryMuscle
                        });
                    }
                }
            })
        );
        
        // Extend DailyActivitySummary to allow tracking exercises
        interface ExtendedDailyActivitySummary extends DailyActivitySummary {
            // Define specific properties that might be added dynamically
            muscleGroups: { [key: string]: number };
            // Allow other dynamic properties
            [key: string]: string | number | ObjectId | Date | boolean | undefined | { [key: string]: number };
        }
        
        // Group logs by date (or appropriate grouping)
        const groupedLogs = new Map<string, ExtendedDailyActivitySummary>();
        
        activityLogs.forEach(log => {
            // Determine the group key based on groupBy parameter
            let groupKey: string;
            
            if (groupBy === 'day') {
                groupKey = log.date.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (groupBy === 'week') {
                // Get week number - ISO weeks start on Monday
                const date = new Date(log.date);
                const dayOfWeek = date.getUTCDay() || 7; // Convert Sunday from 0 to 7
                const mondayDate = new Date(date);
                mondayDate.setUTCDate(date.getUTCDate() - (dayOfWeek - 1));
                groupKey = mondayDate.toISOString().split('T')[0]; // Monday of the week
            } else { // month
                groupKey = log.date.toISOString().substr(0, 7); // YYYY-MM
            }
            
            // Initialize group if not exists
            if (!groupedLogs.has(groupKey)) {
                groupedLogs.set(groupKey, {
                    date: groupKey,
                    totalSets: 0,
                    exerciseCount: 0,
                    muscleGroups: {}
                });
            }
            
            const summary = groupedLogs.get(groupKey)!;
            summary.totalSets += log.setsCompleted;
            
            // Increment exercise count only once per unique exercise
            const exerciseKey = log.exerciseId.toString();
            if (!summary[exerciseKey]) {
                summary.exerciseCount++;
                summary[exerciseKey] = true;
            }
            
            // Add muscle group if available
            const exerciseInfo = exerciseDefinitionsCache.get(exerciseKey);
            if (exerciseInfo?.primaryMuscle) {
                const muscleGroup = exerciseInfo.primaryMuscle;
                summary.muscleGroups[muscleGroup] = (summary.muscleGroups[muscleGroup] || 0) + log.setsCompleted;
            }
        });
        
        // Convert map to array and clean up temporary properties
        const summaries = Array.from(groupedLogs.values()).map(summary => {
            // Delete the tracking properties that aren't part of the final output
            const cleanSummary: DailyActivitySummary = {
                date: summary.date,
                totalSets: summary.totalSets,
                exerciseCount: summary.exerciseCount,
                muscleGroups: summary.muscleGroups
            };
            
            return cleanSummary;
        });
        
        // Sort by date
        summaries.sort((a, b) => a.date.localeCompare(b.date));
        
        return { success: true, data: summaries };
    } catch (error) {
        console.error('Error getting activity summary:', error);
        return { success: false, error: 'Failed to get activity summary' };
    }
}
