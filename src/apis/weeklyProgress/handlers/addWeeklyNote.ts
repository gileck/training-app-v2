import { ObjectId } from 'mongodb';
import { ApiHandlerContext } from '../../types';
import { AddWeeklyNoteRequest, AddWeeklyNoteResponse } from '@/common/types/training';
import { weeklyProgress } from '@/server/database/collections';

// --- Task 28: Add Weekly Note ---
// (Moved from server.ts)
export const addWeeklyNote = async (
    params: AddWeeklyNoteRequest,
    context: ApiHandlerContext
): Promise<AddWeeklyNoteResponse> => {
    const { userId } = context;
    const { planId, exerciseId, weekNumber, note } = params;

    if (!userId) throw new Error("User not authenticated");
    if (!ObjectId.isValid(planId) || !ObjectId.isValid(exerciseId)) {
        throw new Error("Invalid Plan ID or Exercise ID format.");
    }
    if (weekNumber == null || weekNumber < 1 || !note || note.trim().length === 0) {
        throw new Error("Invalid week number or missing/empty note text.");
    }

    try {
        // Use the new database layer to add a weekly note
        const newNote = await weeklyProgress.addWeeklyNote(
            planId,
            exerciseId,
            userId,
            weekNumber,
            note.trim()
        );

        // Convert ObjectId to string for API response
        return {
            noteId: newNote.noteId.toString(),
            date: newNote.date,
            note: newNote.note
        };
    } catch (error) {
        console.error(`addWeeklyNote failed:`, error);
        throw new Error("Failed to add weekly note.");
    }
}; 