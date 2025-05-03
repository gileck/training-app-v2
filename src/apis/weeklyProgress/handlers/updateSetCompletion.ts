import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ApiHandlerContext } from '../../types';
import { UpdateSetCompletionRequest, UpdateSetCompletionResponse, WeeklyProgressBase } from '../types';
import { ExerciseBase } from '../../exercises/types';
import { getOrCreateWeeklyProgress } from './_helpers'; // Import helper

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
        const db = await getDb();

        // 1. Ensure doc exists using helper (outside any transaction logic if added later)
        await getOrCreateWeeklyProgress(db, userIdObj, planIdObj, exerciseIdObj, weekNumber);

        // 2. Determine total sets if not provided
        let actualTotalSets = totalSetsForExercise;
        if (actualTotalSets === undefined) {
            const exerciseDoc = await db.collection<ExerciseBase>('exercises').findOne(
                { _id: exerciseIdObj, planId: planIdObj, userId: userIdObj },
                { projection: { sets: 1 } }
            );
            if (!exerciseDoc || typeof exerciseDoc.sets !== 'number') {
                throw new Error('Could not find exercise or determine total sets required.');
            }
            actualTotalSets = exerciseDoc.sets;
        }

        // 3. If completeAll is true, get current setsCompleted to calculate the correct increment
        let effectiveIncrement = setsIncrement;
        if (completeAll) {
            const currentProgress = await db.collection<WeeklyProgressBase>('weeklyProgress').findOne(
                { userId: userIdObj, planId: planIdObj, exerciseId: exerciseIdObj, weekNumber: weekNumber }
            );
            const currentSets = currentProgress?.setsCompleted || 0;
            // Calculate how many sets we need to add to complete all
            effectiveIncrement = actualTotalSets - currentSets;
            // Don't do anything if already complete or would need to decrease sets
            if (effectiveIncrement <= 0) {
                // If already complete or would need to decrease, return the current progress
                return {
                    success: true,
                    updatedProgress: currentProgress as WeeklyProgressBase
                };
            }
        }

        // 4. Perform Update
        const filter = { userId: userIdObj, planId: planIdObj, exerciseId: exerciseIdObj, weekNumber: weekNumber };

        const updateResult = await db.collection<WeeklyProgressBase>('weeklyProgress').findOneAndUpdate(
            filter,
            {
                $inc: { setsCompleted: effectiveIncrement },
                $set: { lastUpdatedAt: now },
                $setOnInsert: {
                    userId: userIdObj, planId: planIdObj, exerciseId: exerciseIdObj, weekNumber: weekNumber,
                    isExerciseDone: (effectiveIncrement > 0 ? effectiveIncrement : 0) >= actualTotalSets,
                    weeklyNotes: [], createdAt: now,
                    ...((effectiveIncrement > 0 ? effectiveIncrement : 0) >= actualTotalSets && { completedAt: now })
                }
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        if (!updateResult) {
            throw new Error('Failed to find or update weekly progress document.');
        }

        const finalUpdatedProgressDoc = updateResult as WeeklyProgressBase;
        const isDoneNow = (finalUpdatedProgressDoc.setsCompleted ?? 0) >= actualTotalSets;
        finalUpdatedProgressDoc.isExerciseDone = isDoneNow;

        // 5. Still update activity log separately (no transaction)
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        await db.collection('exerciseActivityLog').updateOne(
            { userId: userIdObj, exerciseId: exerciseIdObj, date: todayDate },
            { $inc: { setsCompleted: effectiveIncrement } },
            { upsert: true }
        );

        return { success: true, updatedProgress: finalUpdatedProgressDoc };

    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Operation failed" };
    }
}; 