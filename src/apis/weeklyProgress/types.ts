import { ObjectId } from 'mongodb';

// --- Data Structures (based on database-schema.md) ---

// Represents a note within the weekly progress
export interface WeeklyNote {
    noteId: ObjectId; // Use ObjectId for DB, map to string for client if needed
    date: Date;
    note: string;
}

// Represents the WeeklyProgress document structure
export interface WeeklyProgressBase {
    _id: ObjectId;
    userId: ObjectId;
    planId: ObjectId;
    exerciseId: ObjectId;
    weekNumber: number; // Ensure this is number
    setsCompleted: number;
    isExerciseDone: boolean;
    completed?: boolean; // Whether the exercise week is marked as completed
    lastUpdatedAt: Date;
    weeklyNotes: WeeklyNote[];
}

// Represents the ExerciseActivityLog document structure
export interface ExerciseActivityLogBase {
    _id: ObjectId;
    userId: ObjectId;
    exerciseId: ObjectId;
    date: Date; // Should store just the date part (YYYY-MM-DD)
    setsCompleted: number;
}

// --- API Request/Response Types ---

// GET /weekly-progress
export type GetWeeklyProgressRequest = {
    planId: string;
    exerciseId: string;
    weekNumber: number;
};
// Response will be the WeeklyProgress document (or default if created)
export type GetWeeklyProgressResponse = WeeklyProgressBase;

// POST /weekly-progress/update-set (Task 27)
export type UpdateSetCompletionRequest = {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    setsIncrement: number; // How many sets were just completed (usually 1)
    // Optional: Include total sets for the exercise to calculate isExerciseDone on backend
    totalSetsForExercise?: number;
    // Optional: If true, completes all remaining sets regardless of setsIncrement
    completeAll?: boolean;
};
// Response could be the updated WeeklyProgress or just success
export interface UpdateSetCompletionResponse {
    success: boolean;
    updatedProgress?: WeeklyProgressBase;
    message?: string;
}

// --- Weekly Notes Management (Task 28) ---

// POST /weekly-progress/notes (Add Note)
export type AddWeeklyNoteRequest = {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    note: string; // The text of the note
};
// Returns the newly added note or the updated progress doc
export type AddWeeklyNoteResponse = WeeklyNote & {error?: string}; // Or WeeklyProgressBase

// PUT /weekly-progress/notes/:noteId (Edit Note)
export type EditWeeklyNoteRequest = {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    noteId: string; // ID of the note to edit
    updatedNote: string; // The new text for the note
};
// Returns the updated note or the updated progress doc
export type EditWeeklyNoteResponse = WeeklyNote; // Or WeeklyProgressBase

// DELETE /weekly-progress/notes/:noteId (Delete Note)
export type DeleteWeeklyNoteRequest = {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    noteId: string; // ID of the note to delete
};
export type DeleteWeeklyNoteResponse = {
    success: boolean;
    message?: string;
}; 