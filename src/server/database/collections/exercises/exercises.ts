import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { Exercise, ExerciseCreate, ExerciseUpdate } from './types';

/**
 * Get a reference to the exercises collection
 */
export const getExercisesCollection = async (): Promise<Collection<Exercise>> => {
  const db = await getDb();
  return db.collection<Exercise>('exercises');
};

/**
 * Find exercises for a specific plan
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user
 * @returns Array of exercises
 */
export const findExercisesForPlan = async (
  planId: ObjectId | string, 
  userId: ObjectId | string
): Promise<Exercise[]> => {
  const collection = await getExercisesCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    planId: planIdObj,
    userId: userIdObj
  }).sort({ orderInPlan: 1 }).toArray();
};

/**
 * Find a single exercise by ID
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user (for permission check)
 * @returns The exercise document or null if not found
 */
export const findExerciseById = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string
): Promise<Exercise | null> => {
  const collection = await getExercisesCollection();
  const idObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({ _id: idObj, userId: userIdObj });
};

/**
 * Insert a new exercise
 * @param exercise - The exercise data to insert
 * @returns The inserted exercise with _id
 */
export const insertExercise = async (exercise: ExerciseCreate): Promise<Exercise> => {
  const collection = await getExercisesCollection();
  const result = await collection.insertOne(exercise as Exercise);
  
  if (!result.insertedId) {
    throw new Error('Failed to insert exercise');
  }
  
  return { ...exercise, _id: result.insertedId } as Exercise;
};

/**
 * Update an existing exercise
 * @param exerciseId - The ID of the exercise to update
 * @param userId - The ID of the user (for permission check)
 * @param planId - The ID of the plan (for permission check)
 * @param update - The update data
 * @returns The updated exercise or null if not found
 */
export const updateExercise = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  planId: ObjectId | string,
  update: ExerciseUpdate
): Promise<Exercise | null> => {
  const collection = await getExercisesCollection();
  const idObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  
  const result = await collection.findOneAndUpdate(
    { _id: idObj, userId: userIdObj, planId: planIdObj },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  return result || null;
};

/**
 * Delete an exercise
 * @param exerciseId - The ID of the exercise to delete
 * @param userId - The ID of the user (for permission check)
 * @param planId - The ID of the plan (for permission check)
 * @returns True if the exercise was deleted, false otherwise
 */
export const deleteExercise = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  planId: ObjectId | string
): Promise<boolean> => {
  const collection = await getExercisesCollection();
  const idObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  
  const result = await collection.deleteOne({
    _id: idObj,
    userId: userIdObj,
    planId: planIdObj
  });
  
  return result.deletedCount === 1;
};

/**
 * Check if an exercise exists and belongs to the user and plan
 * @param exerciseId - The ID of the exercise
 * @param userId - The ID of the user
 * @param planId - The ID of the plan
 * @returns True if the exercise exists and belongs to the user and plan, false otherwise
 */
export const exerciseExists = async (
  exerciseId: ObjectId | string,
  userId: ObjectId | string,
  planId: ObjectId | string
): Promise<boolean> => {
  const collection = await getExercisesCollection();
  const idObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  
  const count = await collection.countDocuments({
    _id: idObj,
    userId: userIdObj,
    planId: planIdObj
  });
  
  return count === 1;
};

/**
 * Get the next order value for an exercise in a plan
 * @param planId - The ID of the plan
 * @param userId - The ID of the user
 * @returns The next order value
 */
export const getNextExerciseOrder = async (
  planId: ObjectId | string,
  userId: ObjectId | string
): Promise<number> => {
  const collection = await getExercisesCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  const lastExercise = await collection.findOne(
    { planId: planIdObj, userId: userIdObj },
    { sort: { orderInPlan: -1 }, projection: { orderInPlan: 1 } }
  );
  
  return (lastExercise?.orderInPlan || 0) + 1;
}; 