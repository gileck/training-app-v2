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
- **Conversation Persistence**: Save and resume chat conversations across sessions
- **Suggested Actions**: Context-aware quick action buttons for common tasks
- **Example Prompts**: Clickable example prompts to guide users
- **Floating Chat Widget**: Modern floating chat interface in bottom-right corner

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

**Collection 1**: `aiActionHistory`
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

**Collection 2**: `aiConversations`
- Stores chat conversations with messages
- Supports multiple conversations per user/plan
- Tracks conversation metadata

**Schema**:
```typescript
{
  _id: ObjectId
  userId: ObjectId
  planId?: ObjectId  // Optional for general conversations
  title: string  // Auto-generated from first message
  messages: ConversationMessage[]
  status: 'active' | 'archived'
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  actionIds?: string[]  // References to aiActionHistory
  timestamp: Date
}
```

### API Layer

**Module**: `src/apis/trainingPlanAI/`

**Endpoints**:
- `processUserMessage`: Accepts user message, returns structured actions
- `confirmAction`: Executes a confirmed action
- `confirmMultipleActions`: Batch execution of multiple actions in parallel
- `rejectAction`: Marks an action as rejected
- `undoAction`: Reverts a previously confirmed action
- `getActionHistory`: Retrieves action history for a plan
- `getChatContext`: Provides context for AI processing
- `createConversation`: Creates a new conversation
- `getConversation`: Retrieves a specific conversation
- `listConversations`: Lists conversations for user/plan
- `updateConversation`: Updates conversation (title, status, messages)
- `deleteConversation`: Deletes a conversation
- `getSuggestedActions`: Generates context-aware action suggestions

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
│   ├── confirmMultipleActions.ts  # NEW: Batch operations
│   ├── rejectAction.ts
│   ├── undoAction.ts
│   ├── getActionHistory.ts
│   ├── getChatContext.ts
│   ├── createConversation.ts      # NEW: Conversation persistence
│   ├── getConversation.ts         # NEW
│   ├── listConversations.ts       # NEW
│   ├── updateConversation.ts      # NEW
│   ├── deleteConversation.ts      # NEW
│   └── getSuggestedActions.ts     # NEW: Context-aware suggestions
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
- Floating chat widget in bottom-right corner
- Custom AI icon with gradient styling
- Shows messages, action cards, and history
- Model selector in input area
- Conversation management menu
- Suggested actions and example prompts
- Dark mode support
- Badge showing pending action count

**`AIActionCard.tsx`**
- Displays individual action with description
- Confirm/Reject buttons with icons
- Status indicators (pending/confirmed/rejected/undone)
- Undo button for reversible actions
- Uses names instead of IDs in descriptions

**`AIActionHistory.tsx`**
- Lists all historical actions
- Grouped by status
- Shows timestamps
- Provides undo capability

**`AIChatIcon.tsx`**
- Custom vector icon for AI chat
- Gradient styling with sparkle effects
- Reusable across the application

#### Hook

**`useAIAssistant.ts`**
- Manages AI state and interactions
- Handles message sending
- Processes action confirmation/rejection/undo
- Maintains chat history and action history
- Triggers data refresh after action execution
- Manages conversation persistence (create, load, save, delete)
- Loads suggested actions based on context
- Supports batch action confirmation
- Provides example prompts for guidance

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
- Executes all pending actions in parallel using `Promise.all`
- Aggregates success/failure results
- Shows summary with error details if any fail
- Uses DoneAll icon for visual clarity
- Single data refresh after all actions complete

### Responsive Design
- Floating chat widget positioned in bottom-right corner
- Fab button with badge showing pending action count
- Adjusts for mobile bottom navigation (56px offset)
- Chat panel max height responsive to viewport
- Width adapts from mobile (calc(100vw - 32px)) to desktop (450px)
- Model selector responsive width (200px - 400px)
- Collapsible interface via Fab button
- Smooth fade transitions when opening/closing

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

## Phase 1: Enhanced Features

### Conversation Persistence

Conversations are automatically saved to the database and can be resumed later.

**Key Features**:
- Auto-creates conversation on first message
- Title auto-generated from first user message (first 50 characters)
- Messages saved after each exchange
- Multiple conversations per user/plan
- Conversation menu accessible via "More" button in header
- List shows title, date, and message count
- Archive or delete conversations
- Switch between conversations without losing context

**Implementation**:
- `createConversation`: Creates new conversation
- `updateConversation`: Saves messages and metadata
- `listConversations`: Retrieves active conversations
- `loadConversation`: Restores previous conversation
- Conversations scoped by user and optionally by plan

### Suggested Actions

Context-aware action buttons that suggest common operations.

**Generation Logic**:
- Analyzes current plan state (exercise count, workout count, muscle balance)
- Different suggestions for plan creation vs management
- Adapts based on what's missing or needed

**Suggestion Categories**:
1. **Plan Creation** (no plan):
   - Beginner Plan: "Create a 4-week beginner full-body training plan"
   - Push/Pull/Legs: "Create an 8-week push/pull/legs split"
   - Cardio Plan: "Create a 6-week cardio plan for fat loss"

2. **Exercise Management**:
   - Add Compound Exercises (0 exercises)
   - Add Accessories (< 5 exercises)
   - Progressive Overload (increase weights by 5%)
   - Add Upper Body (if missing)
   - Add Lower Body (if missing)
   - Add Cardio sessions

3. **Workout Organization**:
   - Create Workout Split (when exercises > 2, workouts = 0)

4. **General**:
   - Deload Week (reduce weights by 30%)

**UI Display**:
- Shows up to 6 quick action buttons
- Emoji icons for visual identification
- Grouped in "Quick Actions" section
- One-click to send prompt
- Updates when plan state changes

### Example Prompts

Clickable prompt cards that demonstrate AI capabilities.

**Characteristics**:
- 4-5 example prompts per context
- Context-specific (different for plan creation vs management)
- Displayed as interactive cards with hover effects
- Shows in empty state below suggested actions
- One-click to send to AI

**Examples**:
- "Create a 4-week strength training plan"
- "Add 3 sets of 12 reps bench press"
- "Show me exercises for chest and triceps"
- "Create a leg day workout"
- "Increase all weights by 5%"

### Batch Action Execution

Parallel execution of multiple AI actions with proper error handling.

**Features**:
- `confirmMultipleActions` API endpoint
- Uses `Promise.all` for concurrent execution
- Aggregates success and failure results
- Single data refresh after all actions
- Error aggregation with detailed messages
- Shows summary: "Executed X actions, Y failed"

**Benefits**:
- Faster than sequential execution
- Proper `isProcessing` state management
- No race conditions
- Better error reporting
- Improved UX for multi-action operations

### Floating Chat Widget

Modern floating chat interface with custom branding.

**Design**:
- Fab button in bottom-right corner
- Custom AI icon with gradient (blue to teal)
- Sparkle effects on icon
- Badge shows pending action count
- Gradient header with glassmorphic effect
- Dark mode support throughout

**Behavior**:
- Starts collapsed (doesn't auto-open)
- Smooth fade transitions
- Toggle via Fab button
- Chat/History toggle in header
- Conversation menu via "More" button

**Styling**:
- Purple gradient theme (667eea → 764ba2)
- Consistent with app design system
- Responsive positioning
- Box shadow and elevation
- Hover effects on interactive elements

## Performance Considerations

- Actions in batch operations executed in parallel for better performance
- State capture happens before execution (small overhead)
- Conversations stored in database (persisted across sessions)
- Chat history loaded from database on mount
- Suggested actions cached and reloaded only when plan changes
- Action history paginated (default 50 items)
- DB indexes on userId and planId for fast queries
- Optimistic UI updates for better perceived performance

## Security

- All actions require user authentication (userId from context)
- Actions validated against user's plans
- Cannot modify other users' data
- Action history scoped to user
- Server-side validation of all action data

## Future Enhancements

Potential improvements:
- Voice input for messages
- Bulk undo (undo last N actions)
- Action scheduling (execute later)
- Action templates (save common requests)
- Multi-language support
- Export chat history
- Conversation search and filtering
- Smart conversation suggestions based on plan progress
- AI-powered workout recommendations
- Integration with fitness tracking devices

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

