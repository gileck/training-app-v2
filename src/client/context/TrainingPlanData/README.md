# TrainingPlanData Context

Global state management for training plans, exercises, weekly progress, and saved workouts.

## Architecture

This context provides a centralized state management solution using React Context API with the following features:

- **Single Source of Truth**: All training data is managed in one place
- **Optimistic Updates**: Instant UI feedback with background server sync
- **Offline Support**: Data persisted to localStorage for offline access
- **Automatic Data Loading**: Components automatically trigger data loading when needed
- **Error Handling**: Graceful error handling with user notifications

## Structure

```
TrainingPlanData/
├── README.md                       # This file
├── TrainingDataContext.tsx        # Context definition and types
├── TrainingDataProvider.tsx       # Provider component
├── index.ts                       # Public exports
└── hooks/
    ├── useTrainingDataHooks.ts    # Core state management hooks
    ├── useTrainingPlanHooks.ts    # Training plan CRUD operations
    ├── useExerciseHooks.ts        # Exercise CRUD operations
    ├── useWeeklyProgressHooks.ts  # Weekly progress and set completion
    ├── useSavedWorkoutHooks.ts    # Saved workout operations
    ├── useStorageHooks.ts         # localStorage persistence
    └── useNotificationHooks.ts    # User notifications
```

## Usage

### Provider Setup

Wrap your app with the provider:

```tsx
import { TrainingDataProvider } from '@/client/context/TrainingPlanData';

function App() {
    return (
        <TrainingDataProvider>
            <YourComponents />
        </TrainingDataProvider>
    );
}
```

### Consuming Data

Use the specialized hooks to access data:

```tsx
import { 
    useTrainingPlans, 
    useExercises, 
    useWeeklyProgress 
} from '@/client/hooks/useTrainingData';

function MyComponent() {
    const { trainingPlans, isLoading } = useTrainingPlans();
    const { exercises } = useExercises(planId);
    const { progress, updateSetCompletion } = useWeeklyProgress(planId, weekNumber);
    
    // Components automatically trigger loading when needed
    // No manual loading required in most cases
}
```

## Key Features

### 1. Optimistic Updates

Updates are applied immediately to the UI and saved to localStorage, with background server sync. This provides:
- Instant user feedback
- No loading states for updates
- Automatic rollback on errors

**See**: [Optimistic Updates Documentation](../../../docs/optimistic-updates.md) for detailed explanation and race condition prevention strategy.

### 2. Automatic Data Loading

Hooks automatically load data when needed:

```tsx
// Data automatically loads when planId changes
const { exercises, isLoading } = useExercises(planId);

// No need to call loadExercises() manually
```

### 3. localStorage Persistence

All data is automatically persisted to localStorage for:
- Offline support
- Faster initial loads
- Surviving page refreshes

### 4. Centralized Error Handling

Errors are handled consistently:
- User-friendly notifications
- Automatic rollback on failures
- Error state available in hooks

## State Shape

```typescript
interface TrainingDataState {
    // List of all training plans
    trainingPlans: TrainingPlan[];
    
    // Currently active plan ID
    activePlanId: string | null;
    
    // Per-plan data
    planData: {
        [planId: string]: {
            exercises: WorkoutExercise[];
            weeklyProgress: {
                [weekNumber: number]: WeeklyProgressBase[];
            };
            savedWorkouts: SavedWorkout[];
            isLoaded: boolean;
            isLoading: boolean;
        }
    };
    
    // Global states
    isInitialLoading: boolean;
    isLoadingFromServer: boolean;
    error: string | null;
}
```

## Best Practices

### 1. Use Specialized Hooks

```tsx
// ✅ Good - Use specialized hooks
const { exercises } = useExercises(planId);

// ❌ Bad - Don't use the raw context
const { state } = useTrainingData();
const exercises = state.planData[planId]?.exercises;
```

### 2. Rely on Automatic Loading

```tsx
// ✅ Good - Let hooks handle loading
const { exercises, isLoading } = useExercises(planId);

// ❌ Bad - Manual loading is usually not needed
const { exercises, loadExercises } = useExercises(planId);
useEffect(() => { loadExercises(); }, []);
```

### 3. Handle Loading States

```tsx
const { exercises, isLoading } = useExercises(planId);

if (isLoading) {
    return <LoadingSpinner />;
}

return <ExerciseList exercises={exercises} />;
```

### 4. Trust Optimistic Updates

When updating data, the UI will update immediately. Don't wait for server responses:

```tsx
// ✅ Good - Update and let optimistic updates handle it
const handleIncrement = async () => {
    await updateSetCompletion(exerciseId, 1, totalSets);
    // UI already updated, no need to refresh
};

// ❌ Bad - Don't manually refresh after updates
const handleIncrement = async () => {
    await updateSetCompletion(exerciseId, 1, totalSets);
    await loadProgress(); // Unnecessary!
};
```

## Performance Considerations

### 1. Selective Re-renders

Hooks use `useMemo` to prevent unnecessary re-renders:

```tsx
// Only re-renders when exercises actually change
const { exercises } = useExercises(planId);
```

### 2. Lazy Loading

Data is only loaded when needed:
- Training plans load on app init
- Exercise data loads per plan
- Progress loads per week

### 3. localStorage Caching

Initial loads are fast thanks to localStorage caching:
1. Display cached data immediately
2. Fetch from server in background
3. Update with server data when ready

## Error Handling

Errors are handled at multiple levels:

### 1. Hook Level
```tsx
const { exercises, error, isLoading } = useExercises(planId);

if (error) {
    return <ErrorMessage message={error} />;
}
```

### 2. Context Level
Global errors trigger notifications automatically via Snackbar.

### 3. Operation Level
Failed operations (create, update, delete) rollback automatically and show notifications.

## Related Documentation

- **[Optimistic Updates](../../../docs/optimistic-updates.md)** - Detailed explanation of optimistic update pattern and race condition prevention
- **[Exercise View Modes](../../../docs/exercise-view-modes.md)** - UI component documentation
- **[Authentication](../../../docs/authentication.md)** - User authentication and authorization

## Hooks Reference

### useTrainingPlans()
Manage training plans (list, create, update, delete).

### useExercises(planId)
Manage exercises for a specific plan.

### useWeeklyProgress(planId, weekNumber)
Access and update weekly progress and set completion.

### useSavedWorkouts(planId)
Manage saved workouts for a plan.

### useTrainingData()
Low-level hook for accessing raw context (rarely needed).

