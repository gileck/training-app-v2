import React, { useContext } from 'react';
import { TrainingDataContext } from '@/client/context/TrainingPlanData';
import {
    TrainingPlan,
    SavedWorkout,
    AddExerciseRequest,
    UpdateExerciseRequest
} from '@/common/types/training';

export const useTrainingData = () => {
    const context = useContext(TrainingDataContext);
    if (!context) {
        throw new Error('useTrainingData must be used within TrainingDataProvider');
    }
    return context;
};

// Specialized hooks for convenience (same single state, different access patterns)
export const useTrainingPlans = () => {
    const { state, loadTrainingPlans, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan, duplicateTrainingPlan, setActiveTrainingPlan } = useTrainingData();
    const activeTrainingPlan = state.trainingPlans.find((plan: TrainingPlan) => plan._id === state.activePlanId) || null;

    return {
        trainingPlans: state.trainingPlans,
        activeTrainingPlan,
        activePlanId: state.activePlanId,
        isLoading: state.isInitialLoading,
        error: state.error,
        loadTrainingPlans,
        createTrainingPlan,
        updateTrainingPlan,
        deleteTrainingPlan,
        duplicateTrainingPlan,
        setActiveTrainingPlan
    };
};

export const useExercises = (planId: string) => {
    const { state, loadPlanData, loadExercises, createExercise, updateExercise, deleteExercise } = useTrainingData();

    // Auto-load plan data if not loaded (but not during initial loading)
    React.useEffect(() => {
        if (planId && !state.isInitialLoading && !state.planData[planId]?.isLoaded && !state.planData[planId]?.isLoading) {
            loadPlanData(planId);
        }
    }, [planId, state.isInitialLoading, state.planData[planId]?.isLoaded, state.planData[planId]?.isLoading]);

    const planData = state.planData[planId] || { exercises: [], isLoaded: false, isLoading: false };

    // During initial loading, show loading state even if plan data isn't loaded yet
    const isLoading = state.isInitialLoading || planData.isLoading;
    const isLoaded = !state.isInitialLoading && planData.isLoaded;

    return React.useMemo(() => ({
        exercises: planData.exercises,
        isLoading,
        isLoaded,
        error: state.error,
        loadExercises: () => loadExercises(planId),
        createExercise: (exercise: AddExerciseRequest) => createExercise(planId, exercise),
        updateExercise: (exerciseId: string, updates: UpdateExerciseRequest) => updateExercise(planId, exerciseId, updates),
        deleteExercise: (exerciseId: string) => deleteExercise(planId, exerciseId)
    }), [planData.exercises, isLoading, isLoaded, state.error, loadExercises, createExercise, updateExercise, deleteExercise, planId]);
};

export const useWeeklyProgress = (planId: string, weekNumber: number) => {
    const { state, loadPlanData, loadWeeklyProgress, updateSetCompletion } = useTrainingData();

    // Auto-load plan data if not loaded (but not during initial loading)
    React.useEffect(() => {
        if (planId && !state.isInitialLoading && !state.planData[planId]?.isLoaded && !state.planData[planId]?.isLoading) {
            loadPlanData(planId);
        }
    }, [planId, state.isInitialLoading, state.planData[planId]?.isLoaded, state.planData[planId]?.isLoading]);

    const planData = state.planData[planId] || { weeklyProgress: {}, isLoaded: false, isLoading: false };

    // During initial loading, show loading state even if plan data isn't loaded yet
    const isLoading = state.isInitialLoading || planData.isLoading;
    const isLoaded = !state.isInitialLoading && planData.isLoaded;

    return React.useMemo(() => ({
        progress: planData.weeklyProgress[weekNumber] || [],
        isLoading,
        isLoaded,
        error: state.error,
        loadProgress: () => loadWeeklyProgress(planId, weekNumber),
        updateSetCompletion: (exerciseId: string, setsIncrement: number, totalSetsForExercise: number, completeAll?: boolean) =>
            updateSetCompletion(planId, weekNumber, exerciseId, setsIncrement, totalSetsForExercise, completeAll)
    }), [planData.weeklyProgress, weekNumber, isLoading, isLoaded, state.error, loadWeeklyProgress, updateSetCompletion, planId]);
};

/**
 * Hook to access saved workouts for a specific training plan.
 * 
 * AUTO-LOADING BEHAVIOR:
 * - Automatically triggers loadPlanData() if data isn't loaded
 * - Checks both isLoaded and isLoading flags to prevent duplicate fetches
 * - Works correctly after cache fix (cached data marked as stale)
 * 
 * WHY IT WORKS NOW:
 * - On page load, cached data is marked as isLoaded: false (see useTrainingDataHooks.ts)
 * - This hook sees isLoaded: false and triggers loadPlanData()
 * - loadPlanData() fetches fresh data from server
 * - Before the fix, cached data had isLoaded: true which prevented fetching
 * 
 * RETURN VALUE:
 * - savedWorkouts: Array of workouts from state (cached or fresh)
 * - isLoading: True during initial load or data fetch
 * - isLoaded: True after data successfully loaded
 * - error: Any error that occurred during loading
 * - Helper functions: load, create, update, delete operations
 * 
 * See: docs/data-caching-and-persistence.md for complete flow
 */
export const useSavedWorkouts = (planId: string) => {
    const { state, loadPlanData, loadSavedWorkouts, createSavedWorkout, updateSavedWorkout, deleteSavedWorkout } = useTrainingData();

    // Auto-load plan data if not loaded
    // This is where the cache fix is critical - cached data must be marked as isLoaded: false
    React.useEffect(() => {
        if (planId && !state.planData[planId]?.isLoaded && !state.planData[planId]?.isLoading) {
            loadPlanData(planId); // Triggers server fetch for fresh data
        }
    }, [planId, loadPlanData]);

    const planData = state.planData[planId] || { savedWorkouts: [], isLoaded: false, isLoading: false };

    return {
        savedWorkouts: planData.savedWorkouts,
        isLoading: planData.isLoading || state.isInitialLoading,
        isLoaded: planData.isLoaded,
        error: state.error,
        loadSavedWorkouts: () => loadSavedWorkouts(planId),
        // Wrapper that adds trainingPlanId to the request before calling context function
        createSavedWorkout: (workout: { name: string; exerciseIds: string[] }) =>
            createSavedWorkout(planId, { ...workout, trainingPlanId: planId }),
        updateSavedWorkout: (workoutId: string, updates: Partial<SavedWorkout>) =>
            updateSavedWorkout(planId, workoutId, updates),
        deleteSavedWorkout: (workoutId: string) => deleteSavedWorkout(planId, workoutId)
    };
}; 