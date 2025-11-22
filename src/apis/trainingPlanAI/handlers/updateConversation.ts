import { ApiHandlerContext } from '@/apis/types';
import { aiConversations } from '@/server/database/collections';
import type { UpdateConversationRequest, UpdateConversationResponse, Conversation } from '../types';

export async function updateConversation(
  params: UpdateConversationRequest,
  context: ApiHandlerContext
): Promise<UpdateConversationResponse> {
  try {
    const { userId } = context;

    if (!userId) {
      return { conversation: null, success: false, error: 'User not authenticated' };
    }

    const conversation = await aiConversations.updateConversation({
      conversationId: params.conversationId,
      userId,
      title: params.title,
      status: params.status
    });

    if (!conversation) {
      return { conversation: null, success: false, error: 'Conversation not found' };
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

    return { conversation: clientConversation, success: true };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return {
      conversation: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update conversation'
    };
  }
}

