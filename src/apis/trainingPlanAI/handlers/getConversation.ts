import { ApiHandlerContext } from '@/apis/types';
import { aiConversations } from '@/server/database/collections';
import type { GetConversationRequest, GetConversationResponse, Conversation } from '../types';

export async function getConversation(
  params: GetConversationRequest,
  context: ApiHandlerContext
): Promise<GetConversationResponse> {
  try {
    const { userId } = context;

    if (!userId) {
      return { conversation: null, error: 'User not authenticated' };
    }

    const conversation = await aiConversations.getConversationById(
      params.conversationId,
      userId
    );

    if (!conversation) {
      return { conversation: null };
    }

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
    console.error('Error fetching conversation:', error);
    return {
      conversation: null,
      error: error instanceof Error ? error.message : 'Failed to fetch conversation'
    };
  }
}

