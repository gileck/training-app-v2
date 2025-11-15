import { WorkoutExercise } from '../../../types/workout';
import { WeeklyProgressBase } from '../../../../apis/weeklyProgress/types';

// Local definition as it's not exported from the common file
export interface WorkoutDetails {
    name?: string;
    durationWeeks: number;
}

// Local definition as it's not exported from the common file
export interface EnhancedWorkout {
    _id: string | { toString(): string };
    name: string;
    isExpanded: boolean;
    enhancedExercises: WorkoutExercise[];
    error?: string;
}

export interface LoadingErrorDisplayProps {
    isLoading: boolean;
    error: string | null | undefined;
    progressPercentage: number;
    totalExercises: number;
    completedExercisesCount: number;
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;
}

export interface WorkoutViewProps {
    planId?: string;
    weekNumber: number;
    planDetails: WorkoutDetails | null;
    isLoading: boolean;
    error: string | null;
    activeExercises: WorkoutExercise[];
    completedExercises: WorkoutExercise[];
    showCompleted: boolean;
    selectedExercises: string[];
    showSelectionMode: boolean;
    progressPercentage: number;
    totalExercises: number;
    completedExercisesCount: number;
    completedSetsCount: number;
    totalSetsCount: number;
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;

    // New props for active workout session
    activeWorkoutSession: WorkoutExercise[] | null;
    activeWorkoutName: string | null;

    // Tab state and handler from hook
    activeTab: number;
    handleTabChange: (eventOrNewValue: React.SyntheticEvent | number, newValue?: number) => void;

    // Callbacks for active workout exercise manipulation
    onIncrementActiveSet: (exerciseId: string) => void;
    onDecrementActiveSet: (exerciseId: string) => void;
    onEndActiveWorkout: () => void;
    onRemoveExerciseFromActiveSession: (exerciseId: string) => void;

    navigate: (path: string) => void;
    handleSetCompletionUpdate: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    handleSavedWorkoutExerciseSetCompletionUpdate: (workoutId: string, exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    handleExerciseSelect: (exerciseId: string) => void;
    handleStartSelectionMode: () => void;
    handleStartWorkout: () => void;
    startActiveWorkout: (exercises: WorkoutExercise[], name?: string) => void;
    toggleShowCompleted: () => void;
    handleNavigateWeek: (week: number) => void;
    fetchSavedWorkouts: () => void;
    toggleWorkoutExpanded: (workoutId: string) => void;
}

export interface WorkoutExerciseItemProps {
    exercise: WorkoutExercise;
    planId: string;
    weekNumber: number;
    onSetComplete: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    showSelectionMode?: boolean;
    selectedExercises: string[];
    handleExerciseSelect?: (exerciseId: string) => void;
}

export interface WeekNavigatorProps {
    currentWeek: number;
    maxWeeks: number;
    onNavigate: (week: number) => void;
    isWeekLoading?: boolean;
}

export interface MainTabsProps {
    activeTab: number;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    // Props for ExerciseTabContent
    planId: string;
    weekNumber: number;
    activeExercises: WorkoutExercise[];
    completedExercises: WorkoutExercise[];
    showCompleted: boolean;
    selectedExercises: string[];
    showSelectionMode: boolean;
    handleSetCompletionUpdate: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    handleExerciseSelect: (exerciseId: string) => void;
    toggleShowCompleted: () => void;
    // Props for WorkoutTabContent
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;
    toggleWorkoutExpanded: (workoutId: string) => void;
    handleSavedWorkoutExerciseSetCompletionUpdate: (workoutId: string, exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    startActiveWorkout: (exercises: WorkoutExercise[], name?: string) => void;
}

export interface ExerciseTabContentProps {
    planId: string;
    weekNumber: number;
    activeExercises: WorkoutExercise[];
    completedExercises: WorkoutExercise[];
    showCompleted: boolean;
    selectedExercises: string[];
    showSelectionMode: boolean;
    isLoading?: boolean;
    handleSetCompletionUpdate: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    handleExerciseSelect: (exerciseId: string) => void;
    toggleShowCompleted: () => void;
    viewMode?: 'detailed' | 'compact';
}

export interface WorkoutTabContentProps {
    planId: string;
    weekNumber: number;
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;
    toggleWorkoutExpanded: (workoutId: string) => void;
    handleSavedWorkoutExerciseSetCompletionUpdate: (workoutId: string, exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    startActiveWorkout: (exercises: WorkoutExercise[], name?: string) => void;
    viewMode?: 'detailed' | 'compact';
}

export interface SelectedExercisesBarProps {
    selectedExercises: string[];
    activeTab: number; // To ensure it only shows on the exercises tab
    handleStartWorkout: () => void;
} 