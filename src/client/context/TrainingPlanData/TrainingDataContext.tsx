import { createContext } from 'react';
import {
    TrainingPlan,
    ExerciseBase,
    WeeklyProgressBase,
    SavedWorkout,
    CreateTrainingPlanRequest,
    UpdateTrainingPlanRequest,
    AddExerciseRequest,
    UpdateExerciseRequest,
    CreateSavedWorkoutRequest
} from '@/common/types/training';

// Single state object containing all training data
interface TrainingDataState {
    trainingPlans: TrainingPlan[];
    activePlanId: string | null;

    // Plan-specific data loaded on-demand and cached by planId
    planData: Record<string, {
        exercises: ExerciseBase[];
        weeklyProgress: Record<number, WeeklyProgressBase[]>; // keyed by weekNumber
        savedWorkouts: SavedWorkout[];
        isLoaded: boolean;
        isLoading: boolean;
    }>;

    isInitialLoading: boolean; // App startup data loading (training plans only)
    error: string | null; // Single global error state
}

// Context interface with single state + update function
interface TrainingDataContextType {
    state: TrainingDataState;
    updateState: (newState: Partial<TrainingDataState>) => void;
    isLoadingFromServer: boolean;

    // Action functions that use updateState internally
    loadTrainingPlans: () => Promise<void>;
    createTrainingPlan: (plan: CreateTrainingPlanRequest) => Promise<TrainingPlan>;
    updateTrainingPlan: (planId: string, updates: UpdateTrainingPlanRequest) => Promise<void>;
    deleteTrainingPlan: (planId: string) => Promise<void>;
    duplicateTrainingPlan: (planId: string) => Promise<void>;
    setActiveTrainingPlan: (planId: string) => Promise<void>;

    // Plan data loading - loads on-demand and caches
    loadPlanData: (planId: string) => Promise<void>;
    loadExercises: (planId: string) => Promise<void>;
    createExercise: (planId: string, exercise: AddExerciseRequest) => Promise<void>;
    updateExercise: (planId: string, exerciseId: string, updates: UpdateExerciseRequest) => Promise<void>;
    deleteExercise: (planId: string, exerciseId: string) => Promise<void>;

    loadWeeklyProgress: (planId: string, weekNumber: number) => Promise<void>;
    updateSetCompletion: (planId: string, weekNumber: number, exerciseId: string, setsIncrement: number, totalSetsForExercise: number, completeAll?: boolean) => Promise<WeeklyProgressBase>;

    loadSavedWorkouts: (planId: string) => Promise<void>;
    createSavedWorkout: (planId: string, workout: CreateSavedWorkoutRequest) => Promise<void>;
    updateSavedWorkout: (planId: string, workoutId: string, updates: Partial<SavedWorkout>) => Promise<void>;
    deleteSavedWorkout: (planId: string, workoutId: string) => Promise<void>;
}

// Create context with undefined default
const TrainingDataContext = createContext<TrainingDataContextType | undefined>(undefined);

// Export context for provider
export { TrainingDataContext };
export type { TrainingDataState, TrainingDataContextType }; 