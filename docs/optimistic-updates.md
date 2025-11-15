# Optimistic Updates and Race Condition Prevention

## Overview

This document explains how the application handles optimistic updates for exercise set completion and how race conditions are prevented when users interact rapidly with the UI.

## The Problem: Race Conditions in Optimistic Updates

When users click buttons rapidly (e.g., incrementing sets multiple times quickly), traditional optimistic update patterns can create race conditions:

### Traditional Approach (Problematic)

```
Timeline:
T0: User clicks + (0→1)
    - UI updates to 1 (optimistic)
    - API call #1 sent (increment from 0 to 1)

T1: User clicks + again (1→2)
    - UI updates to 2 (optimistic)
    - API call #2 sent (increment from 1 to 2)

T2: API call #1 responds (setsCompleted: 1)
    - ❌ UI updates to 1 (overwriting the correct value of 2)

T3: API call #2 responds (setsCompleted: 2)
    - UI updates back to 2

Result: Flickering UI, temporary incorrect state between T2 and T3
```

## Our Solution: Trust the Optimistic Update

We use a **"trust the optimistic update"** approach where the client-side calculation is the source of truth, and server responses are only used for error handling.

### Implementation Pattern

```typescript
const updateSetCompletion = async (exerciseId, increment) => {
    // 1. Calculate new state locally
    const newState = calculateNewState(currentState, increment);
    
    // 2. Apply optimistic update immediately
    setState(newState);
    
    // 3. Save to localStorage for persistence
    saveToLocalStorage(newState);
    
    // 4. Sync with server (background)
    apiCall(newState)
        .then(response => {
            if (response.success) {
                // ✅ Do nothing - our optimistic update is correct
            } else {
                // ❌ Rollback to original state
                setState(originalState);
                showError();
            }
        })
        .catch(error => {
            // ❌ Rollback on network error
            setState(originalState);
            showError();
        });
};
```

### How This Prevents Race Conditions

```
Timeline:
T0: User clicks + (0→1)
    - UI updates to 1 (optimistic)
    - Saved to localStorage
    - API call #1 sent

T1: User clicks + again (1→2)
    - UI updates to 2 (optimistic)
    - Saved to localStorage
    - API call #2 sent

T2: API call #1 responds (success)
    - ✅ Do nothing (state is already correct at 2)

T3: API call #2 responds (success)
    - ✅ Do nothing (state is already correct at 2)

Result: Smooth UI, always correct state, no flickering
```

## Key Principles

### 1. Client is Source of Truth
- The client calculates the correct state immediately
- This state is applied right away and persisted to localStorage
- The server's role is to sync and validate, not to provide the state

### 2. Server Responses for Error Handling Only
- **On Success**: Do nothing (optimistic update is already applied)
- **On Error**: Rollback to original state and notify user
- Never overwrite state with successful server responses

### 3. Immediate Feedback + Persistence
- User sees changes instantly (optimistic update)
- Changes are saved to localStorage immediately
- Even if the app crashes before server sync, changes are persisted locally

## Implementation Details

### Location
- **File**: `src/client/context/TrainingPlanData/hooks/useWeeklyProgressHooks.ts`
- **Function**: `updateSetCompletion`

### Flow

1. **Store Original State**
   ```typescript
   const originalWeekProgress = [...currentWeekProgress];
   ```

2. **Calculate New State**
   ```typescript
   const newSetsCompleted = Math.max(0, Math.min(totalSets, currentSets + increment));
   ```

3. **Apply Optimistic Update**
   ```typescript
   updateState({ planData: newStateAfterOptimistic.planData });
   ```

4. **Persist to localStorage**
   ```typescript
   saveToLocalStorage(newStateAfterOptimistic);
   ```

5. **Background Server Sync**
   ```typescript
   apiUpdateSetCompletion(...).then(response => {
       if (!response.data?.success) {
           // Rollback only on error
           setState(originalState);
           showNotification('Could not save progress', 'error');
       }
       // On success: do nothing!
   });
   ```

## Benefits

### 1. No Race Conditions
Multiple rapid clicks work correctly regardless of server response order.

### 2. Instant UI Updates
Users see immediate feedback with no delays or waiting for server responses.

### 3. Offline Support
Changes are persisted to localStorage immediately, so they survive page refreshes even before server sync completes.

### 4. Simplified State Management
No need to track request IDs, timestamps, or pending request queues. The logic is much simpler.

### 5. Better User Experience
- No flickering or jumping UI
- Consistent state across rapid interactions
- Clear error handling when sync fails

## Edge Cases Handled

### Multiple Rapid Clicks
✅ Each click applies immediately, and server responses are ignored on success.

### Out-of-Order Server Responses
✅ Since we never apply successful server responses, response order doesn't matter.

### Network Errors
✅ Rollback to original state with clear error notification.

### Server Validation Errors
✅ Rollback to original state with server's error message.

### Page Refresh Before Server Sync
✅ Changes persist in localStorage and will be reloaded on next visit.

## Testing

To test race conditions:

1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Click the increment (+) button rapidly 3-4 times
4. Observe that the UI stays consistent (no flickering)
5. Watch network responses arrive out of order
6. Verify final state matches the number of clicks

## Future Considerations

### Conflict Resolution
If multiple devices/tabs are used simultaneously, conflicts could occur. Consider:
- Adding a conflict resolution strategy (last-write-wins, operational transforms, etc.)
- Implementing a proper sync queue for offline-to-online transitions
- Adding version numbers or vector clocks for conflict detection

### Server-Side Validation
The server should still validate all updates to prevent:
- Exceeding maximum sets
- Invalid exercise IDs
- Unauthorized access

The optimistic update will rollback if server validation fails.

## Related Documentation

- [Exercise View Modes](./exercise-view-modes.md) - UI modes for displaying exercises
- [Authentication](./authentication.md) - User authentication and authorization

