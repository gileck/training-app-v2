import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { GetWeeklyProgressRequest, GetWeeklyProgressResponse } from '@/common/types/training';
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
                _id: existingProgress._id.toString(),
                userId: existingProgress.userId.toString(),
                planId: existingProgress.planId.toString(),
                exerciseId: existingProgress.exerciseId.toString(),
                weekNumber: existingProgress.weekNumber,
                setsCompleted: existingProgress.setsCompleted ?? 0,
                isExerciseDone: existingProgress.isExerciseDone ?? false,
                lastUpdatedAt: existingProgress.updatedAt,
                weeklyNotes: (existingProgress.weeklyNotes ?? []).map(note => ({
                    noteId: note.noteId.toString(),
                    date: note.date,
                    note: note.note
                })),
                completed: existingProgress.completed
            };
        } else {
            // No document found, return a default object structure 
            const now = new Date();
            return {
                // Constructing a WeeklyProgressBase compliant object
                _id: new ObjectId().toString(), // Temporary placeholder ID
                userId: userIdObj.toString(),
                planId: planIdObj.toString(),
                exerciseId: exerciseIdObj.toString(),
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