import { ObjectId } from 'mongodb';
import type { WeeklyProgressBase } from '../types';
import { weeklyProgress } from '@/server/database/collections';

// --- Helper: Get or Create Default Weekly Progress ---
// (Moved from server.ts)
export async function getOrCreateWeeklyProgress(
    userId: string | ObjectId,
    planId: string | ObjectId,
    exerciseId: string | ObjectId,
    weekNumber: number
): Promise<WeeklyProgressBase> {
    // Use the collection function directly
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
    const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
    
    const result = await weeklyProgress.getOrCreateWeeklyProgress(
        planIdObj,
        exerciseIdObj,
        userIdObj,
        weekNumber
    );

    // Return mapped result to match the expected WeeklyProgressBase interface
    return {
        _id: result._id,
        userId: result.userId,
        planId: result.planId,
        exerciseId: result.exerciseId,
        weekNumber: result.weekNumber,
        setsCompleted: result.setsCompleted,
        isExerciseDone: result.isExerciseDone,
        lastUpdatedAt: result.updatedAt,
        weeklyNotes: result.weeklyNotes || [],
    };
} 