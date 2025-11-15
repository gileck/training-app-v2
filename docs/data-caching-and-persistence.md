# Data Caching and Persistence Strategy

## Overview

This document describes the complete data flow for training plans, exercises, and workouts in the application, including how data is cached in localStorage, fetched from the server, and synchronized across page loads.

## Architecture Principles

### 1. **Instant UI with Fresh Data**
- Show cached data immediately for instant UI
- Fetch fresh data in the background
- Update UI seamlessly when fresh data arrives

### 2. **Single Source of Truth**
- **Server (MongoDB)**: The authoritative source of all data
- **LocalStorage**: Cache for instant UI, always validated with server
- **React State**: Current runtime state, synchronized with both

### 3. **Cache Invalidation**
- LocalStorage data is marked as "stale" on page load
- Forces fresh fetch from server while showing cached data
- Prevents serving outdated data after mutations

## Complete Data Flow

### 1. Creating a Workout

```
User Action: Click "Create Workout"
    ↓
UI Component
    ↓ 
useWorkoutHooks.savedWorkout_handleConfirmAddNewWorkout()
    ↓
useSavedWorkouts hook
    createSavedWorkout({ name, exerciseIds })
    ↓
useSavedWorkoutHooks.createSavedWorkout()
    - Adds trainingPlanId to request
    - Calls API client
    ↓
API Client (savedWorkouts/client.ts)
    - POST /api/savedWorkouts/create
    - { bypassCache: true } ← Ensures fresh response
    ↓
Server (savedWorkouts/server.ts)
    - Validates user authentication
    - Validates trainingPlanId
    - Creates workout document
    ↓
MongoDB
    - INSERT into 'savedWorkouts' collection
    - Returns created document with _id
    ↓
Server Response
    - Returns SavedWorkout with _id
    ↓
useSavedWorkoutHooks receives response
    - Checks if planData exists
    - Updates state.planData[planId].savedWorkouts
    - Calls updateStateAndSave()
    ↓
updateStateAndSave()
    1. Updates React state
    2. Saves to localStorage
    ↓
UI Re-renders
    - Shows new workout immediately ✅
```

### 2. Page Load / Refresh

```
Page Loads
    ↓
useTrainingDataHooks initializes
    ↓
useEffect(() => { loadTrainingPlans() }, [])
    ↓
loadTrainingPlans()
    ↓
┌─────────────────────────────────────────────┐
│ STEP A: Load from LocalStorage (Instant UI) │
└─────────────────────────────────────────────┘
    ↓
loadFromLocalStorage()
    - Read 'training-data-cache' from localStorage
    ↓
⚠️ CRITICAL: Mark all planData as STALE
    stalePlanData = Object.keys(cachedData.planData).reduce((acc, planId) => {
        acc[planId] = {
            ...cachedData.planData[planId],
            isLoaded: false,  ← Forces fresh fetch
            isLoading: false
        }
    })
    ↓
setState() with cached data
    - trainingPlans: from cache
    - activePlanId: from cache
    - planData: STALE (isLoaded: false)
    ↓
UI renders cached data
    - Shows workouts from localStorage
    - User sees instant UI ✅
    ↓
┌──────────────────────────────────────┐
│ STEP B: Fetch Fresh Data from Server │
└──────────────────────────────────────┘
    ↓
For each training plan:
    Promise.all([
        getExercises({ trainingPlanId }),
        getSavedWorkouts({ trainingPlanId })
    ])
    ↓
API Requests:
    GET /api/exercises/get
    GET /api/savedWorkouts/getAll
    ↓
Service Worker:
    - Matches /api/ pattern
    - Uses NetworkOnly strategy
    - Never serves cached API responses
    ↓
Server Response:
    - Fresh exercises from MongoDB
    - Fresh workouts from MongoDB
    ↓
setState() with fresh data
    - planData[planId].exercises = fresh
    - planData[planId].savedWorkouts = fresh
    - planData[planId].isLoaded = true
    ↓
saveToLocalStorage()
    - Update cache with fresh data
    ↓
UI Re-renders
    - Shows fresh data ✅
    - User sees any changes from other devices
```

### 3. Hook Auto-Loading

Components can use data hooks like `useSavedWorkouts(planId)`:

```
Component mounts
    ↓
useSavedWorkouts(planId) hook
    ↓
useEffect(() => {
    if (!state.planData[planId]?.isLoaded && 
        !state.planData[planId]?.isLoading) {
        loadPlanData(planId)
    }
}, [planId])
    ↓
Check isLoaded flag:
    
    BEFORE FIX (Bug):
        - localStorage had isLoaded: true
        - Hook skips loadPlanData()
        - Shows stale cached data ❌
    
    AFTER FIX (Current):
        - loadTrainingPlans() marked cache as stale
        - isLoaded: false
        - Hook calls loadPlanData()
        - Fetches fresh data ✅
    ↓
loadPlanData(planId)
    - Checks if already loaded/loading
    - Sets isLoading: true
    - Fetches from server
    - Updates state with fresh data
    - Saves to localStorage
```

## Key Components

### 1. LocalStorage Management

**File:** `src/client/context/TrainingPlanData/hooks/useStorageHooks.ts`

```typescript
const STORAGE_KEY = 'training-data-cache';

saveToLocalStorage(data: TrainingDataState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

loadFromLocalStorage(): TrainingDataState | null {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
}
```

**What gets cached:**
- Training plans list
- Active plan ID
- Per-plan data:
  - Exercises
  - Saved workouts
  - Weekly progress
  - Loading/loaded flags

### 2. State Management

**File:** `src/client/context/TrainingPlanData/TrainingDataContext.tsx`

```typescript
interface TrainingDataState {
    trainingPlans: TrainingPlan[];
    activePlanId: string | null;
    planData: Record<string, {
        exercises: ExerciseBase[];
        weeklyProgress: Record<number, WeeklyProgressBase[]>;
        savedWorkouts: SavedWorkout[];
        isLoaded: boolean;   // Controls auto-loading
        isLoading: boolean;  // Prevents duplicate fetches
    }>;
    isInitialLoading: boolean;
    error: string | null;
}
```

**Two update methods:**
1. `updateState()`: Updates React state only
2. `updateStateAndSave()`: Updates React state + localStorage

### 3. Service Worker Caching

**File:** `next.config.ts`

```typescript
runtimeCaching: [
    // Static assets - cache aggressively
    { urlPattern: /\.(?:js|css)$/, handler: 'StaleWhileRevalidate' },
    { urlPattern: /\.(?:png|jpg|svg)$/, handler: 'CacheFirst' },
    
    // API endpoints - NEVER cache
    { 
        urlPattern: /^https?:\/\/[^/]+\/api\/.*/, 
        handler: 'NetworkOnly'  // Always fetch fresh
    },
    
    // Pages - prefer fresh but can use cache
    { urlPattern: /\.html?$/, handler: 'NetworkFirst' }
]
```

**Why NetworkOnly for APIs:**
- Workout data must be fresh (multi-device sync)
- User data can change server-side
- Prevents stale data bugs

## Critical Implementation Details

### 1. Cache Invalidation on Load

**Location:** `useTrainingDataHooks.ts` lines 52-78

```typescript
loadTrainingPlans() {
    const cachedData = loadFromLocalStorage();
    
    if (cachedData) {
        // 🔑 KEY FIX: Mark all cached planData as stale
        const stalePlanData = Object.keys(cachedData.planData || {}).reduce((acc, planId) => {
            acc[planId] = {
                ...cachedData.planData[planId],
                isLoaded: false,  // ← Forces re-fetch
                isLoading: false
            }
        }, {});
        
        setState({
            ...cachedData,
            planData: stalePlanData  // Use stale data
        });
    }
    
    // Then fetch fresh data...
}
```

**Why this is critical:**
- Without this, hooks see `isLoaded: true` and skip fetching
- With this, cached data shows instantly but fresh data is fetched
- Best of both worlds: instant UI + fresh data

### 2. Preventing Duplicate Fetches

**Location:** `useTrainingDataHooks.ts` lines 194-222

```typescript
loadPlanData(planId) {
    setState(prev => {
        const existing = prev.planData[planId];
        
        // Skip if already loaded or currently loading
        if (existing?.isLoaded || existing?.isLoading) {
            return prev;
        }
        
        // Set loading flag to prevent duplicate requests
        return {
            ...prev,
            planData: {
                [planId]: {
                    ...existing,
                    isLoading: true  // Prevents race conditions
                }
            }
        };
    });
    
    // Then fetch...
}
```

### 3. Mutation Operations

**Location:** `useSavedWorkoutHooks.ts` lines 45-85

All mutations (create/update/delete) follow this pattern:

```typescript
async createSavedWorkout(planId, workout) {
    // 1. Call API with bypassCache: true
    const response = await apiCreateSavedWorkout(workout);
    
    // 2. Optimistically update local state
    if (response.data) {
        updateStateAndSave({  // ← Saves to both state and localStorage
            planData: {
                [planId]: {
                    ...currentPlanData,
                    savedWorkouts: [...currentPlanData.savedWorkouts, response.data]
                }
            }
        });
    }
}
```

**Why updateStateAndSave:**
- Immediate UI update (no loading spinner for cached data)
- Persists across page refreshes
- Will be validated on next page load

## Troubleshooting

### Problem: Workouts disappear after refresh

**Root Cause:** Service worker or localStorage caching stale data

**Solution:**
1. Check service worker config - API calls should use `NetworkOnly`
2. Verify localStorage data is marked as stale (`isLoaded: false`)
3. Clear site data to force fresh fetch

### Problem: Multiple API calls for same data

**Root Cause:** Missing `isLoading` flag or improper dependency array

**Solution:**
1. Check `loadPlanData` sets `isLoading: true` immediately
2. Verify hooks check both `isLoaded` and `isLoading`
3. Review useEffect dependencies

### Problem: Stale data shown after mutation

**Root Cause:** Not using `updateStateAndSave` or not invalidating cache

**Solution:**
1. Use `updateStateAndSave` for all mutations
2. Ensure API client has `bypassCache: true`
3. Mark cache as stale on next page load

## Testing the Flow

### Manual Testing Steps:

1. **Create Workout**
   - Click "Create Workout"
   - Workout should appear immediately
   - Check browser dev tools → Application → LocalStorage
   - Verify workout is in 'training-data-cache'

2. **Refresh Page**
   - Hard refresh (Cmd+Shift+R)
   - Workout should appear instantly (from cache)
   - Open Network tab
   - Should see API calls to `/api/savedWorkouts/getAll`
   - Fresh data should load

3. **Multi-Device Test**
   - Create workout on Device A
   - Open app on Device B
   - Refresh
   - Should see workout from Device A

4. **Service Worker Test**
   - Open Dev Tools → Application → Service Workers
   - Clear storage
   - Reload
   - API calls should NOT be cached

## Future Improvements

1. **Optimistic Updates with Rollback**
   - Show mutation immediately
   - Roll back if server request fails
   - Better UX for slow connections

2. **Differential Sync**
   - Only fetch data that changed since last sync
   - Use timestamps or version numbers
   - Reduces bandwidth and improves performance

3. **Background Sync**
   - Queue mutations when offline
   - Sync when connection restored
   - True offline-first experience

4. **Cache Versioning**
   - Add version number to localStorage key
   - Automatically invalidate on app updates
   - Prevents incompatible cached data

## References

- [Service Worker Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [React State Management Best Practices](https://react.dev/learn/managing-state)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Optimistic Updates](../optimistic-updates.md)

