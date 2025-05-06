import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { GetWeeklyProgressRequest, GetWeeklyProgressResponse } from '../types';
import { weeklyProgress } from '@/server/database/collections';

// --- Task 26: Get Weekly Progress ---
// (Moved from server.ts)
export const getWeeklyProgress = async (
    params: GetWeeklyProgressRequest,
    context: ApiHandlerContext
): Promise<GetWeeklyProgressResponse> => {
    const { userId } = context;
    const { planId, exerciseId, weekNumber } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(planId) || !ObjectId.isValid(exerciseId)) {
        throw new Error("Invalid Plan ID or Exercise ID format.");
    }
    if (weekNumber == null || weekNumber < 1) {
        throw new Error("Invalid week number.");
    }

    try {
        const userIdObj = new ObjectId(userId);
        const planIdObj = new ObjectId(planId);
        const exerciseIdObj = new ObjectId(exerciseId);

        // Use the new database layer to get weekly progress for this exercise
        const existingProgress = await weeklyProgress.findProgressForExercise(
            planIdObj,
            exerciseIdObj,
            userIdObj,
            weekNumber
        );

        if (existingProgress) {
            // Map from our new database schema to the API response format
            return {
                _id: existingProgress._id,
                userId: existingProgress.userId,
                planId: existingProgress.planId,
                exerciseId: existingProgress.exerciseId,
                weekNumber: existingProgress.weekNumber,
                setsCompleted: existingProgress.setsCompleted ?? 0,
                isExerciseDone: existingProgress.isExerciseDone ?? false,
                lastUpdatedAt: existingProgress.updatedAt,
                weeklyNotes: existingProgress.weeklyNotes ?? [],
                completed: existingProgress.completed
            };
        } else {
            // No document found, return a default object structure 
            const now = new Date();
            return {
                // Constructing a WeeklyProgressBase compliant object
                _id: new ObjectId(), // Temporary placeholder ID
                userId: userIdObj,
                planId: planIdObj,
                exerciseId: exerciseIdObj,
                weekNumber: weekNumber,
                setsCompleted: 0,
                isExerciseDone: false,
                lastUpdatedAt: now, // Placeholder timestamp
                weeklyNotes: [],
                // completedAt is optional and not present here
            };
        }
    } catch (error) {
        throw new Error(`Failed to fetch weekly progress: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 