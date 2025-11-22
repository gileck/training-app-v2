import { ApiHandlerContext } from '@/apis/types';
import { aiConversations } from '@/server/database/collections';
import type { ListConversationsRequest, ListConversationsResponse, Conversation } from '../types';

export async function listConversations(
  params: ListConversationsRequest,
  context: ApiHandlerContext
): Promise<ListConversationsResponse> {
  try {
    const { userId } = context;

    if (!userId) {
      return { conversations: [], error: 'User not authenticated' };
    }

    const conversations = await aiConversations.getConversations({
      userId,
      planId: params.planId,
      status: params.status,
      limit: params.limit
    });

    // Convert MongoDB ObjectIds to strings for client
    const clientConversations: Conversation[] = conversations.map(conv => ({
      _id: conv._id.toString(),
      planId: conv.planId?.toString(),
      title: conv.title,
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp
      })),
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    return { conversations: clientConversations };
  } catch (error) {
    console.error('Error listing conversations:', error);
    return {
      conversations: [],
      error: error instanceof Error ? error.message : 'Failed to list conversations'
    };
  }
}

