import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { WeeklyProgress, WeeklyProgressCreate, WeeklyProgressUpdate } from './types';

// Additional types for exercise progress tracking
interface ExerciseProgress extends WeeklyProgress {
  exerciseId: ObjectId;
  setsCompleted: number;
  isExerciseDone: boolean;
  weeklyNotes?: Array<{
    noteId: ObjectId;
    date: Date;
    note: string;
  }>;
}

// This extends WeeklyProgressCreate to include exercise-specific fields
interface ExerciseProgressCreate extends WeeklyProgressCreate {
  exerciseId: ObjectId;
  setsCompleted: number;
  isExerciseDone: boolean;
  weeklyNotes?: Array<{
    noteId: ObjectId;
    date: Date;
    note: string;
  }>;
}

// Define the WeeklyNote interface for clarity
export interface WeeklyNote {
  noteId: ObjectId;
  date: Date;
  note: string;
}

/**
 * Get a reference to the weeklyProgress collection
 */
const getWeeklyProgressCollection = async (): Promise<Collection<WeeklyProgress>> => {
  const db = await getDb();
  return db.collection<WeeklyProgress>('weeklyProgress');
};

/**
 * Find weekly progress entries for a specific training plan
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user (for permission check)
 * @returns Array of weekly progress entries sorted by weekNumber
 */
export const findWeeklyProgressForPlan = async (
  planId: ObjectId | string,
  userId: ObjectId | string
): Promise<WeeklyProgress[]> => {
  const collection = await getWeeklyProgressCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    planId: planIdObj,
    userId: userIdObj
  }).sort({ weekNumber: 1 }).toArray();
};

/**
 * Find progress for a specific exercise in a specific week
 * @param planId - The ID of the training plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @returns The exercise progress entry or null if not found
 */
export const findProgressForExercise = async (
  planId: ObjectId | string,
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number
): Promise<ExerciseProgress | null> => {
  const db = await getDb();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return db.collection<ExerciseProgress>('weeklyProgress').findOne({
    planId: planIdObj,
    exerciseId: exerciseIdObj,
    userId: userIdObj,
    weekNumber
  });
};

/**
 * Find a specific week's progress
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @returns The weekly progress entry or null if not found
 */
export const findWeekByNumber = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number
): Promise<WeeklyProgress | null> => {
  const collection = await getWeeklyProgressCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({
    planId: planIdObj,
    userId: userIdObj,
    weekNumber
  });
};

/**
 * Find a single weekly progress entry by ID
 * @param progressId - The ID of the weekly progress entry
 * @param userId - The ID of the user (for permission check)
 * @returns The weekly progress entry or null if not found
 */
export const findWeeklyProgressById = async (
  progressId: ObjectId | string,
  userId: ObjectId | string
): Promise<WeeklyProgress | null> => {
  const collection = await getWeeklyProgressCollection();
  const idObj = typeof progressId === 'string' ? new ObjectId(progressId) : progressId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({
    _id: idObj,
    userId: userIdObj
  });
};

/**
 * Insert a new weekly progress entry
 * @param progress - The weekly progress data to insert
 * @returns The inserted weekly progress with _id
 */
export const insertWeeklyProgress = async (progress: WeeklyProgressCreate): Promise<WeeklyProgress> => {
  const collection = await getWeeklyProgressCollection();
  
  // Check if a progress entry already exists for this week and plan
  const existing = await collection.findOne({
    planId: progress.planId,
    userId: progress.userId,
    weekNumber: progress.weekNumber
  });
  
  if (existing) {
    throw new Error(`Weekly progress entry already exists for week ${progress.weekNumber}`);
  }
  
  const result = await collection.insertOne(progress as WeeklyProgress);
  
  if (!result.insertedId) {
    throw new Error('Failed to insert weekly progress');
  }
  
  return { ...progress, _id: result.insertedId } as WeeklyProgress;
};

/**
 * Insert or update an exercise's progress for a specific week
 * @param progress - The exercise progress data to insert or update
 * @returns The inserted or updated exercise progress with _id
 */
export const upsertExerciseProgress = async (
  progress: ExerciseProgressCreate
): Promise<ExerciseProgress> => {
  const db = await getDb();
  const now = new Date();
  
  // Set default values for missing fields
  const data = {
    ...progress,
    setsCompleted: progress.setsCompleted ?? 0,
    isExerciseDone: progress.isExerciseDone ?? false,
    weeklyNotes: progress.weeklyNotes ?? [],
    updatedAt: now
  };
  
  const result = await db.collection<ExerciseProgress>('weeklyProgress').findOneAndUpdate(
    {
      planId: data.planId,
      exerciseId: data.exerciseId,
      userId: data.userId,
      weekNumber: data.weekNumber
    },
    {
      $setOnInsert: {
        createdAt: now
      },
      $set: {
        setsCompleted: data.setsCompleted,
        isExerciseDone: data.isExerciseDone,
        weeklyNotes: data.weeklyNotes,
        updatedAt: now,
        ...(data.completed && { completed: data.completed }),
      }
    },
    {
      upsert: true,
      returnDocument: 'after'
    }
  );
  
  if (!result) {
    throw new Error('Failed to upsert exercise progress');
  }
  
  return result;
};

/**
 * Update an existing weekly progress entry
 * @param progressId - The ID of the weekly progress to update
 * @param userId - The ID of the user (for permission check)
 * @param update - The update data
 * @returns The updated weekly progress or null if not found
 */
export const updateWeeklyProgress = async (
  progressId: ObjectId | string,
  userId: ObjectId | string,
  update: WeeklyProgressUpdate
): Promise<WeeklyProgress | null> => {
  const collection = await getWeeklyProgressCollection();
  const idObj = typeof progressId === 'string' ? new ObjectId(progressId) : progressId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await collection.findOneAndUpdate(
    { _id: idObj, userId: userIdObj },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  return result || null;
};

/**
 * Set a week as completed or uncompleted
 * @param progressId - The ID of the weekly progress to update
 * @param userId - The ID of the user (for permission check)
 * @param completed - Whether the week is completed
 * @returns The updated weekly progress or null if not found
 */
export const setWeekCompleted = async (
  progressId: ObjectId | string,
  userId: ObjectId | string,
  completed: boolean
): Promise<WeeklyProgress | null> => {
  const now = new Date();
  return updateWeeklyProgress(progressId, userId, { completed, updatedAt: now });
};

/**
 * Delete a weekly progress entry
 * @param progressId - The ID of the weekly progress to delete
 * @param userId - The ID of the user (for permission check)
 * @returns True if the weekly progress was deleted, false otherwise
 */
export const deleteWeeklyProgress = async (
  progressId: ObjectId | string,
  userId: ObjectId | string
): Promise<boolean> => {
  const collection = await getWeeklyProgressCollection();
  const idObj = typeof progressId === 'string' ? new ObjectId(progressId) : progressId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await collection.deleteOne({
    _id: idObj,
    userId: userIdObj
  });
  
  return result.deletedCount === 1;
};

/**
 * Initialize weekly progress entries for a training plan
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user
 * @param durationWeeks - The number of weeks in the plan
 * @param startDate - The start date of the plan (first day of week 1)
 * @returns Array of created weekly progress entries
 */
export const initializeWeeklyProgress = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  durationWeeks: number,
  startDate: Date
): Promise<WeeklyProgress[]> => {
  const collection = await getWeeklyProgressCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const now = new Date();
  
  // Create an array of weekly progress entries
  const entries: WeeklyProgressCreate[] = [];
  
  // Calculate dates for each week
  for (let weekNumber = 1; weekNumber <= durationWeeks; weekNumber++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    entries.push({
      userId: userIdObj,
      planId: planIdObj,
      weekNumber,
      completed: false,
      startDate: weekStartDate,
      endDate: weekEndDate,
      createdAt: now,
      updatedAt: now
    });
  }
  
  // Insert all entries
  if (entries.length > 0) {
    const result = await collection.insertMany(entries as WeeklyProgress[]);
    
    if (result.insertedCount !== entries.length) {
      throw new Error('Failed to insert all weekly progress entries');
    }
    
    // Return the inserted entries with their IDs
    return await collection.find({
      planId: planIdObj,
      userId: userIdObj
    }).sort({ weekNumber: 1 }).toArray();
  }
  
  return [];
};

/**
 * Add a note to a weekly progress entry for a specific exercise
 * @param planId - The ID of the training plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @param noteText - The text of the note to add
 * @returns The newly added note
 */
export const addWeeklyNote = async (
  planId: ObjectId | string,
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number,
  noteText: string
): Promise<WeeklyNote> => {
  const db = await getDb();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const now = new Date();
  
  // Create the new note
  const newNote: WeeklyNote = {
    noteId: new ObjectId(),
    date: now,
    note: noteText.trim()
  };
  
  // First, try to find the existing progress document
  const progressDoc = await findProgressForExercise(planIdObj, exerciseIdObj, userIdObj, weekNumber);
  
  if (!progressDoc) {
    // If no progress document exists, create one with default values
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - ((weekNumber - 1) * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const progressData: ExerciseProgressCreate = {
      userId: userIdObj,
      planId: planIdObj,
      exerciseId: exerciseIdObj,
      weekNumber,
      setsCompleted: 0,
      isExerciseDone: false,
      startDate,
      endDate,
      weeklyNotes: [newNote],
      createdAt: now,
      updatedAt: now,
      completed: false
    };
    
    // Insert the new progress document
    await upsertExerciseProgress(progressData);
  } else {
    // If the document exists, add the note to it
    await db.collection<ExerciseProgress>('weeklyProgress').updateOne(
      {
        planId: planIdObj,
        exerciseId: exerciseIdObj,
        userId: userIdObj,
        weekNumber
      },
      {
        $push: { weeklyNotes: newNote },
        $set: { updatedAt: now }
      }
    );
  }
  
  return newNote;
};

/**
 * Edit an existing note in a weekly progress entry
 * @param planId - The ID of the training plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @param noteId - The ID of the note to edit
 * @param updatedNoteText - The updated text for the note
 * @returns The updated note
 * @throws Error if the progress document or note is not found
 */
export const editWeeklyNote = async (
  planId: ObjectId | string,
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number,
  noteId: ObjectId | string,
  updatedNoteText: string
): Promise<WeeklyNote> => {
  const db = await getDb();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const noteIdObj = typeof noteId === 'string' ? new ObjectId(noteId) : noteId;
  const now = new Date();
  const trimmedNote = updatedNoteText.trim();
  
  // Find and update the specific note within the weeklyNotes array
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
      'weeklyNotes.$.date': now,         // Update the matched note's date
      updatedAt: now                     // Update the document's timestamp
    }
  };
  
  const result = await db.collection<ExerciseProgress>('weeklyProgress').updateOne(filter, update);
  
  if (result.matchedCount === 0) {
    throw new Error('Weekly progress or specific note not found');
  }
  
  // Return the representation of the updated note
  const updatedNote: WeeklyNote = {
    noteId: noteIdObj,
    date: now,
    note: trimmedNote
  };
  
  return updatedNote;
};

/**
 * Delete a note from a weekly progress entry
 * @param planId - The ID of the training plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @param noteId - The ID of the note to delete
 * @returns True if the note was deleted, false otherwise
 */
export const deleteWeeklyNote = async (
  planId: ObjectId | string,
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number,
  noteId: ObjectId | string
): Promise<boolean> => {
  const db = await getDb();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const noteIdObj = typeof noteId === 'string' ? new ObjectId(noteId) : noteId;
  const now = new Date();
  
  // Find the document and remove the specific note from the weeklyNotes array
  const filter = {
    userId: userIdObj,
    planId: planIdObj,
    exerciseId: exerciseIdObj,
    weekNumber: weekNumber
  };
  
  const update = {
    // Use $pull to remove the note matching the noteId from the array
    $pull: { weeklyNotes: { noteId: noteIdObj } },
    $set: { updatedAt: now }
  };
  
  const result = await db.collection<ExerciseProgress>('weeklyProgress').updateOne(filter, update);
  
  // Return true if a note was actually removed
  return result.matchedCount === 1 && result.modifiedCount === 1;
};

/**
 * Get or create a weekly progress entry for an exercise in a specific week
 * This function ensures an entry exists and returns it
 * @param planId - The ID of the training plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user
 * @param weekNumber - The week number
 * @returns The weekly progress entry (created if it didn't exist)
 */
export const getOrCreateWeeklyProgress = async (
  planId: ObjectId | string,
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number
): Promise<ExerciseProgress> => {
  const db = await getDb();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const now = new Date();
  // Get today's date for start/end date calculations
  const today = new Date();
  // Calculate start date (beginning of the week)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - ((weekNumber - 1) * 7));
  // Calculate end date (end of the week)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const filter = { 
    userId: userIdObj, 
    planId: planIdObj, 
    exerciseId: exerciseIdObj, 
    weekNumber 
  };

  const result = await db.collection<ExerciseProgress>('weeklyProgress').findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        userId: userIdObj,
        planId: planIdObj,
        exerciseId: exerciseIdObj,
        weekNumber,
        setsCompleted: 0,
        isExerciseDone: false,
        weeklyNotes: [],
        createdAt: now,
        startDate,
        endDate,
        completed: false
      },
      $set: { updatedAt: now }
    },
    {
      upsert: true,
      returnDocument: 'after'
    }
  );

  if (!result) {
    throw new Error("Failed to retrieve or initialize weekly progress.");
  }

  // Return mapped result to ensure consistency
  return {
    _id: result._id!,
    userId: result.userId!,
    planId: result.planId!,
    exerciseId: result.exerciseId!,
    weekNumber: result.weekNumber!,
    setsCompleted: result.setsCompleted ?? 0,
    isExerciseDone: result.isExerciseDone ?? false,
    updatedAt: result.updatedAt!,
    weeklyNotes: result.weeklyNotes ?? [],
    createdAt: result.createdAt!,
    startDate: result.startDate!,
    endDate: result.endDate!,
    completed: result.completed ?? false
  };
}; 