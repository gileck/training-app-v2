import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ApiHandlerContext } from '../../types';
import { DeleteWeeklyNoteRequest, DeleteWeeklyNoteResponse, WeeklyProgressBase } from '../types';

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

    const db = await getDb();
    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(planId);
    const exerciseIdObj = new ObjectId(exerciseId);
    const noteIdObj = new ObjectId(noteId);

    const filter = {
        userId: userIdObj,
        planId: planIdObj,
        exerciseId: exerciseIdObj,
        weekNumber: weekNumber
        // No need to match noteId in filter, $pull handles that
    };

    const update = {
        // Use $pull to remove the note matching the noteId from the array
        $pull: { weeklyNotes: { noteId: noteIdObj } },
        $set: { lastUpdatedAt: new Date() } // Update timestamp
    };

    const result = await db.collection<WeeklyProgressBase>('weeklyProgress').updateOne(filter, update);

    // Check if the main document was found
    if (result.matchedCount === 0) {
        // Success: false, Message: Document not found (no note could have been deleted)
        return { success: false, message: "Weekly progress not found for the specified week." };
    }
    // Check if the pull operation actually removed an element
    if (result.modifiedCount !== 1) {
        // Success: false, Message: Note not found within the document
        return { success: false, message: "Note not found within the specified week's progress." };
    }

    // Success: true (document found and note removed)
    return { success: true };
}; 