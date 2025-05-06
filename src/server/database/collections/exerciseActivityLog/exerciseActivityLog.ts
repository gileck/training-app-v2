import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { ExerciseActivityLog, ExerciseActivityLogCreate, ExerciseActivityLogUpdate, ExerciseActivityLogFilter } from './types';

/**
 * Get a reference to the exerciseActivityLog collection
 */
export const getExerciseActivityLogCollection = async (): Promise<Collection<ExerciseActivityLog>> => {
  const db = await getDb();
  return db.collection<ExerciseActivityLog>('exerciseActivityLog');
};

/**
 * Find exercise activity logs for a specific plan
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user (for permission check)
 * @param filter - Optional additional filters
 * @returns Array of exercise activity logs sorted by date (newest first)
 */
export const findActivityLogsForPlan = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  filter?: Omit<ExerciseActivityLogFilter, 'userId' | 'planId'>
): Promise<ExerciseActivityLog[]> => {
  const collection = await getExerciseActivityLogCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    planId: planIdObj,
    userId: userIdObj,
    ...filter
  }).sort({ date: -1 }).toArray();
};

/**
 * Find exercise activity logs for a specific exercise
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @returns Array of exercise activity logs sorted by date (newest first)
 */
export const findActivityLogsForExercise = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string
): Promise<ExerciseActivityLog[]> => {
  const collection = await getExerciseActivityLogCollection();
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    exerciseId: exerciseIdObj,
    userId: userIdObj
  }).sort({ date: -1 }).toArray();
};

/**
 * Find exercise activity logs for a specific week
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user (for permission check)
 * @param weekNumber - The week number
 * @returns Array of exercise activity logs for the week
 */
export const findActivityLogsForWeek = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  weekNumber: number
): Promise<ExerciseActivityLog[]> => {
  const collection = await getExerciseActivityLogCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    planId: planIdObj,
    userId: userIdObj,
    weekNumber
  }).sort({ date: -1 }).toArray();
};

/**
 * Find a single activity log by ID
 * @param logId - The ID of the activity log
 * @param userId - The ID of the user (for permission check)
 * @returns The activity log or null if not found
 */
export const findActivityLogById = async (
  logId: ObjectId | string,
  userId: ObjectId | string
): Promise<ExerciseActivityLog | null> => {
  const collection = await getExerciseActivityLogCollection();
  const idObj = typeof logId === 'string' ? new ObjectId(logId) : logId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({
    _id: idObj,
    userId: userIdObj
  });
};

/**
 * Insert a new exercise activity log
 * @param log - The exercise activity log data to insert
 * @returns The inserted exercise activity log with _id
 */
export const insertActivityLog = async (log: ExerciseActivityLogCreate): Promise<ExerciseActivityLog> => {
  const collection = await getExerciseActivityLogCollection();
  const result = await collection.insertOne(log as ExerciseActivityLog);
  
  if (!result.insertedId) {
    throw new Error('Failed to insert exercise activity log');
  }
  
  return { ...log, _id: result.insertedId } as ExerciseActivityLog;
};

/**
 * Update an existing exercise activity log
 * @param logId - The ID of the log to update
 * @param userId - The ID of the user (for permission check)
 * @param update - The update data
 * @returns The updated exercise activity log or null if not found
 */
export const updateActivityLog = async (
  logId: ObjectId | string,
  userId: ObjectId | string,
  update: ExerciseActivityLogUpdate
): Promise<ExerciseActivityLog | null> => {
  const collection = await getExerciseActivityLogCollection();
  const idObj = typeof logId === 'string' ? new ObjectId(logId) : logId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await collection.findOneAndUpdate(
    { _id: idObj, userId: userIdObj },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  return result || null;
};

/**
 * Delete an exercise activity log
 * @param logId - The ID of the log to delete
 * @param userId - The ID of the user (for permission check)
 * @returns True if the log was deleted, false otherwise
 */
export const deleteActivityLog = async (
  logId: ObjectId | string,
  userId: ObjectId | string
): Promise<boolean> => {
  const collection = await getExerciseActivityLogCollection();
  const idObj = typeof logId === 'string' ? new ObjectId(logId) : logId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await collection.deleteOne({
    _id: idObj,
    userId: userIdObj
  });
  
  return result.deletedCount === 1;
};

/**
 * Get aggregate statistics for an exercise
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user
 * @returns Object containing stats like most used weight, average reps, etc.
 */
export const getExerciseStats = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string
): Promise<{ 
  totalWorkouts: number;
  maxWeight: string | null;
  averageSets: number;
  averageReps: number;
  bestReps: string | null;
}> => {
  const collection = await getExerciseActivityLogCollection();
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const logs = await collection.find({
    exerciseId: exerciseIdObj,
    userId: userIdObj
  }).toArray();
  
  if (logs.length === 0) {
    return {
      totalWorkouts: 0,
      maxWeight: null,
      averageSets: 0,
      averageReps: 0,
      bestReps: null
    };
  }
  
  // Calculate statistics
  const totalWorkouts = logs.length;
  
  // Find max weight (if applicable)
  const weights = logs.filter(log => log.weight).map(log => log.weight as string);
  const maxWeight = weights.length > 0 ? weights.reduce((max, weight) => {
    // This is a simplistic approach - in a real app, you'd need to parse weights properly
    return weight > max ? weight : max;
  }, weights[0]) : null;
  
  // Calculate average sets
  const averageSets = logs.reduce((sum, log) => sum + log.setsCompleted, 0) / totalWorkouts;
  
  // Calculate average reps per set
  let totalReps = 0;
  let totalSets = 0;
  logs.forEach(log => {
    log.repsCompleted.forEach(rep => {
      // Convert rep strings to numbers when possible
      const repNum = parseInt(rep, 10);
      if (!isNaN(repNum)) {
        totalReps += repNum;
        totalSets++;
      }
    });
  });
  const averageReps = totalSets > 0 ? totalReps / totalSets : 0;
  
  // Find the best rep set (highest number of reps in a single set)
  let bestRep = 0;
  logs.forEach(log => {
    log.repsCompleted.forEach(rep => {
      const repNum = parseInt(rep, 10);
      if (!isNaN(repNum) && repNum > bestRep) {
        bestRep = repNum;
      }
    });
  });
  
  return {
    totalWorkouts,
    maxWeight,
    averageSets,
    averageReps,
    bestReps: bestRep > 0 ? bestRep.toString() : null
  };
};

/**
 * Record exercise activity for a given day
 * This is a simplified function to record activities when completing sets
 * @param activity - The activity data to record
 * @returns The created or updated activity log entry
 */
export const recordActivity = async (
  activity: ExerciseActivityLogCreate
): Promise<ExerciseActivityLog> => {
  const db = await getDb();
  
  // Format date to ensure it only has date part
  const normalizedDate = new Date(activity.date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  // Use upsert to create or update the entry
  const result = await db.collection<ExerciseActivityLog>('exerciseActivityLog').findOneAndUpdate(
    {
      userId: activity.userId,
      exerciseId: activity.exerciseId,
      date: normalizedDate
    },
    {
      $inc: { setsCompleted: activity.setsCompleted },
      $set: { updatedAt: activity.updatedAt },
      $setOnInsert: {
        planId: activity.planId,
        weekNumber: activity.weekNumber,
        date: normalizedDate,
        createdAt: activity.createdAt,
        repsCompleted: activity.repsCompleted || []
      }
    },
    {
      upsert: true,
      returnDocument: 'after'
    }
  );
  
  if (!result) {
    throw new Error('Failed to record exercise activity');
  }
  
  return result;
};

/**
 * Find activity logs for a user with optional filters
 * @param userId - The ID of the user
 * @param filter - Optional additional filters
 * @returns Array of exercise activity logs sorted by date (newest first)
 */
export const findActivityLogsForUser = async (
  userId: ObjectId | string,
  filter: Record<string, unknown> = {}
): Promise<ExerciseActivityLog[]> => {
  const db = await getDb();
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // Combine user filter with additional filters
  const fullFilter = {
    userId: userIdObj,
    ...filter
  };
  
  return db.collection<ExerciseActivityLog>('exerciseActivityLog')
    .find(fullFilter)
    .sort({ date: -1 })
    .toArray();
};

/**
 * Get exercise history for a specific exercise with optional date range filtering
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user
 * @param options - Optional parameters for filtering and limiting results
 * @returns Array of exercise activity logs with date and setsCompleted
 */
export const getExerciseHistory = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<Array<{ date: string; setsCompleted: number }>> => {
  const collection = await getExerciseActivityLogCollection();
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // Build query based on provided parameters
  const query: {
    userId: ObjectId;
    exerciseId: ObjectId;
    date?: {
      $gte?: Date;
      $lte?: Date;
    };
  } = {
    userId: userIdObj,
    exerciseId: exerciseIdObj
  };

  // Add date range filters if provided
  if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) {
      const startDateTime = new Date(options.startDate);
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid start date format. Use YYYY-MM-DD format.");
      }
      query.date.$gte = startDateTime;
    }
    if (options.endDate) {
      const endDateTime = new Date(options.endDate);
      if (isNaN(endDateTime.getTime())) {
        throw new Error("Invalid end date format. Use YYYY-MM-DD format.");
      }
      // Adjust end date to include the entire day
      endDateTime.setHours(23, 59, 59, 999);
      query.date.$lte = endDateTime;
    }
  }

  // Fetch activity logs from the database
  const activityLogs = await collection
    .find(query)
    .sort({ date: -1 }) // Most recent first
    .limit(options.limit || 30)
    .toArray();

  // Format the response
  return activityLogs.map(log => ({
    date: new Date(log.date).toISOString().split('T')[0],
    setsCompleted: log.setsCompleted || 0
  }));
}; 