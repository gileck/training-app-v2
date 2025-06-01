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

export const useSavedWorkouts = (planId: string) => {
    const { state, loadPlanData, loadSavedWorkouts, createSavedWorkout, updateSavedWorkout, deleteSavedWorkout } = useTrainingData();

    // Auto-load plan data if not loaded
    React.useEffect(() => {
        if (planId && !state.planData[planId]?.isLoaded && !state.planData[planId]?.isLoading) {
            loadPlanData(planId);
        }
    }, [planId, loadPlanData]);

    const planData = state.planData[planId] || { savedWorkouts: [], isLoaded: false, isLoading: false };

    return {
        savedWorkouts: planData.savedWorkouts,
        isLoading: planData.isLoading || state.isInitialLoading,
        isLoaded: planData.isLoaded,
        error: state.error,
        loadSavedWorkouts: () => loadSavedWorkouts(planId),
        createSavedWorkout: (workout: { name: string; exerciseIds: string[] }) =>
            createSavedWorkout(planId, { ...workout, trainingPlanId: planId }),
        updateSavedWorkout: (workoutId: string, updates: Partial<SavedWorkout>) =>
            updateSavedWorkout(planId, workoutId, updates),
        deleteSavedWorkout: (workoutId: string) => deleteSavedWorkout(planId, workoutId)
    };
}; 