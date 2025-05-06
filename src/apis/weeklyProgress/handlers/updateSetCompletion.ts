import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { UpdateSetCompletionRequest, UpdateSetCompletionResponse, WeeklyProgressBase } from '../types';
import { weeklyProgress, exerciseActivityLog, exercises } from '@/server/database/collections';

// --- Task 27: Update Set Completion (Simplified Version) ---
// WARNING: This simpler version might have race conditions for isExerciseDone/completedAt
// under high concurrency compared to the aggregation pipeline approach.
// (Moved from server.ts)
export const updateSetCompletion = async (
    params: UpdateSetCompletionRequest,
    context: ApiHandlerContext
): Promise<UpdateSetCompletionResponse> => {
    const { userId } = context;
    const { planId, exerciseId, weekNumber, setsIncrement, totalSetsForExercise, completeAll } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(planId) || !ObjectId.isValid(exerciseId)) {
        throw new Error("Invalid Plan ID or Exercise ID format.");
    }

    // Skip increment validation if completeAll is true
    if (!completeAll && (weekNumber == null || weekNumber < 1 || !setsIncrement || ![-1, 1].includes(setsIncrement))) {
        throw new Error("Invalid week number or sets increment (must be 1 or -1).");
    }

    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(planId);
    const exerciseIdObj = new ObjectId(exerciseId);
    const now = new Date();

    try {
        // 1. Determine total sets if not provided
        let actualTotalSets = totalSetsForExercise;
        if (actualTotalSets === undefined) {
            const exerciseDoc = await exercises.findExerciseById(exerciseIdObj, userIdObj);
            if (!exerciseDoc || typeof exerciseDoc.sets !== 'number') {
                throw new Error('Could not find exercise or determine total sets required.');
            }
            actualTotalSets = exerciseDoc.sets;
        }

        // 2. Find current progress for this exercise
        const currentProgress = await weeklyProgress.findProgressForExercise(
            planIdObj, 
            exerciseIdObj, 
            userIdObj, 
            weekNumber
        );

        // 3. Calculate the effective increment for this update
        let effectiveIncrement = setsIncrement;
        const currentSets = currentProgress?.setsCompleted || 0;
        
        if (completeAll) {
            // Calculate how many sets we need to add to complete all
            effectiveIncrement = actualTotalSets - currentSets;
            // Don't do anything if already complete or would need to decrease sets
            if (effectiveIncrement <= 0) {
                // If already complete or would need to decrease, return the current progress
                if (currentProgress) {
                    return {
                        success: true,
                        updatedProgress: {
                            _id: currentProgress._id,
                            userId: currentProgress.userId,
                            planId: currentProgress.planId,
                            exerciseId: currentProgress.exerciseId,
                            weekNumber: currentProgress.weekNumber,
                            setsCompleted: currentProgress.setsCompleted,
                            isExerciseDone: currentProgress.isExerciseDone,
                            lastUpdatedAt: currentProgress.updatedAt,
                            weeklyNotes: currentProgress.weeklyNotes || [],
                            completed: currentProgress.completed
                        }
                    };
                } else {
                    // Should not happen - we'd have a currentProgress if setsCompleted > 0
                    throw new Error('Current progress not found but completeAll indicates it should exist');
                }
            }
        }

        // 4. Perform the update with the new database layer
        const newSetsCompleted = currentSets + effectiveIncrement;
        const isDoneNow = newSetsCompleted >= actualTotalSets;
        
        // Create some realistic dates for the week
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - ((weekNumber - 1) * 7));
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        // Prepare data for the upsert operation
        const progressData = {
            userId: userIdObj,
            planId: planIdObj,
            exerciseId: exerciseIdObj,
            weekNumber: weekNumber,
            setsCompleted: newSetsCompleted,
            isExerciseDone: isDoneNow,
            completed: isDoneNow, // For compatibility with the WeeklyProgress type
            startDate,
            endDate,
            weeklyNotes: currentProgress?.weeklyNotes || [],
            createdAt: currentProgress?.createdAt || now,
            updatedAt: now
        };
        
        // Use upsert to create or update
        const updatedProgress = await weeklyProgress.upsertExerciseProgress(progressData);

        // 5. Create/update exercise activity log for today
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        // Use the activityLog DB layer to record today's activity
        await exerciseActivityLog.recordActivity({
            userId: userIdObj,
            exerciseId: exerciseIdObj,
            planId: planIdObj,
            weekNumber: weekNumber,
            date: todayDate,
            setsCompleted: effectiveIncrement,
            repsCompleted: [], // We don't track individual reps in this simple version
            createdAt: now,
            updatedAt: now
        });

        // Map the result to match the expected API response format
        const apiResponse: WeeklyProgressBase = {
            _id: updatedProgress._id,
            userId: updatedProgress.userId,
            planId: updatedProgress.planId,
            exerciseId: updatedProgress.exerciseId,
            weekNumber: updatedProgress.weekNumber,
            setsCompleted: updatedProgress.setsCompleted,
            isExerciseDone: updatedProgress.isExerciseDone,
            lastUpdatedAt: updatedProgress.updatedAt,
            weeklyNotes: updatedProgress.weeklyNotes || [],
            completed: updatedProgress.completed
        };

        return { 
            success: true, 
            updatedProgress: apiResponse
        };

    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Operation failed" };
    }
}; 