import { Collection, Db, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import type {
  AIConversation,
  CreateConversationParams,
  UpdateConversationParams,
  AddMessageParams,
  GetConversationsParams
} from './types';

const COLLECTION_NAME = 'aiConversations';

async function getCollection(): Promise<Collection<AIConversation>> {
  const db: Db = await getDb();
  return db.collection<AIConversation>(COLLECTION_NAME);
}

/**
 * Create a new conversation
 */
export async function createConversation(params: CreateConversationParams): Promise<AIConversation> {
  const collection = await getCollection();
  
  const now = new Date();
  const conversation: Omit<AIConversation, '_id'> = {
    userId: new ObjectId(params.userId),
    planId: params.planId ? new ObjectId(params.planId) : undefined,
    title: params.title || 'New Conversation',
    messages: params.initialMessage ? [{
      id: new ObjectId().toString(),
      role: 'user',
      content: params.initialMessage,
      timestamp: now
    }] : [],
    status: 'active',
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now
  };

  const result = await collection.insertOne(conversation as AIConversation);
  return {
    ...conversation,
    _id: result.insertedId
  } as AIConversation;
}

/**
 * Get a specific conversation by ID
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<AIConversation | null> {
  const collection = await getCollection();
  
  return await collection.findOne({
    _id: new ObjectId(conversationId),
    userId: new ObjectId(userId)
  });
}

/**
 * Get all conversations for a user (optionally filtered by planId and status)
 */
export async function getConversations(params: GetConversationsParams): Promise<AIConversation[]> {
  const collection = await getCollection();
  
  const query: Record<string, unknown> = {
    userId: new ObjectId(params.userId)
  };
  
  if (params.planId) {
    query.planId = new ObjectId(params.planId);
  }
  
  if (params.status) {
    query.status = params.status;
  }
  
  const limit = params.limit || 50;
  
  return await collection
    .find(query)
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(params: AddMessageParams): Promise<AIConversation | null> {
  const collection = await getCollection();
  
  const now = new Date();
  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(params.conversationId),
      userId: new ObjectId(params.userId)
    },
    {
      $push: { messages: params.message },
      $set: {
        lastMessageAt: now,
        updatedAt: now
      }
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

/**
 * Update conversation metadata (title, status)
 */
export async function updateConversation(params: UpdateConversationParams): Promise<AIConversation | null> {
  const collection = await getCollection();
  
  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  };
  
  if (params.title !== undefined) {
    updates.title = params.title;
  }
  
  if (params.status !== undefined) {
    updates.status = params.status;
  }
  
  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(params.conversationId),
      userId: new ObjectId(params.userId)
    },
    { $set: updates },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const collection = await getCollection();
  
  const result = await collection.deleteOne({
    _id: new ObjectId(conversationId),
    userId: new ObjectId(userId)
  });
  
  return result.deletedCount > 0;
}

/**
 * Archive a conversation (soft delete)
 */
export async function archiveConversation(
  conversationId: string,
  userId: string
): Promise<AIConversation | null> {
  return await updateConversation({
    conversationId,
    userId,
    status: 'archived'
  });
}

/**
 * Get the most recent active conversation for a plan
 */
export async function getMostRecentConversation(
  userId: string,
  planId?: string
): Promise<AIConversation | null> {
  const conversations = await getConversations({
    userId,
    planId,
    status: 'active',
    limit: 1
  });
  
  return conversations.length > 0 ? conversations[0] : null;
}

