import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { EditWeeklyNoteRequest, EditWeeklyNoteResponse } from '@/common/types/training';
import { weeklyProgress } from '@/server/database/collections';

// --- Task 28: Edit Weekly Note ---
// (Moved from server.ts)
export const editWeeklyNote = async (
    params: EditWeeklyNoteRequest,
    context: ApiHandlerContext
): Promise<EditWeeklyNoteResponse> => {
    const { userId } = context;
    const { planId, exerciseId, weekNumber, noteId, updatedNote } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(planId) || !ObjectId.isValid(exerciseId) || !ObjectId.isValid(noteId)) {
        throw new Error("Invalid Plan, Exercise, or Note ID format.");
    }
    if (weekNumber == null || weekNumber < 1 || !updatedNote || updatedNote.trim().length === 0) {
        throw new Error("Invalid week number or missing/empty updated note text.");
    }

    try {
        // Use the weeklyProgress collection function to edit the note
        const editedNote = await weeklyProgress.editWeeklyNote(
            planId,
            exerciseId,
            userId,
            weekNumber,
            noteId,
            updatedNote
        );

        // Convert ObjectId to string for API response
        return {
            noteId: editedNote.noteId.toString(),
            date: editedNote.date,
            note: editedNote.note
        };
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            throw new Error("Weekly progress or specific note not found.");
        }
        console.error("Failed to edit weekly note:", error);
        throw new Error("Failed to edit weekly note.");
    }
}; 