import { Collection, ObjectId } from 'mongodb';
import { getDb, getMongoClient } from '@/server/database';
import { 
  TrainingPlan, 
  TrainingPlanCreate, 
  TrainingPlanUpdate, 
  TrainingPlanFilter 
} from './types';

/**
 * Get a reference to the trainingPlans collection
 */
const getTrainingPlansCollection = async (): Promise<Collection<TrainingPlan>> => {
  const db = await getDb();
  return db.collection<TrainingPlan>('trainingPlans');
};

/**
 * Find all training plans for a user
 * @param userId - The ID of the user
 * @param filter - Optional additional filters
 * @returns Array of training plans
 */
export const findTrainingPlansForUser = async (
  userId: ObjectId | string,
  filter?: Omit<TrainingPlanFilter, 'userId'>
): Promise<TrainingPlan[]> => {
  const collection = await getTrainingPlansCollection();
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    userId: userIdObj,
    ...filter
  }).sort({ createdAt: -1 }).toArray();
};

/**
 * Find a single training plan by ID
 * @param planId - The ID of the training plan
 * @param userId - The ID of the user (for permission check)
 * @returns The training plan or null if not found
 */
export const findTrainingPlanById = async (
  planId: ObjectId | string,
  userId: ObjectId | string
): Promise<TrainingPlan | null> => {
  const collection = await getTrainingPlansCollection();
  const idObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({ _id: idObj, userId: userIdObj });
};

/**
 * Find the active training plan for a user
 * @param userId - The ID of the user
 * @returns The active training plan or null if not found
 */
export const findActiveTrainingPlan = async (
  userId: ObjectId | string
): Promise<TrainingPlan | null> => {
  const collection = await getTrainingPlansCollection();
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.findOne({ userId: userIdObj, isActive: true });
};

/**
 * Insert a new training plan
 * @param plan - The training plan data to insert
 * @returns The inserted training plan with _id
 */
export const insertTrainingPlan = async (plan: TrainingPlanCreate): Promise<TrainingPlan> => {
  const collection = await getTrainingPlansCollection();
  
  // If this plan is active, ensure no other active plans for this user
  if (plan.isActive) {
    await collection.updateMany(
      { userId: plan.userId, isActive: true },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }
  
  const result = await collection.insertOne(plan as TrainingPlan);
  
  if (!result.insertedId) {
    throw new Error('Failed to insert training plan');
  }
  
  return { ...plan, _id: result.insertedId } as TrainingPlan;
};

/**
 * Update an existing training plan
 * @param planId - The ID of the plan to update
 * @param userId - The ID of the user (for permission check)
 * @param update - The update data
 * @returns The updated training plan or null if not found
 */
export const updateTrainingPlan = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  update: TrainingPlanUpdate
): Promise<TrainingPlan | null> => {
  const collection = await getTrainingPlansCollection();
  const idObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // If updating to active, ensure no other active plans for this user
  if (update.isActive) {
    await collection.updateMany(
      { userId: userIdObj, isActive: true, _id: { $ne: idObj } },
      { $set: { isActive: false, updatedAt: update.updatedAt } }
    );
  }
  
  const result = await collection.findOneAndUpdate(
    { _id: idObj, userId: userIdObj },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  return result || null;
};

/**
 * Set a training plan as active
 * @param planId - The ID of the plan to set as active
 * @param userId - The ID of the user (for permission check)
 * @returns The updated training plan or null if not found
 */
export const setTrainingPlanActive = async (
  planId: ObjectId | string,
  userId: ObjectId | string
): Promise<TrainingPlan | null> => {
  const db = await getDb();
  const idObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const now = new Date();
  
  // Use a session to ensure atomicity
  const client = await getMongoClient();
  const session = client.startSession();
  
  try {
    let updatedPlan: TrainingPlan | null = null;
    
    await session.withTransaction(async () => {
      const collection = db.collection<TrainingPlan>('trainingPlans');
      
      // First verify the plan exists and belongs to the user
      const plan = await collection.findOne(
        { _id: idObj, userId: userIdObj },
        { session }
      );
      
      if (!plan) {
        throw new Error('Training plan not found or access denied');
      }
      
      // Deactivate all other plans for this user
      await collection.updateMany(
        { userId: userIdObj, isActive: true, _id: { $ne: idObj } },
        { $set: { isActive: false, updatedAt: now } },
        { session }
      );
      
      // Set the specified plan as active
      const result = await collection.findOneAndUpdate(
        { _id: idObj, userId: userIdObj },
        { $set: { isActive: true, updatedAt: now } },
        { returnDocument: 'after', session }
      );
      
      updatedPlan = result;
    });
    
    return updatedPlan;
  } finally {
    await session.endSession();
  }
};

/**
 * Delete a training plan (and associated data - exercises and weekly progress)
 * @param planId - The ID of the plan to delete
 * @param userId - The ID of the user (for permission check)
 * @returns True if the plan was deleted, false otherwise
 */
export const deleteTrainingPlan = async (
  planId: ObjectId | string,
  userId: ObjectId | string
): Promise<boolean> => {
  const idObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // Use a session to ensure all related collections are cleaned up
  const client = await getMongoClient();
  const session = client.startSession();
  let deleted = false;
  
  try {
    await session.withTransaction(async () => {
      const db = client.db();
      
      // 1. Verify ownership & existence of the plan itself
      const plan = await db.collection('trainingPlans').findOne(
        { _id: idObj, userId: userIdObj }, 
        { session }
      );
      
      if (!plan) {
        throw new Error('Training plan not found or access denied');
      }
      
      // 2. Get exerciseIds BEFORE deleting exercises
      const exerciseIds = await db.collection('exercises')
        .find({ planId: idObj }, { projection: { _id: 1 }, session })
        .map(ex => ex._id)
        .toArray();
      
      // 3. Delete associated Exercises
      await db.collection('exercises').deleteMany(
        { planId: idObj }, 
        { session }
      );
      
      // 4. Delete associated Weekly Progress
      await db.collection('weeklyProgress').deleteMany(
        { planId: idObj, userId: userIdObj }, 
        { session }
      );
      
      // 5. Delete associated Daily Logs
      if (exerciseIds.length > 0) {
        await db.collection('exerciseActivityLog').deleteMany(
          { exerciseId: { $in: exerciseIds }, userId: userIdObj }, 
          { session }
        );
      }
      
      // 6. Delete the Training Plan itself
      const deleteResult = await db.collection('trainingPlans').deleteOne(
        { _id: idObj, userId: userIdObj }, 
        { session }
      );
      
      deleted = deleteResult.deletedCount === 1;
    });
    
    return deleted;
  } catch (error) {
    console.error('Error deleting training plan:', error);
    return false;
  } finally {
    await session.endSession();
  }
};

/**
 * Duplicate a training plan
 * @param planId - The ID of the plan to duplicate
 * @param userId - The ID of the user (for permission check) 
 * @param newName - The name for the duplicated plan
 * @returns The newly created training plan or null if source plan not found
 */
export const duplicateTrainingPlan = async (
  planId: ObjectId | string,
  userId: ObjectId | string,
  newName: string
): Promise<TrainingPlan | null> => {
  const idObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  // Use a session to ensure all related collections are duplicated
  const client = await getMongoClient();
  const session = client.startSession();
  let newPlan: TrainingPlan | null = null;
  
  try {
    await session.withTransaction(async () => {
      const db = client.db();
      
      // 1. Find the source plan
      const sourcePlan = await db.collection<TrainingPlan>('trainingPlans').findOne(
        { _id: idObj, userId: userIdObj }, 
        { session }
      );
      
      if (!sourcePlan) {
        throw new Error('Source training plan not found or access denied');
      }
      
      // 2. Create a new plan
      const now = new Date();
      const newPlanDoc: TrainingPlanCreate = {
        userId: userIdObj,
        name: newName,
        durationWeeks: sourcePlan.durationWeeks,
        isActive: false, // Never set a duplicated plan as active
        createdAt: now,
        updatedAt: now
      };
      
      const insertResult = await db.collection<TrainingPlan>('trainingPlans').insertOne(
        newPlanDoc as TrainingPlan, 
        { session }
      );
      
      const newPlanId = insertResult.insertedId;
      newPlan = { ...newPlanDoc, _id: newPlanId } as TrainingPlan;
      
      // 3. Find all exercises from the source plan
      const exercises = await db.collection('exercises')
        .find({ planId: idObj, userId: userIdObj }, { session })
        .toArray();
      
      // 4. Duplicate each exercise to the new plan
      if (exercises.length > 0) {
        const newExercises = exercises.map(ex => ({
          ...ex,
          _id: new ObjectId(), // Generate new ID
          planId: newPlanId, // Reference new plan
          createdAt: now,
          updatedAt: now
        }));
        
        if (newExercises.length > 0) {
          await db.collection('exercises').insertMany(newExercises, { session });
        }
      }
    });
    
    return newPlan;
  } catch (error) {
    console.error('Error duplicating training plan:', error);
    return null;
  } finally {
    await session.endSession();
  }
}; 