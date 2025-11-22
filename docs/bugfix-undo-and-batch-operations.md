# Bug Fixes: AI Training Plan Assistant Undo and Batch Operations

## Bug #1: Undo Functionality for Creation Actions

### Problem
The undo handler was rejecting any action where `originalState` is falsy (line 35-40 of `handlers/undoAction.ts`). However, for creation actions like `addExercise`, `createWorkout`, `createPlan`, and `createCustomExercise`, the `originalState` is intentionally `undefined` because there is nothing to capture before creation.

Additionally, the `undoActionExecution` function attempted to read IDs from `originalState` for these creation actions, but these should come from `resultData` instead.

### Root Cause
- Creation actions have no previous state (`originalState` = `undefined`)
- The undo handler blocked undo for any action without `originalState`
- The undo execution function incorrectly tried to use `originalState` for creation actions
- IDs needed for deletion (undo of creation) were stored in `resultData`, not `originalState`

### Solution

**File**: `src/apis/trainingPlanAI/handlers/undoAction.ts`

Changed the validation logic to distinguish between creation and update/delete actions:

```typescript
// For creation actions, we use resultData to know what was created
const creationActions: ActionType[] = ['createPlan', 'addExercise', 'createWorkout', 'createCustomExercise'];
const isCreationAction = creationActions.includes(action.actionType);

if (!isCreationAction && !action.originalState) {
  return { success: false, error: 'No undo information available' };
}

if (isCreationAction && !action.resultData) {
  return { success: false, error: 'No result data available for undo' };
}

// Pass both originalState and resultData to undo execution
const undoResult = await undoActionExecution(
  action.actionType,
  action.originalState || {},
  action.resultData || {},
  context
);
```

**File**: `src/apis/trainingPlanAI/actions/undoAction.ts`

Updated function signature and implementation to accept and use `resultData`:

```typescript
export async function undoActionExecution(
  actionType: ActionType,
  originalState: Record<string, unknown>,
  resultData: Record<string, unknown>,  // NEW parameter
  context: ApiHandlerContext
): Promise<{ success: boolean; error?: string }>
```

Updated all creation action cases to use `resultData`:

```typescript
case 'createPlan': {
  // Use resultData instead of originalState
  const planId = resultData.planId as string;
  if (planId) {
    await trainingPlansServer.deleteTrainingPlan({ planId }, context);
  }
  return { success: true };
}

case 'createCustomExercise': {
  // Use resultData for the created definition ID
  const definitionId = resultData.definitionId as string | undefined;
  if (definitionId) {
    await exerciseDefinitions.deleteExerciseDefinition(definitionId);
  }
  return { success: true };
}

case 'addExercise': {
  // Use resultData for the created exercise ID
  const exerciseId = resultData.exerciseId as string | undefined;
  const trainingPlanId = resultData.trainingPlanId as string | undefined;
  if (exerciseId && trainingPlanId) {
    await exercisesServer.deleteExerciseFromPlan({ exerciseId, trainingPlanId }, context);
  }
  return { success: true };
}

case 'createWorkout': {
  // Use resultData for the created workout ID
  const workoutId = resultData.workoutId as string | undefined;
  if (workoutId) {
    await savedWorkoutsServer.deleteSavedWorkout({ workoutId }, context);
  }
  return { success: true };
}
```

### Result
✅ Creation actions (`addExercise`, `createWorkout`, `createPlan`, `createCustomExercise`) can now be undone  
✅ Undo correctly deletes the created entities using IDs from `resultData`  
✅ Update/delete actions still use `originalState` as before  

---

## Bug #2: Race Condition in "Approve All" Batch Operations

### Problem
The `handleApproveAll` function in `AIChatPanel` called `onConfirmAction` for multiple actions in a `forEach` loop without awaiting them. Each concurrent `confirmAction` call independently managed the `isProcessing` state, setting it to `true` when starting and `false` when completing. This created a race condition where `isProcessing` became `false` as soon as the first action completed, even though other actions were still processing.

### Root Cause
- `forEach` loop triggered multiple async operations without coordination
- Each `confirmAction` call independently set `isProcessing = false` when done
- First completed action would set `isProcessing = false` globally
- Remaining actions continued in background while UI thought processing was done
- User could submit duplicate requests or interfere with pending operations

### Solution

**Created**: `src/apis/trainingPlanAI/handlers/confirmMultipleActions.ts`

New handler that executes actions in parallel using `Promise.all` with proper error aggregation:

```typescript
export async function confirmMultipleActions(
  params: ConfirmMultipleActionsRequest,
  context: ApiHandlerContext
): Promise<ConfirmMultipleActionsResponse> {
  const { actionIds } = params;

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
```

**Updated**: `src/client/routes/ManageTrainingPlanPage/hooks/useAIAssistant.ts`

Added `confirmMultipleActions` method that properly manages `isProcessing` state for batch operations:

```typescript
const confirmMultipleActions = useCallback(
  async (actionIds: string[]) => {
    if (actionIds.length === 0) return;

    setIsProcessing(true);  // Set once at start
    setError(null);

    try {
      const result = await trainingPlanAI.confirmMultipleActions({ actionIds });

      if (!result.data) {
        setError('Failed to confirm actions');
        return;
      }

      // Update all actions in history and messages
      if (result.data.results && result.data.results.length > 0) {
        result.data.results.forEach((actionResult) => {
          if (actionResult.success && actionResult.action) {
            // Update action in history
            setActionHistory((prev) =>
              prev.map((a) => (a._id === actionResult.action._id ? actionResult.action : a))
            );

            // Update action in messages
            setMessages((prev) =>
              prev.map((msg) => ({
                ...msg,
                actions: msg.actions?.map((a) =>
                  a._id === actionResult.action._id ? actionResult.action : a
                ),
              }))
            );
          }
        });

        // Trigger data refresh once after all actions
        onActionExecuted?.();

        // Add system message with summary
        const successCount = result.data.successCount;
        const failureCount = result.data.failureCount;
        let summaryMessage = '';
        
        if (failureCount === 0) {
          summaryMessage = `Successfully executed all ${successCount} actions`;
        } else {
          summaryMessage = `Executed ${successCount} actions successfully. ${failureCount} failed.`;
          if (result.data.errors && result.data.errors.length > 0) {
            const errorDetails = result.data.errors.map(e => `- ${e.error}`).join('\n');
            summaryMessage += `\n\nErrors:\n${errorDetails}`;
          }
        }

        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          role: 'system',
          content: summaryMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);

        if (failureCount > 0) {
          setError(`${failureCount} action(s) failed to execute`);
        }
      }
    } catch (err) {
      console.error('Error confirming multiple actions:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm actions');
    } finally {
      setIsProcessing(false);  // Set once at end
    }
  },
  [onActionExecuted]
);
```

**Updated**: `src/client/routes/ManageTrainingPlanPage/components/AIChatPanel.tsx`

Changed `handleApproveAll` to use the new batch API:

```typescript
const handleApproveAll = useCallback(() => {
  const pendingActions = messages
    .flatMap(msg => msg.actions || [])
    .filter(action => action.status === 'pending');
  
  if (pendingActions.length > 0) {
    // Use the batch API to confirm all actions in parallel with proper state management
    onConfirmMultipleActions(pendingActions.map(action => action._id));
  }
}, [messages, onConfirmMultipleActions]);
```

### Result
✅ "Approve All" executes actions in parallel using `Promise.all`  
✅ `isProcessing` state correctly managed for the entire batch operation  
✅ Comprehensive error aggregation (success count, failure count, error details)  
✅ User gets clear feedback with summary message  
✅ No race conditions - UI locked during batch execution  
✅ Data refresh happens once after all actions complete  

---

## Testing

### Bug #1 Testing
1. Create an action that adds an exercise: `addExercise`
2. Confirm the action
3. Click "Undo" button
4. **Expected**: Exercise is deleted successfully
5. **Before Fix**: Error "No undo information available"
6. **After Fix**: ✅ Exercise deleted successfully

### Bug #2 Testing
1. Ask AI to create multiple actions (e.g., "Add bench press, squats, and deadlifts")
2. Click "Approve All" button
3. Quickly try to send another message or click another button
4. **Before Fix**: Second interaction works while first is still processing (race condition)
5. **After Fix**: ✅ UI properly disabled until all actions complete

---

## Files Modified

1. `src/apis/trainingPlanAI/handlers/undoAction.ts`
2. `src/apis/trainingPlanAI/actions/undoAction.ts`
3. `src/apis/trainingPlanAI/handlers/confirmMultipleActions.ts` (NEW)
4. `src/apis/trainingPlanAI/types.ts`
5. `src/apis/trainingPlanAI/index.ts`
6. `src/apis/trainingPlanAI/server.ts`
7. `src/apis/trainingPlanAI/client.ts`
8. `src/apis/apis.ts`
9. `src/client/routes/ManageTrainingPlanPage/hooks/useAIAssistant.ts`
10. `src/client/routes/ManageTrainingPlanPage/components/AIChatPanel.tsx`
11. `src/client/routes/ManageTrainingPlanPage/ManageTrainingPlanPage.tsx`
12. `src/client/routes/TrainingPlans/TrainingPlans.tsx`

---

## All Checks Pass

```bash
$ yarn checks
✔ TypeScript compilation: 0 errors
✔ ESLint: 0 warnings or errors
```

