import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { SavedWorkout, SavedWorkoutCreate, SavedWorkoutUpdate, SavedWorkoutFilter } from './types';

/**
 * Get a reference to the savedWorkouts collection
 */
const getSavedWorkoutsCollection = async (): Promise<Collection<SavedWorkout>> => {
  const db = await getDb();
  return db.collection<SavedWorkout>('savedWorkouts');
};

/**
 * Find all saved workouts for a user
 * @param userId - The ID of the user
 * @param filter - Optional additional filters
 * @returns Array of saved workouts
 */
export const findSavedWorkoutsForUser = async (
  userId: ObjectId | string,
  filter?: Omit<SavedWorkoutFilter, 'userId'>
): Promise<SavedWorkout[]> => {
  const collection = await getSavedWorkoutsCollection();
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    userId: userIdObj,
    ...filter
  }).sort({ updatedAt: -1 }).toArray();
};

/**
 * Find a single saved workout by ID
 * @param workoutId - The ID of the saved workout
 * @param userId - The ID of the user (for permission check)
 * @returns The saved workout or null if not found
 */
export const findSavedWorkoutById = async (
  workoutId: ObjectId | string,
  userId: ObjectId | string
): Promise<SavedWorkout | null> => {
  const collection = await getSavedWorkoutsCollection();
  const idObj = typeof workoutId === 'string' ? new ObjectId(workoutId) : workoutId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({
    _id: idObj,
    userId: userIdObj
  });
};

/**
 * Insert a new saved workout
 * @param workout - The saved workout data to insert
 * @returns The inserted saved workout with _id
 */
export const insertSavedWorkout = async (workout: SavedWorkoutCreate): Promise<SavedWorkout> => {
  const collection = await getSavedWorkoutsCollection();
  
  // Ensure each exercise has the required properties
  workout.exercises.forEach((exercise, index) => {
    if (exercise.order === undefined) {
      exercise.order = index + 1;
    }
  });
  
  const result = await collection.insertOne(workout as SavedWorkout);
  
  if (!result.insertedId) {
    throw new Error('Failed to insert saved workout');
  }
  
  return { ...workout, _id: result.insertedId } as SavedWorkout;
};

/**
 * Update an existing saved workout
 * @param workoutId - The ID of the saved workout to update
 * @param userId - The ID of the user (for permission check)
 * @param update - The update data
 * @returns The updated saved workout or null if not found
 */
export const updateSavedWorkout = async (
  workoutId: ObjectId | string,
  userId: ObjectId | string,
  update: SavedWorkoutUpdate
): Promise<SavedWorkout | null> => {
  const collection = await getSavedWorkoutsCollection();
  const idObj = typeof workoutId === 'string' ? new ObjectId(workoutId) : workoutId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // If exercises are being updated, ensure each one has the required properties
  if (update.exercises) {
    update.exercises.forEach((exercise, index) => {
      if (exercise.order === undefined) {
        exercise.order = index + 1;
      }
    });
  }
  
  const result = await collection.findOneAndUpdate(
    { _id: idObj, userId: userIdObj },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  return result || null;
};

/**
 * Delete a saved workout
 * @param workoutId - The ID of the saved workout to delete
 * @param userId - The ID of the user (for permission check)
 * @returns True if the saved workout was deleted, false otherwise
 */
export const deleteSavedWorkout = async (
  workoutId: ObjectId | string,
  userId: ObjectId | string
): Promise<boolean> => {
  const collection = await getSavedWorkoutsCollection();
  const idObj = typeof workoutId === 'string' ? new ObjectId(workoutId) : workoutId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const result = await collection.deleteOne({
    _id: idObj,
    userId: userIdObj
  });
  
  return result.deletedCount === 1;
};

/**
 * Find saved workouts by tags
 * @param userId - The ID of the user
 * @param tags - Array of tags to search for
 * @returns Array of saved workouts matching any of the tags
 */
export const findSavedWorkoutsByTags = async (
  userId: ObjectId | string,
  tags: string[]
): Promise<SavedWorkout[]> => {
  const collection = await getSavedWorkoutsCollection();
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    userId: userIdObj,
    tags: { $in: tags }
  }).sort({ updatedAt: -1 }).toArray();
};

/**
 * Add an exercise to a saved workout
 * @param workoutId - The ID of the saved workout
 * @param userId - The ID of the user (for permission check)
 * @param exerciseId - The ID of the exercise to add
 * @returns The updated saved workout or null if not found
 */
export const addExerciseToSavedWorkout = async (
  workoutId: ObjectId | string,
  userId: ObjectId | string,
  exerciseId: ObjectId | string
): Promise<SavedWorkout | null> => {
  const collection = await getSavedWorkoutsCollection();
  const workoutIdObj = typeof workoutId === 'string' ? new ObjectId(workoutId) : workoutId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;

  // First, find the workout to check permissions and get current exercises
  const workout = await findSavedWorkoutById(workoutIdObj, userIdObj);
  if (!workout) {
    return null;
  }

  // Check if the exercise is already in the workout
  const exerciseExists = workout.exercises.some(exercise => 
    exercise.exerciseId.equals(exerciseIdObj)
  );

  // If exercise already exists, return the workout unchanged
  if (exerciseExists) {
    return workout;
  }

  // Determine the next order number
  const nextOrder = workout.exercises.length > 0 ? 
    Math.max(...workout.exercises.map(e => e.order)) + 1 : 1;

  // Add the exercise to the workout
  const result = await collection.findOneAndUpdate(
    { _id: workoutIdObj, userId: userIdObj },
    { 
      $push: { 
        exercises: { 
          exerciseId: exerciseIdObj,
          order: nextOrder 
        } 
      } 
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
}; 