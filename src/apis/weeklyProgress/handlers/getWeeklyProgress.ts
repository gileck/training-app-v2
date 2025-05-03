import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ApiHandlerContext } from '../../types';
import { GetWeeklyProgressRequest, GetWeeklyProgressResponse, WeeklyProgressBase } from '../types';

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
        const db = await getDb();
        const userIdObj = new ObjectId(userId);
        const planIdObj = new ObjectId(planId);
        const exerciseIdObj = new ObjectId(exerciseId);

        const filter = { userId: userIdObj, planId: planIdObj, exerciseId: exerciseIdObj, weekNumber: weekNumber };

        // Use findOne to simply read the current state
        const existingProgress = await db.collection<WeeklyProgressBase>('weeklyProgress').findOne(filter);

        if (existingProgress) {
            // Return the found document, ensuring defaults for potentially missing fields
            return {
                // Removed redundant explicit assignments covered by spread
                ...existingProgress,
                setsCompleted: existingProgress.setsCompleted ?? 0, // Apply default if null/undefined
                isExerciseDone: existingProgress.isExerciseDone ?? false, // Apply default if null/undefined
                weeklyNotes: existingProgress.weeklyNotes ?? [], // Apply default if null/undefined
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