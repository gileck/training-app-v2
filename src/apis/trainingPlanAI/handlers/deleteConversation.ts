import { ApiHandlerContext } from '@/apis/types';
import { aiConversations } from '@/server/database/collections';
import type { DeleteConversationRequest, DeleteConversationResponse } from '../types';

export async function deleteConversation(
  params: DeleteConversationRequest,
  context: ApiHandlerContext
): Promise<DeleteConversationResponse> {
  try {
    const { userId } = context;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const success = await aiConversations.deleteConversation(
      params.conversationId,
      userId
    );

    return { success };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation'
    };
  }
}

