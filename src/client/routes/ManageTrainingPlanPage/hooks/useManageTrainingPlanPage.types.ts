import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan as ApiTrainingPlan, TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition as ApiExerciseDefinitionMPE, ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { ClientWorkoutDisplay } from '../types';

export interface UseManageTrainingPlanPageReturn {
    planId: string | undefined;
    navigate: (path: string, options?: { replace?: boolean }) => void;
    currentTab: number;
    setCurrentTab: React.Dispatch<React.SetStateAction<number>>;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    isPageLoading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;

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
    handleDetailsDialogSave: (exerciseData: ExerciseBase) => void;
    handleDetailsDialogClose: () => void;
    isConfirmDeleteExerciseDialogOpen: boolean;
    exercisePendingDeletion: ExerciseBase | null;
    handleRequestDeleteExercise: (exercise: ExerciseBase) => void;
    handleConfirmDeleteExerciseDialogClose: () => void;
    executeDeleteExercise: () => Promise<void>;
    handleDuplicateExercise: (exerciseToDuplicate: ExerciseBase) => Promise<void>;

    // Saved Workouts Tab Data & Handlers
    savedWorkout_workouts: ClientWorkoutDisplay[];
    savedWorkout_error: string | null;
    savedWorkout_successMessage: string | null;
    savedWorkout_setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
    savedWorkout_setError: React.Dispatch<React.SetStateAction<string | null>>;
    savedWorkout_deleteDialogOpen: boolean;
    savedWorkout_openDeleteDialog: (workoutId: string) => void;
    savedWorkout_handleDeleteWorkout: () => Promise<void>;
    savedWorkout_setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    savedWorkout_workoutToDeleteId: string | null;
    savedWorkout_renameDialogOpen: boolean;
    savedWorkout_openRenameDialog: (workout: ClientWorkoutDisplay) => void;
    savedWorkout_handleRenameWorkout: () => Promise<void>;
    savedWorkout_setRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    savedWorkout_workoutToRename: ClientWorkoutDisplay | null;
    savedWorkout_newWorkoutName: string;
    savedWorkout_setNewWorkoutName: React.Dispatch<React.SetStateAction<string>>;
    savedWorkout_isRenamingWorkoutId: string | null;
    savedWorkout_expandedWorkoutId: string | null;
    savedWorkout_handleToggleExpand: (workoutId: string) => void;
    savedWorkout_allExerciseDefinitions: ApiExerciseDefinition[];
    savedWorkout_exerciseDefinitionMap: Map<string, ApiExerciseDefinition>;
    savedWorkout_addExerciseDialogOpen: boolean;
    savedWorkout_handleOpenAddExerciseDialog: (workout: ClientWorkoutDisplay) => void;
    savedWorkout_handleCloseAddExerciseDialog: () => void;
    savedWorkout_workoutToAddExerciseTo: ClientWorkoutDisplay | null;
    savedWorkout_searchTerm: string;
    savedWorkout_setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    savedWorkout_dialogExerciseList: ApiExerciseDefinition[];
    savedWorkout_isLoadingDialogExercises: boolean;
    savedWorkout_dialogPlanContextError: string | null;
    savedWorkout_filteredDefinitionsForDialog: ApiExerciseDefinition[];
    savedWorkout_handleConfirmAddExercise: (definitionToAdd: ApiExerciseDefinition) => Promise<void>;
    savedWorkout_isAddingSingleExercise: boolean;
    savedWorkout_handleRemoveExercise: (workoutIdToRemoveFrom: string, exerciseDefIdToRemove: string) => Promise<void>;
    savedWorkout_isRemovingExercise: string | null; 
    savedWorkout_isAddWorkoutDialogOpen: boolean;
    savedWorkout_handleOpenAddWorkoutDialog: () => void;
    savedWorkout_handleCloseAddWorkoutDialog: () => void;
    savedWorkout_newWorkoutNameForAdd: string;
    savedWorkout_setNewWorkoutNameForAdd: React.Dispatch<React.SetStateAction<string>>;
    savedWorkout_addWorkoutError: string | null;
    savedWorkout_handleConfirmAddNewWorkout: () => Promise<void>;

    // Shared/General
    loadInitialPageData: () => Promise<void>;
    clearMessages: () => void;
    availableTrainingPlans: ApiTrainingPlan[];
    isLoadingTrainingPlans: boolean;
} 