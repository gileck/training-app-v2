import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ApiHandlerContext } from '../../types';
import { EditWeeklyNoteRequest, EditWeeklyNoteResponse, WeeklyProgressBase, WeeklyNote } from '../types';

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

    const db = await getDb();
    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(planId);
    const exerciseIdObj = new ObjectId(exerciseId);
    const noteIdObj = new ObjectId(noteId);
    const now = new Date();
    const trimmedNote = updatedNote.trim();

    const filter = {
        userId: userIdObj,
        planId: planIdObj,
        exerciseId: exerciseIdObj,
        weekNumber: weekNumber,
        'weeklyNotes.noteId': noteIdObj // Match the specific note within the array
    };

    const update = {
        $set: {
            'weeklyNotes.$.note': trimmedNote, // Update the matched note's text
            'weeklyNotes.$.date': now,       // Update the matched note's date
            lastUpdatedAt: now                // Update the top-level timestamp
        }
    };

    const result = await db.collection<WeeklyProgressBase>('weeklyProgress').updateOne(filter, update);

    if (result.matchedCount === 0) {
        throw new Error("Weekly progress or specific note not found.");
    }
    if (result.modifiedCount !== 1 && result.matchedCount === 1) {
        // This can happen if the updated text is identical to the old text
        console.warn(`[editWeeklyNote] Edit did not modify document (note text might be identical). Filter: ${JSON.stringify(filter)}`);
    }

    // Return the representation of the updated note
    const updatedNoteObject: WeeklyNote = {
        noteId: noteIdObj,
        date: now,
        note: trimmedNote
    };
    return updatedNoteObject;
}; 