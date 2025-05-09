import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/client/router';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
import { usePlanExercises } from './usePlanExercises';
import { useSavedWorkoutsData } from './useSavedWorkoutsData';
import { useExerciseSetCompletion } from './useExerciseSetCompletion';
import { useActiveWorkoutSession, EXERCISES_TAB_INDEX, ACTIVE_WORKOUT_TAB_INDEX } from './useActiveWorkoutSession';
import { useExerciseSelection } from './useExerciseSelection';
import { createSavedWorkout } from '@/apis/savedWorkouts/client';

// Tab indices constants
const WORKOUTS_TAB_INDEX = 1;

export const useWorkoutView = () => {
    const { routeParams, navigate } = useRouter();
    const initialPlanId = routeParams.planId as string | undefined;
    const initialWeekNumber = parseInt(routeParams.weekNumber as string || '1', 10);

    const [activeTab, setActiveTabState] = useState(EXERCISES_TAB_INDEX);
    const [isSavingWorkout, setIsSavingWorkout] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showCompletedExercises, setShowCompletedExercises] = useState(false);

    const {
        planId,
        weekNumber,
        planDetails,
        workoutExercises,
        isLoading,
        error,
        handleSetCompletionUpdate,
        activePlanExercises,
        completedPlanExercises,
        progressPercentage,
        totalExercises,
        completedExercisesCount,
        completedSetsCount,
        totalSetsCount,
        setPlanId,
    } = usePlanExercises(initialPlanId, initialWeekNumber);

    const {
        selectedExercises,
        showSelectionMode,
        selectedExercisesDetails,
        handleExerciseSelect,
        toggleSelectionMode,
        clearSelections,
    } = useExerciseSelection(
        workoutExercises,
        null // Will be updated with activeWorkoutSession later
    );

    const {
        activeWorkoutSession,
        activeWorkoutName,
        startActiveWorkout,
        onIncrementActiveSet,
        onDecrementActiveSet,
        onEndActiveWorkout,
        onRemoveExerciseFromActiveSession,
    } = useActiveWorkoutSession(
        setActiveTabState,
        clearSelections // Pass clearSelections as onWorkoutStart
    );

    const {
        savedWorkouts,
        isWorkoutsLoading,
        fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,
    } = useSavedWorkoutsData(
        planId,
        workoutExercises,
        handleSetCompletionUpdate
    );

    const {
        isUpdating: isUpdatingSet,
        handleSetCheckboxClick: completeSet,
        handleCompleteAllSets: uncompleteSet
    } = useExerciseSetCompletion(
        planId || '',
        weekNumber,
        handleSetCompletionUpdate
    );

    // If planId from router changes and is different from current, update it.
    useEffect(() => {
        const routerPlanId = routeParams.planId as string | undefined;
        if (routerPlanId && routerPlanId !== planId) {
            setPlanId(routerPlanId);
        }
    }, [routeParams.planId, planId, setPlanId]);

    const toggleShowCompleted = useCallback(() => {
        setShowCompletedExercises(prev => !prev);
    }, []);

    const handleStartWorkout = useCallback(() => {
        if (selectedExercisesDetails.length > 0) {
            startActiveWorkout(
                selectedExercisesDetails,
                'Selected Workout'
            );
        }
    }, [selectedExercisesDetails, startActiveWorkout]);

    const handleTabChange = useCallback((eventOrNewValue: React.SyntheticEvent | number, newValue?: number) => {
        if (typeof eventOrNewValue === 'number') {
            setActiveTabState(eventOrNewValue);
        } else if (newValue !== undefined) {
            setActiveTabState(newValue);
        }
    }, []);

    const handleNavigateWeek = useCallback((week: number) => {
        if (week >= 1 && week <= (planDetails?.durationWeeks || 1)) {
            navigate(`/workout/${planId}/${week}`);
        }
    }, [planId, planDetails, navigate]);

    const handleSavedWorkoutExerciseSetCompletionUpdate = useCallback((
        workoutId: string,
        exerciseId: string,
        updatedProgress: WeeklyProgressBase
    ) => {
        handleSetCompletionUpdate(exerciseId, updatedProgress);
    }, [handleSetCompletionUpdate]);

    const handleSaveWorkout = useCallback(async (name: string) => {
        if (selectedExercisesDetails.length === 0) {
            setSaveError("No exercises selected to save.");
            return;
        }
        setIsSavingWorkout(true);
        setSaveError(null);
        try {
            await createSavedWorkout({
                name,
                exerciseIds: selectedExercisesDetails.map(ex => ex._id.toString()),
            });
            // Optionally, refresh saved workouts list or give feedback
            fetchSavedWorkoutStructures(); // Refresh the list of saved workouts
            clearSelections(); // Clear selection after saving
        } catch (err) {
            console.error("Failed to save workout:", err);
            setSaveError(err instanceof Error ? err.message : "Could not save workout");
        } finally {
            setIsSavingWorkout(false);
        }
    }, [
        selectedExercisesDetails,
        clearSelections,
        fetchSavedWorkoutStructures
    ]);

    return {
        // From planExercisesHook
        planId,
        weekNumber,
        planDetails,
        workoutExercises,
        isLoading,
        error,

        // From exerciseSelectionHook with renamed properties
        selectedExercises,
        showSelectionMode,
        handleExerciseSelect,
        handleStartSelectionMode: toggleSelectionMode,

        // From activeWorkoutSessionHook
        activeWorkoutSession,
        activeWorkoutName,
        startActiveWorkout,
        onIncrementActiveSet,
        onDecrementActiveSet,
        onEndActiveWorkout,
        onRemoveExerciseFromActiveSession,

        // From savedWorkoutsHook with renamed properties
        savedWorkouts,
        isWorkoutsLoading,
        fetchSavedWorkouts: fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,

        // Adjusted names to match expected props
        activeExercises: activePlanExercises,
        completedExercises: completedPlanExercises,
        progressPercentage,
        totalExercises,
        completedExercisesCount,
        completedSetsCount,
        totalSetsCount,

        // Other renamed props
        showCompleted: showCompletedExercises,
        handleSetCompletionUpdate,
        handleSavedWorkoutExerciseSetCompletionUpdate,

        // Tab management
        activeTab,
        handleTabChange,

        // Navigation and UI actions
        navigate,
        toggleShowCompleted,
        handleNavigateWeek,

        // Workout management
        handleStartWorkout,

        // Additional props
        completeSet,
        uncompleteSet,
        isUpdatingSet,
        isSavingWorkout,
        saveError,
        handleSaveWorkout,

        // Constants
        EXERCISES_TAB_INDEX,
        WORKOUTS_TAB_INDEX,
        ACTIVE_WORKOUT_TAB_INDEX,

        // Missing property: cancelSelectionMode was renamed to clearSelections
        handleCancelSelectionMode: clearSelections,
    };
}; 