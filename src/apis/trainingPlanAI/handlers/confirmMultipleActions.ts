import { ApiHandlerContext } from '@/apis/types';
import type {
  ConfirmMultipleActionsRequest,
  ConfirmMultipleActionsResponse,
} from '../types';
import { confirmAction } from './confirmAction';

/**
 * Confirm and execute multiple actions in parallel with proper error aggregation
 */
export async function confirmMultipleActions(
  params: ConfirmMultipleActionsRequest,
  context: ApiHandlerContext
): Promise<ConfirmMultipleActionsResponse> {
  const { actionIds } = params;

  if (!actionIds || actionIds.length === 0) {
    return {
      results: [],
      successCount: 0,
      failureCount: 0,
      errors: []
    };
  }

  // Execute all actions in parallel
  const promises = actionIds.map(actionId =>
    confirmAction({ actionId }, context)
      .then(result => ({
        actionId,
        result: {
          success: result.success,
          action: result.action,
          message: result.message,
          error: result.error
        },
        success: result.success
      }))
      .catch((error: Error) => ({
        actionId,
        result: {
          success: false,
          action: {} as never,
          error: error.message || 'Unknown error'
        },
        success: false
      }))
  );

  const results = await Promise.all(promises);

  // Aggregate results
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  const errors = results
    .filter(r => !r.success)
    .map(r => ({
      actionId: r.actionId,
      error: r.result.error || 'Unknown error'
    }));

  return {
    results: results.map(r => r.result),
    successCount,
    failureCount,
    errors
  };
}

