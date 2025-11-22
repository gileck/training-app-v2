import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { AIActionHistory, AIActionHistoryCreate, AIActionHistoryUpdate } from './types';

/**
 * Get a reference to the aiActionHistory collection
 */
const getAIActionHistoryCollection = async (): Promise<Collection<AIActionHistory>> => {
  const db = await getDb();
  return db.collection<AIActionHistory>('aiActionHistory');
};

/**
 * Create a new AI action history entry
 */
export const createActionHistory = async (
  data: AIActionHistoryCreate
): Promise<AIActionHistory> => {
  const collection = await getAIActionHistoryCollection();
  
  const now = new Date();
  const document: Omit<AIActionHistory, '_id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document as AIActionHistory);
  
  return {
    _id: result.insertedId,
    ...document,
  } as AIActionHistory;
};

/**
 * Find an action history entry by ID
 */
export const findActionHistoryById = async (
  actionId: string,
  userId: ObjectId
): Promise<AIActionHistory | null> => {
  const collection = await getAIActionHistoryCollection();
  
  return collection.findOne({
    _id: new ObjectId(actionId),
    userId: userId,
  });
};

/**
 * Update an action history entry
 */
export const updateActionHistory = async (
  actionId: string,
  userId: ObjectId,
  updates: AIActionHistoryUpdate
): Promise<AIActionHistory | null> => {
  const collection = await getAIActionHistoryCollection();
  
  const updateDoc = {
    ...updates,
    updatedAt: new Date(),
  };

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(actionId), userId: userId },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );

  return result || null;
};

/**
 * Get all action history entries for a specific plan
 */
export const getActionHistoryForPlan = async (
  planId: string,
  userId: ObjectId,
  limit: number = 100
): Promise<AIActionHistory[]> => {
  const collection = await getAIActionHistoryCollection();
  
  return collection
    .find({ planId: new ObjectId(planId), userId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

/**
 * Get all action history entries for a user (across all plans)
 */
export const getActionHistoryForUser = async (
  userId: ObjectId,
  limit: number = 100
): Promise<AIActionHistory[]> => {
  const collection = await getAIActionHistoryCollection();
  
  return collection
    .find({ userId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

/**
 * Delete action history entries for a specific plan
 */
export const deleteActionHistoryForPlan = async (
  planId: string,
  userId: ObjectId
): Promise<number> => {
  const collection = await getAIActionHistoryCollection();
  
  const result = await collection.deleteMany({
    planId: new ObjectId(planId),
    userId: userId,
  });

  return result.deletedCount;
};

/**
 * Get pending actions for a plan
 */
export const getPendingActionsForPlan = async (
  planId: string,
  userId: ObjectId
): Promise<AIActionHistory[]> => {
  const collection = await getAIActionHistoryCollection();
  
  return collection
    .find({ 
      planId: new ObjectId(planId), 
      userId: userId,
      status: 'pending'
    })
    .sort({ createdAt: -1 })
    .toArray();
};

