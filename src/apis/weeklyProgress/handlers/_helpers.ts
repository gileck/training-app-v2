import { Db, ObjectId, ClientSession } from 'mongodb';
import type { WeeklyProgressBase } from '../types';

// --- Helper: Get or Create Default Weekly Progress ---
// (Moved from server.ts)
export async function getOrCreateWeeklyProgress(
    db: Db,
    userId: ObjectId,
    planId: ObjectId,
    exerciseId: ObjectId,
    weekNumber: number,
    session?: ClientSession // Optional session for use within transactions
): Promise<WeeklyProgressBase> {
    const now = new Date();
    const filter = { userId, planId, exerciseId, weekNumber };

    // Keep existing logs for now
    const options = session ? { session } : {};

    const result = await db.collection<WeeklyProgressBase>('weeklyProgress').findOneAndUpdate(
        filter,
        {
            $setOnInsert: {
                userId,
                planId,
                exerciseId,
                weekNumber,
                setsCompleted: 0,
                isExerciseDone: false,
                weeklyNotes: [],
                createdAt: now,
            },
            $set: { lastUpdatedAt: now }
        },
        {
            upsert: true,
            returnDocument: 'after',
            ...options
        }
    );

    if (!result) {
        throw new Error("Failed to retrieve or initialize weekly progress.");
    }

    // Return mapped result to ensure consistency
    return {
        _id: result._id!,
        userId: result.userId!,
        planId: result.planId!,
        exerciseId: result.exerciseId!,
        weekNumber: result.weekNumber!,
        setsCompleted: result.setsCompleted ?? 0,
        isExerciseDone: result.isExerciseDone ?? false,
        lastUpdatedAt: result.lastUpdatedAt!,
        weeklyNotes: result.weeklyNotes ?? [],
        completedAt: result.completedAt, // Pass along completedAt if it exists
    };
} 