import { Db, ObjectId } from 'mongodb';
import type { WeeklyProgressBase } from './types';

// --- Helper: Get or Create Default Weekly Progress ---
// (Moved from server.ts)
export async function getOrCreateWeeklyProgress(
    db: Db,
    userId: ObjectId,
    planId: ObjectId,
    exerciseId: ObjectId,
    weekNumber: number
): Promise<WeeklyProgressBase> {
    const filter = {
        userId,
        planId,
        exerciseId,
        weekNumber
    };

    const now = new Date();

    const result = await db.collection<WeeklyProgressBase>('weeklyProgress').findOneAndUpdate(
        filter,
        {
            $setOnInsert: {
                createdAt: now,
                lastUpdatedAt: now,
                setsCompleted: 0,
                totalSets: 0,
                isExerciseDone: false,
                weeklyNotes: []
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    if (!result) {
        throw new Error("Failed to get or create weekly progress");
    }

    return result;
} 