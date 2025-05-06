import { TrainingPlan } from '@/apis/trainingPlans/types';
import { WorkoutExercise } from '@/client/types/workout';
import { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
import { SavedWorkout } from '@/apis/savedWorkouts/types';

// Define enhanced workout type that includes exercises
export interface EnhancedWorkout extends SavedWorkout {
    enhancedExercises: WorkoutExercise[];
    isExpanded: boolean;
    error?: string;
}

export interface WorkoutViewProps {
    planId: string | undefined;
    weekNumber: number;
    planDetails: TrainingPlan | null;
    isLoading: boolean;
    error: string | null;
    workoutExercises: WorkoutExercise[];
    activeExercises: WorkoutExercise[];
    completedExercises: WorkoutExercise[];
    showCompleted: boolean;
    selectedExercises: string[];
    showSelectionMode: boolean;
    progressPercentage: number;
    totalExercises: number;
    completedExercisesCount: number;
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;

    // Actions
    navigate: (path: string) => void;
    handleSetCompletionUpdate: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    handleExerciseSelect: (exerciseId: string) => void;
    handleStartSelectionMode: () => void;
    handleCancelSelectionMode: () => void;
    handleStartWorkout: () => void;
    toggleShowCompleted: () => void;
    handleNavigateWeek: (week: number) => void;
    fetchSavedWorkouts: () => Promise<void>;
    toggleWorkoutExpanded: (workoutId: string) => void;
}

export interface WorkoutExerciseItemProps {
    exercise: WorkoutExercise;
    planId: string;
    weekNumber: number;
    onSetComplete: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    showSelectionMode: boolean;
    selectedExercises: string[];
    handleExerciseSelect: (exerciseId: string) => void;
}

export interface WeekNavigatorProps {
    currentWeek: number;
    maxWeeks: number;
    onNavigate: (week: number) => void;
    isWeekLoading?: boolean;
}

export interface LoadingErrorDisplayProps {
    isLoading: boolean;
    error: string | null;
} 