import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition as ApiExerciseDefinition, ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types';
import type { ClientWorkoutDisplay } from '../types';
import type { TrainingPlan as ApiTrainingPlan } from '@/apis/trainingPlans/types';

export interface UseManageTrainingPlanPageReturn {
    planId: string | undefined;
    navigate: (path: string, options?: { replace?: boolean }) => void;
    currentTab: number;
    setCurrentTab: (newTab: number) => void;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    isPageLoading: boolean;
    error: string | null;
    setError: (newError: string | null) => void;

    // Exercises Tab Data & Handlers
    exercises: ExerciseBase[];
    planDetails: TrainingPlan | null;
    definitions: ApiExerciseDefinitionMPE[];
    definitionsMapMPE: Record<string, ApiExerciseDefinitionMPE>;
    existingExerciseDefinitionIdsInPlan: string[];
    deletingExerciseId: string | null;
    duplicatingExerciseId: string | null;
    isExerciseBrowserOpen: boolean;
    handleOpenExerciseBrowser: () => void;
    handleBrowserDialogClose: () => void;
    isExerciseDetailsDialogOpen: boolean;
    selectedDefinitionForDetails: ApiExerciseDefinitionMPE | null;
    exerciseBeingEdited: ExerciseBase | null;
    handleOpenEditForm: (exercise: ExerciseBase) => void;
    handleExerciseSelectFromBrowser: (definition: ApiExerciseDefinitionMPE) => void;
    handleDetailsDialogSave: (exerciseData: ExerciseBase) => Promise<void>;
    handleDetailsDialogClose: () => void;
    isConfirmDeleteExerciseDialogOpen: boolean;
    exercisePendingDeletion: ExerciseBase | null;
    handleRequestDeleteExercise: (exercise: ExerciseBase) => void;
    handleConfirmDeleteExerciseDialogClose: () => void;
    executeDeleteExercise: () => Promise<void>;
    handleDuplicateExercise: (exerciseToDuplicate: ExerciseBase) => Promise<void>;

    // Add the workouts property
    workouts: {
        // Workouts Tab Data & Handlers
        savedWorkout_workouts: ClientWorkoutDisplay[];
        savedWorkout_error: string | null;
        savedWorkout_successMessage: string | null;
        savedWorkout_setSuccessMessage: (message: string | null) => void;
        savedWorkout_setError: (message: string | null) => void;
        savedWorkout_deleteDialogOpen: boolean;
        savedWorkout_openDeleteDialog: (workoutId: string) => void;
        savedWorkout_handleDeleteWorkout: () => Promise<void>;
        savedWorkout_setDeleteDialogOpen: (isOpen: boolean) => void;
        savedWorkout_workoutToDeleteId: string | null;
        savedWorkout_renameDialogOpen: boolean;
        savedWorkout_openRenameDialog: (workout: ClientWorkoutDisplay) => void;
        savedWorkout_handleRenameWorkout: () => Promise<void>;
        savedWorkout_setRenameDialogOpen: (isOpen: boolean) => void;
        savedWorkout_workoutToRename: ClientWorkoutDisplay | null;
        savedWorkout_newWorkoutName: string;
        savedWorkout_setNewWorkoutName: (name: string) => void;
        savedWorkout_isRenamingWorkoutId: string | null;
        savedWorkout_expandedWorkoutId: string | null;
        savedWorkout_handleToggleExpand: (workoutId: string) => void;
        savedWorkout_allExerciseDefinitions: ApiExerciseDefinition[];
        savedWorkout_exerciseDefinitionMap: Map<string, ApiExerciseDefinition>;
        savedWorkout_addExerciseDialogOpen: boolean;
        savedWorkout_handleOpenAddExerciseDialog: (targetWorkout: ClientWorkoutDisplay) => Promise<void>;
        savedWorkout_handleCloseAddExerciseDialog: () => void;
        savedWorkout_workoutToAddExerciseTo: ClientWorkoutDisplay | null;
        savedWorkout_searchTerm: string;
        savedWorkout_setSearchTerm: (term: string) => void;
        savedWorkout_dialogExerciseList: ApiExerciseDefinition[];
        savedWorkout_isLoadingDialogExercises: boolean;
        savedWorkout_dialogPlanContextError: string | null;
        savedWorkout_planExercises: Array<{
            exerciseId: string;
            definitionId: string;
            definition: ApiExerciseDefinition;
        }>;
        savedWorkout_handleRemoveExercise: (workoutIdToRemoveFrom: string, exerciseIdToRemove: string) => Promise<void>;
        savedWorkout_isRemovingExercise: string | null;
        savedWorkout_selectedExerciseIds: Set<string>;
        savedWorkout_handleToggleExerciseSelection: (exerciseId: string) => void;
        savedWorkout_handleConfirmAddMultipleExercises: () => Promise<void>;
        savedWorkout_isAddingMultipleExercises: boolean;
        savedWorkout_isAddWorkoutDialogOpen: boolean;
        savedWorkout_handleOpenAddWorkoutDialog: () => Promise<void>;
        savedWorkout_handleCloseAddWorkoutDialog: () => void;
        savedWorkout_newWorkoutNameForAdd: string;
        savedWorkout_setNewWorkoutNameForAdd: (name: string) => void;
        savedWorkout_addWorkoutError: string | null;
        savedWorkout_handleConfirmAddNewWorkout: () => Promise<void>;

        // New Workout Dialog exercise selection
        newWorkoutDialog_selectedExerciseIds: Set<string>;
        newWorkoutDialog_planExercises: Array<{
            exerciseId: string;
            definitionId: string;
            definition: ApiExerciseDefinition;
        }>;
        newWorkoutDialog_isLoadingExercises: boolean;
        newWorkoutDialog_errorLoadingExercises: string | null;
        newWorkoutDialog_handleToggleExerciseSelection: (exerciseId: string) => void;
        newWorkoutDialog_searchTerm: string;
        setNewWorkoutDialog_searchTerm: (term: string) => void;

        // Additional workouts-related functions
        fetchSavedWorkoutsForPlan: () => Promise<void>;
        clearMessages: () => void;
    };

    // Shared/General
    loadInitialPageData: () => Promise<void>;
    clearMessages: () => void;
    availableTrainingPlans: ApiTrainingPlan[];
    isLoadingTrainingPlans: boolean;
} 