import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { DeleteWeeklyNoteRequest, DeleteWeeklyNoteResponse } from '../types';
import { weeklyProgress } from '@/server/database/collections';

// --- Task 28: Delete Weekly Note ---
// (Moved from server.ts)
export const deleteWeeklyNote = async (
    params: DeleteWeeklyNoteRequest,
    context: ApiHandlerContext
): Promise<DeleteWeeklyNoteResponse> => {
    const { userId } = context;
    const { planId, exerciseId, weekNumber, noteId } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(planId) || !ObjectId.isValid(exerciseId) || !ObjectId.isValid(noteId)) {
        throw new Error("Invalid Plan, Exercise, or Note ID format.");
    }
    if (weekNumber == null || weekNumber < 1) {
        throw new Error("Invalid week number.");
    }

    try {
        // Use the weeklyProgress collection function to delete the note
        const deleted = await weeklyProgress.deleteWeeklyNote(
            planId,
            exerciseId,
            userId,
            weekNumber,
            noteId
        );

        if (!deleted) {
            // Check if the progress document exists to provide a better error message
            const progress = await weeklyProgress.findProgressForExercise(
                planId,
                exerciseId,
                userId,
                weekNumber
            );

            if (!progress) {
                return { success: false, message: "Weekly progress not found for the specified week." };
            } else {
                return { success: false, message: "Note not found within the specified week's progress." };
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to delete weekly note:", error);
        return { success: false, message: "An error occurred while deleting the note." };
    }
}; 