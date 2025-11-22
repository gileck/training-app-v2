import { ObjectId } from 'mongodb';

export interface AIConversation {
  _id: ObjectId;
  userId: ObjectId;
  planId?: ObjectId; // Optional - conversations can be plan-specific or general
  title: string; // Auto-generated from first message or user-defined
  messages: ConversationMessage[];
  status: 'active' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionIds?: string[]; // References to aiActionHistory._id
  timestamp: Date;
}

export interface CreateConversationParams {
  userId: string;
  planId?: string;
  title?: string;
  initialMessage?: string;
}

export interface UpdateConversationParams {
  conversationId: string;
  userId: string;
  title?: string;
  status?: 'active' | 'archived';
}

export interface AddMessageParams {
  conversationId: string;
  userId: string;
  message: ConversationMessage;
}

export interface GetConversationsParams {
  userId: string;
  planId?: string;
  status?: 'active' | 'archived';
  limit?: number;
}

