# Refactoring `useManageTrainingPlanPage.ts` - Migration Plan

This document outlines the plan to refactor the `useManageTrainingPlanPage.ts` hook into smaller, more manageable feature-specific hooks.

## Phase 1: Define New Hooks and Responsibilities

We will create the following new custom hooks:

### 1. `usePlanExercises(planId: string | undefined)`
   - **Status:** [ ] TODO
   - **Responsibilities:**
      - Managing state and logic for the "Exercises" tab.
      - Fetching the training plan details.
      - Fetching exercises for the current plan.
      - Fetching all exercise definitions.
      - Handling CRUD operations for exercises within the plan (add, delete, duplicate, edit triggers).
      - Managing state for exercise browser and exercise details dialogs.
   - **Inputs:**
      - `planId: string | undefined`
   - **Outputs (approximate `UsePlanExercisesReturn`):**
      - `exercises: ExerciseBase[]`
      - `planDetails: TrainingPlan | null`
      - `allExerciseDefinitions: ApiExerciseDefinitionMPE[]`
      - `definitionsMapMPE: Record<string, ApiExerciseDefinitionMPE>`
      - `existingExerciseDefinitionIdsInPlan: string[]`
      - `fetchPlanExercisesData: () => Promise<void>`
      - `isLoadingExercises: boolean`
      - `exercisesError: string | null`
      - `deletingExerciseId: string | null`
      - `duplicatingExerciseId: string | null`
      - `isExerciseBrowserOpen: boolean`
      - `handleOpenExerciseBrowser: () => void`
      - `handleBrowserDialogClose: () => void`
      - `isExerciseDetailsDialogOpen: boolean`
      - `selectedDefinitionForDetails: ApiExerciseDefinitionMPE | null`
      - `exerciseBeingEdited: ExerciseBase | null`
      - `handleOpenEditForm: (exercise: ExerciseBase) => void`
      - `handleExerciseSelectFromBrowser: (definition: ApiExerciseDefinitionMPE) => void`
      - `handleDetailsDialogSave: () => Promise<void>`
      - `handleDetailsDialogClose: () => void`
      - `isConfirmDeleteExerciseDialogOpen: boolean`
      - `exercisePendingDeletion: ExerciseBase | null`
      - `handleRequestDeleteExercise: (exercise: ExerciseBase) => void`
      - `handleConfirmDeleteExerciseDialogClose: () => void`
      - `executeDeleteExercise: () => Promise<void>`
      - `handleDuplicateExercise: (exerciseToDuplicate: ExerciseBase) => Promise<void>`

### 2. `usePlanSavedWorkouts(planId: string | undefined, allExerciseDefinitions: ApiExerciseDefinition[])`
   - **Status:** [ ] TODO
   - **Responsibilities:**
      - Managing state and logic for the "Saved Workouts" tab.
      - Fetching saved workouts for the current plan.
      - Handling CRUD for saved workouts (create, delete, rename).
      - Managing expansion state of workout cards.
      - Providing a map of exercise definitions for display within workout cards.
      - Exposing methods for other hooks/dialogs to add exercises to existing workouts or create new workouts with exercises.
   - **Inputs:**
      - `planId: string | undefined`
      - `allExerciseDefinitions: ApiExerciseDefinition[]`
   - **Outputs (approximate `UsePlanSavedWorkoutsReturn`):**
      - `savedWorkouts: ClientWorkoutDisplay[]`
      - `isLoadingSavedWorkouts: boolean`
      - `savedWorkoutsError: string | null`
      - `savedWorkoutsSuccessMessage: string | null`
      - `setSavedWorkoutsSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>`
      - `setSavedWorkoutsError: React.Dispatch<React.SetStateAction<string | null>>`
      - `fetchSavedWorkoutsData: () => Promise<void>`
      - `savedWorkoutExerciseDefinitionMap: Map<string, ApiExerciseDefinition>`
      - `expandedWorkoutId: string | null`
      - `handleToggleExpandWorkout: (workoutId: string) => void`
      - `isDeleteWorkoutDialogOpen: boolean`
      - `openDeleteWorkoutDialog: (workoutId: string) => void`
      - `closeDeleteWorkoutDialog: () => void`
      - `handleConfirmDeleteWorkout: () => Promise<void>`
      - `workoutToDeleteId: string | null`
      - `isRenameWorkoutDialogOpen: boolean`
      - `openRenameWorkoutDialog: (workout: ClientWorkoutDisplay) => void`
      - `closeRenameWorkoutDialog: () => void`
      - `handleConfirmRenameWorkout: (newName: string) => Promise<void>`
      - `workoutToRename: ClientWorkoutDisplay | null`
      - `isRenamingWorkoutId: string | null`
      - `isProcessingWorkoutAction: boolean`
      - `removeExerciseFromSavedWorkout: (workoutId: string, exerciseId: string) => Promise<void>`
      - `isRemovingExerciseFromWorkout: string | null`
      - `addExercisesToExistingWorkout: (workoutId: string, exerciseIds: string[]) => Promise<{success: boolean, message: string}>`
      - `createNewWorkoutWithExercises: (name: string, exerciseIds: string[]) => Promise<{success: boolean, message: string, newWorkout?: ApiSavedWorkout}>`

### 3. `useAddExerciseToWorkoutDialog(planExercises: ExerciseWithDefinition[], onConfirmAdd: (workoutId: string, exerciseIds: string[]) => Promise<void>)`
   - **Status:** [ ] TODO
   - **Responsibilities:**
      - Manages the "Add Exercise to Existing Workout" dialog UI state and logic.
      - Search, selection, and confirmation.
   - **Inputs:**
      - `planExercises: ExerciseWithDefinition[]`
      - `onConfirmAdd: (workoutId: string, exerciseIds: string[]) => Promise<void>` 
   - **Outputs (approximate `UseAddExerciseToWorkoutDialogReturn`):**
      - `isAddExerciseToWorkoutDialogOpen: boolean`
      - `openAddExerciseToWorkoutDialog: (workout: ClientWorkoutDisplay) => void` 
      - `closeAddExerciseToWorkoutDialog: () => void`
      - `workoutToAddExerciseTo: ClientWorkoutDisplay | null` 
      - `dialogSearchTerm: string`
      - `setDialogSearchTerm: React.Dispatch<React.SetStateAction<string>>`
      - `dialogSelectedExerciseIds: Set<string>`
      - `handleToggleDialogExerciseSelection: (exerciseId: string) => void`
      - `handleDialogConfirmAddExercises: () => Promise<void>`
      - `isDialogAddingExercises: boolean`
      - `dialogError: string | null`
      - `filteredDialogExercises: ExerciseWithDefinition[]`

### 4. `useAddNewWorkoutDialog(planId: string | undefined, planExercises: ExerciseWithDefinition[], onCreateWorkout: (planId: string, name: string, exerciseIds: string[]) => Promise<void>)`
   - **Status:** [ ] TODO
   - **Responsibilities:**
      - Manages the "Add New Workout" dialog UI state and logic.
      - Workout name input, exercise search, selection, and confirmation.
   - **Inputs:**
      - `planId: string | undefined`
      - `planExercises: ExerciseWithDefinition[]`
      - `onCreateWorkout: (planId: string, name: string, exerciseIds: string[]) => Promise<void>`
   - **Outputs (approximate `UseAddNewWorkoutDialogReturn`):**
      - `isAddNewWorkoutDialogOpen: boolean`
      - `openAddNewWorkoutDialog: () => void`
      - `closeAddNewWorkoutDialog: () => void`
      - `newWorkoutName: string`
      - `setNewWorkoutName: React.Dispatch<React.SetStateAction<string>>`
      - `dialogSearchTerm: string`
      - `setDialogSearchTerm: React.Dispatch<React.SetStateAction<string>>`
      - `dialogSelectedExerciseIds: Set<string>`
      - `handleToggleDialogExerciseSelection: (exerciseId: string) => void`
      - `handleDialogConfirmCreateWorkout: () => Promise<void>`
      - `isDialogCreatingWorkout: boolean`
      - `dialogError: string | null`
      - `filteredDialogExercises: ExerciseWithDefinition[]`
      - `isLoadingDialogExercises: boolean`

### 5. Main `useManageTrainingPlanPage` Hook (Revised)
   - **Status:** [ ] TODO (To be refactored after sub-hooks are created)
   - **Responsibilities:**
      - Orchestration of sub-hooks.
      - Routing parameters (`planId`).
      - Tab management.
      - Global page loading state (`isPageLoading`), top-level error (`error`).
      - Fetching `availableTrainingPlans`.
      - `loadInitialPageData` (orchestrates calls to data fetching functions from `usePlanExercises` and `usePlanSavedWorkouts`).
      - Combining and returning all necessary values for the `ManageTrainingPlanPage` component.
   - **Inputs:** None.
   - **Outputs:** Combined state and handlers from itself and consumed hooks.

## Phase 2: Implementation and Migration
   - [ ] TODO: Create `usePlanExercises.ts` and `usePlanExercises.types.ts`. Migrate relevant logic.
   - [ ] TODO: Update main hook to consume `usePlanExercises`. Test.
   - [ ] TODO: Create `usePlanSavedWorkouts.ts` and `usePlanSavedWorkouts.types.ts`. Migrate relevant logic.
   - [ ] TODO: Update main hook to consume `usePlanSavedWorkouts`. Test.
   - [ ] TODO: Create `useAddExerciseToWorkoutDialog.ts` and `useAddExerciseToWorkoutDialog.types.ts`. Migrate relevant logic.
   - [ ] TODO: Update main hook to consume `useAddExerciseToWorkoutDialog`. Test.
   - [ ] TODO: Create `useAddNewWorkoutDialog.ts` and `useAddNewWorkoutDialog.types.ts`. Migrate relevant logic.
   - [ ] TODO: Update main hook to consume `useAddNewWorkoutDialog`. Test.
   - [ ] TODO: Final cleanup of the main `useManageTrainingPlanPage.ts` hook.
   - [ ] TODO: Comprehensive testing of the entire page functionality.
   - [ ] TODO: Run `yarn checks` and fix any issues.

---
*This plan will be updated as the refactoring progresses.* 