# AI Training Plan Assistant

## Overview

The AI Training Plan Assistant is a chat-based interface that allows users to manage their training plans, exercises, and workouts using natural language commands. The AI interprets user requests and generates structured actions that must be confirmed before execution. All actions are logged in the database with full undo capability.

## Features

### Core Capabilities
- **Natural Language Processing**: Users can describe what they want in plain English
- **Action Confirmation**: Every AI-suggested action requires user confirmation before execution
- **Undo Functionality**: Confirmed actions can be undone (with some exceptions)
- **Action History**: Complete audit trail of all AI actions with timestamps
- **Multi-Model Support**: Choose between Gemini 2.5 and GPT-4o models
- **Batch Operations**: "Approve All" button for confirming multiple actions at once
- **Custom Exercise Creation**: Automatically creates custom exercises if not in built-in library

### Supported Actions

#### Training Plan Management
- `createPlan`: Create a new training plan
- `updatePlan`: Update plan name or duration  
- `deletePlan`: Delete a training plan (cannot be undone)
- `setActivePlan`: Set a plan as active

#### Exercise Management
- `createCustomExercise`: Create a custom exercise definition
- `addExercise`: Add an exercise to the plan
- `updateExercise`: Update exercise details (sets, reps, weight, etc.)
- `deleteExercise`: Remove an exercise from the plan

#### Workout Management
- `createWorkout`: Create a new saved workout
- `renameWorkout`: Rename a saved workout
- `deleteWorkout`: Delete a saved workout (cannot be undone)
- `addExerciseToWorkout`: Add an exercise to a workout
- `removeExerciseFromWorkout`: Remove an exercise from a workout

## Architecture

### Database Layer

**Collection**: `aiActionHistory`
- Stores all AI actions with status tracking
- Captures original state for undo operations
- Includes result data after execution

**Schema**:
```typescript
{
  _id: ObjectId
  userId: ObjectId
  planId?: ObjectId  // Optional for plan creation
  actionType: ActionType
  actionData: Record<string, unknown>
  description: string  // Human-readable description
  status: 'pending' | 'confirmed' | 'rejected' | 'undone' | 'failed'
  originalState?: Record<string, unknown>  // For undo
  resultData?: Record<string, unknown>  // After execution
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}
```

### API Layer

**Module**: `src/apis/trainingPlanAI/`

**Endpoints**:
- `processUserMessage`: Accepts user message, returns structured actions
- `confirmAction`: Executes a confirmed action
- `rejectAction`: Marks an action as rejected
- `undoAction`: Reverts a previously confirmed action
- `getActionHistory`: Retrieves action history for a plan
- `getChatContext`: Provides context for AI processing

**File Structure**:
```
trainingPlanAI/
├── index.ts          # API names
├── types.ts          # Request/response types
├── client.ts         # Client functions
├── server.ts         # Re-exports handlers
├── handlers/         # Individual API handlers
│   ├── processUserMessage.ts
│   ├── confirmAction.ts
│   ├── rejectAction.ts
│   ├── undoAction.ts
│   ├── getActionHistory.ts
│   └── getChatContext.ts
├── actions/          # Core business logic
│   ├── captureState.ts    # Captures state before action
│   ├── executeAction.ts   # Executes actions
│   └── undoAction.ts      # Reverts actions
└── utils/
    └── mappers.ts    # DB to API type conversions
```

### AI Processing

**Class**: `TrainingPlanAssistant`  
**File**: `src/server/ai/trainingPlanAssistant.ts`

Uses `AIModelAdapter` to convert natural language to structured JSON:
- Builds context-aware prompts with current plan state
- Validates AI responses against JSON schema
- Ensures descriptions use names instead of IDs
- Supports multi-action responses

**Prompt Engineering**:
- Provides available action types with examples
- Includes current plan state (exercises, workouts, definitions)
- Instructs AI to use IDs in `actionData` but names in `description`
- Guides AI to create custom exercises when needed

### Client Layer

#### Components

**`AIChatPanel.tsx`**
- Main chat interface
- Shows messages, action cards, and history
- Model selector in input area
- Starts collapsed by default

**`AIActionCard.tsx`**
- Displays individual action with description
- Confirm/Reject buttons with icons
- Status indicators (pending/confirmed/rejected/undone)
- Undo button for reversible actions

**`AIActionHistory.tsx`**
- Lists all historical actions
- Grouped by status
- Shows timestamps
- Provides undo capability

#### Hook

**`useAIAssistant.ts`**
- Manages AI state and interactions
- Handles message sending
- Processes action confirmation/rejection/undo
- Maintains chat history and action history
- Triggers data refresh after action execution

## Data Flow

### 1. User Sends Message

```
User types message → AIChatPanel → useAIAssistant.sendMessage()
  → trainingPlanAI.processUserMessage()
  → TrainingPlanAssistant.processMessage()
  → AI generates structured actions
  → Actions saved to DB as "pending"
  → Return actions to client
```

### 2. User Confirms Action

```
User clicks Confirm → useAIAssistant.confirmAction()
  → trainingPlanAI.confirmAction()
  → captureStateForUndo() - saves current state
  → executeAction() - performs the operation
  → Update action status to "confirmed"
  → Store result data
  → Trigger UI refresh
```

### 3. User Undoes Action

```
User clicks Undo → useAIAssistant.undoAction()
  → trainingPlanAI.undoAction()
  → undoActionExecution() - reverts using original state
  → Update action status to "undone"
  → Trigger UI refresh
```

## State Management

### Refresh Functions

The feature introduces new refresh functions that bypass cache:
- `refreshExercises(planId)`: Force reload exercises
- `refreshSavedWorkouts(planId)`: Force reload workouts

These ensure UI updates immediately after AI actions without requiring page refresh.

**Implementation**:
- Added to `TrainingDataContext` interface
- Implemented in respective hooks
- Called in `handleActionExecuted` callback

### Cache Strategy

Normal `load` functions check `isLoaded` flag and skip if already loaded.  
Refresh functions always fetch from server regardless of cache state.

## UI/UX Features

### Model Selection
- Dropdown at bottom of chat panel
- Shows model name and provider
- Supports: Gemini 2.5 Flash Lite, Gemini 2.5 Flash, GPT-4o Mini, GPT-4o, GPT-4 Turbo
- Selection persists across messages

### Batch Operations
- "Approve All" button appears when 2+ pending actions exist
- Shows count of pending actions
- Confirms all pending actions sequentially
- Uses DoneAll icon for visual clarity

### Responsive Design
- Chat panel fixed at bottom
- Adjusts for mobile bottom navigation (56px offset)
- Model selector responsive width (200px - 400px)
- Collapsible interface to save space

### Status Indicators
- Color-coded borders on action cards
- Icons for each status type
- Timestamps for all actions
- Clear visual feedback for processing state

## Error Handling

### AI Processing Errors
- Network failures: Show error alert with retry option
- AI parse failures: Suggest user rephrase request
- Invalid responses: Log error and show friendly message

### Action Execution Errors
- Captured in `resultData.error`
- Displayed in action card
- Action marked as "failed"
- Original state preserved for potential retry

### Undo Limitations
- Cannot undo: `deletePlan`, `deleteWorkout`, `createCustomExercise`
- Undo button hidden for these action types
- Clear error messages if undo fails

## Custom Exercise Creation

When AI detects an exercise not in available definitions:
1. Generates TWO actions:
   - `createCustomExercise` with muscle groups and type
   - `addExercise` using the new definition ID

2. User confirms both actions
3. Exercise definition created first
4. Exercise added to plan second
5. Both appear in action history

**Required Fields**:
- name, primaryMuscle, type

**Optional Fields**:
- secondaryMuscles, bodyWeight, static, imageUrl

## Integration Points

### ManageTrainingPlanPage
- Chat panel available on all tabs (Exercises, Workouts)
- `handleActionExecuted` refreshes all data
- Uses `planId` for plan-specific operations

### TrainingPlans Page  
- Chat panel available at list level
- `planId: undefined` for plan creation
- `handleActionExecuted` refreshes plan list
- Guides users to create plans from scratch

## Performance Considerations

- Actions executed sequentially (not parallel) for safety
- State capture happens before execution (small overhead)
- Chat history stored in component state (not persisted)
- Action history paginated (default 50 items)
- DB indexes on userId and planId for fast queries

## Security

- All actions require user authentication (userId from context)
- Actions validated against user's plans
- Cannot modify other users' data
- Action history scoped to user
- Server-side validation of all action data

## Future Enhancements

Potential improvements:
- Voice input for messages
- Suggested actions based on plan state
- Bulk undo (undo last N actions)
- Action scheduling (execute later)
- Action templates (save common requests)
- Multi-language support
- Export chat history

## Troubleshooting

### Actions Not Executing
- Check network tab for API failures
- Verify user authentication
- Check action history for error messages
- Review browser console for client errors

### Lists Not Refreshing
- Verify `refreshExercises` and `refreshSavedWorkouts` are called
- Check `handleActionExecuted` callback implementation
- Ensure proper state update triggers

### AI Generating Invalid Actions
- Review chat context in processUserMessage
- Check AI model configuration
- Verify prompt includes all required context
- Consider switching to more capable model

### Undo Not Working
- Verify action type supports undo
- Check `originalState` was captured
- Review undo handler for action type
- Check for database connection issues

