import { ApiHandlerContext } from '@/apis/types';
import { aiConversations } from '@/server/database/collections';
import type { CreateConversationRequest, CreateConversationResponse, Conversation } from '../types';

export async function createConversation(
  params: CreateConversationRequest,
  context: ApiHandlerContext
): Promise<CreateConversationResponse> {
  try {
    const { userId } = context;

    if (!userId) {
      return { conversation: {} as Conversation, error: 'User not authenticated' };
    }

    const conversation = await aiConversations.createConversation({
      userId,
      planId: params.planId,
      title: params.title,
      initialMessage: params.initialMessage
    });

    // Convert MongoDB ObjectIds to strings for client
    const clientConversation: Conversation = {
      _id: conversation._id.toString(),
      planId: conversation.planId?.toString(),
      title: conversation.title,
      messages: conversation.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp
      })),
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };

    return { conversation: clientConversation };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return {
      conversation: {} as Conversation,
      error: error instanceof Error ? error.message : 'Failed to create conversation'
    };
  }
}

