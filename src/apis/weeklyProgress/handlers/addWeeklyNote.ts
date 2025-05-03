import { ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ApiHandlerContext } from '../../types';
import { AddWeeklyNoteRequest, AddWeeklyNoteResponse, WeeklyProgressBase, WeeklyNote } from '../types';
import { getOrCreateWeeklyProgress } from './_helpers'; // Import helper

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

    const db = await getDb();
    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(planId);
    const exerciseIdObj = new ObjectId(exerciseId);

    // Ensure the progress document exists
    const progressDoc = await getOrCreateWeeklyProgress(db, userIdObj, planIdObj, exerciseIdObj, weekNumber);

    const newNote: WeeklyNote = {
        noteId: new ObjectId(),
        date: new Date(),
        note: note.trim()
    };

    const result = await db.collection<WeeklyProgressBase>('weeklyProgress').updateOne(
        { _id: progressDoc._id }, // Target the specific progress document
        {
            $push: { weeklyNotes: newNote }, // Add the new note to the array
            $set: { lastUpdatedAt: new Date() } // Update timestamp
        }
    );

    if (result.modifiedCount !== 1) {
        console.error(`addWeeklyNote failed to modify document _id: ${progressDoc._id}`);
        throw new Error("Failed to add weekly note.");
    }

    return newNote; // Return the newly created note object
}; 