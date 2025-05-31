import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/client/router';
import type { WeeklyProgressBase } from '@/common/types/training';
import { usePlanExercises } from './usePlanExercises';
import { useSavedWorkoutsData } from './useSavedWorkoutsData';
import { useExerciseSetCompletion } from './useExerciseSetCompletion';
import { useActiveWorkoutSession, EXERCISES_TAB_INDEX, ACTIVE_WORKOUT_TAB_INDEX } from './useActiveWorkoutSession';
import { useExerciseSelection } from './useExerciseSelection';
import { useSavedWorkouts } from '@/client/hooks/useTrainingData';

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

    // Get saved workouts from context
    const { createSavedWorkout } = useSavedWorkouts(planId || '');

    // Create a ref to hold the clearSelections function 
    // that will be defined by useExerciseSelection
    const clearSelectionsRef = useRef(() => { });

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
        useCallback(() => clearSelectionsRef.current(), []),
        planId,             // Pass planId as currentPlanId
        weekNumber,         // Pass weekNumber as currentWeekNumber
        handleSetCompletionUpdate // Pass handleSetCompletionUpdate as onMainSetCompletionUpdate
    );

    // Pass true as the initial selection mode state
    const {
        selectedExercises,
        showSelectionMode,
        selectedExercisesDetails,
        handleExerciseSelect,
        toggleSelectionMode,
        clearSelections,
        // Unused, so commented out or removed
        // handleSelectAll,
    } = useExerciseSelection(
        workoutExercises,
        activeWorkoutSession,
        true // <-- Initialize with selection mode ON
    );

    // Update the clearSelections ref when it changes
    useEffect(() => {
        clearSelectionsRef.current = clearSelections;
    }, [clearSelections]);

    const {
        savedWorkouts,
        isWorkoutsLoading,
        fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,
    } = useSavedWorkoutsData(
        planId,
        workoutExercises
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
                'Workout'
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
            // Ensure planId is available for the workout
            if (!planId) {
                setSaveError("Cannot save workout: Training Plan ID is missing.");
                setIsSavingWorkout(false);
                return;
            }
            await createSavedWorkout({
                name,
                exerciseIds: selectedExercisesDetails.map(ex => ex._id.toString())
            });
            fetchSavedWorkoutStructures();
            clearSelections(); // Clear selection after saving from selection bar
        } catch (err) {
            console.error("Failed to save workout from selection:", err);
            setSaveError(err instanceof Error ? err.message : "Could not save workout");
        } finally {
            setIsSavingWorkout(false);
        }
    }, [
        selectedExercisesDetails,
        clearSelections,
        fetchSavedWorkoutStructures,
        planId,
        createSavedWorkout
    ]);

    const handleSaveActiveSessionAsNewWorkout = useCallback(async (name: string) => {
        if (!activeWorkoutSession || activeWorkoutSession.length === 0) {
            setSaveError("No exercises in the current session to save.");
            return;
        }
        setIsSavingWorkout(true);
        setSaveError(null);
        try {
            // Ensure planId is available for the workout
            if (!planId) {
                setSaveError("Cannot save workout: Training Plan ID is missing.");
                setIsSavingWorkout(false);
                return;
            }
            await createSavedWorkout({
                name,
                exerciseIds: activeWorkoutSession.map(ex => ex._id.toString())
            });
            await fetchSavedWorkoutStructures(); // Refresh saved workouts list
            // Optionally, restart the current session with the new name to reflect its saved state
            // This will also clear the "Save Workout" button condition if it depends on the default name
            // To properly update the UI and potentially the workout ID for progress tracking,
            // we might need to adjust how activeWorkoutSession handles IDs or re-fetch exercise details.
            // For now, just updating the name.
            startActiveWorkout(activeWorkoutSession, name); // Restart with new name
            // No need to call clearSelections() here as it's about the active session not the selection bar
        } catch (err) {
            console.error("Failed to save active session:", err);
            setSaveError(err instanceof Error ? err.message : "Could not save active session");
        } finally {
            setIsSavingWorkout(false);
        }
    }, [
        activeWorkoutSession,
        fetchSavedWorkoutStructures,
        startActiveWorkout,
        planId,
        createSavedWorkout
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
        handleSaveActiveSessionAsNewWorkout,

        // Constants
        EXERCISES_TAB_INDEX,
        WORKOUTS_TAB_INDEX,
        ACTIVE_WORKOUT_TAB_INDEX,

        // Missing property: cancelSelectionMode was renamed to clearSelections
        handleCancelSelectionMode: clearSelections,
    };
}; 