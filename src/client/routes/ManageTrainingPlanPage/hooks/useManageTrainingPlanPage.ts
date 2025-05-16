import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from '@/client/router';
import { createDefinitionMapMPE } from '../utils/definitions';
import { useWorkoutHooks } from './useWorkoutHooks';
import { useExerciseHooks } from './useExerciseHooks';
import { usePlanDataHooks } from './usePlanDataHooks';
import { usePageHooks } from './usePageHooks';
import type { ExerciseBase } from '@/apis/exercises/types';

export const useManageTrainingPlanPage = () => {
    const router = useRouter();
    const { routeParams } = router;
    const planId = routeParams.planId as string | undefined;

    // Initialize hooks in proper order to avoid circular dependencies
    const page = usePageHooks(planId, router);
    const planData = usePlanDataHooks(planId);
    const exerciseHooks = useExerciseHooks(planId);

    // Memoize exercise definitions and exercises array to prevent recreation
    const exerciseDefinitions = useMemo(() => exerciseHooks.definitions, [exerciseHooks.definitions]);
    const exercises = useMemo(() => exerciseHooks.exercises, [exerciseHooks.exercises]);

    // Create workoutHooks after memoizing exercise values
    const workoutHooks = useWorkoutHooks(
        planId,
        exerciseDefinitions,
        exercises
    );

    // Create stable functions with minimal dependency arrays
    const pageActions = useMemo(() => ({
        setError: page.setError,
        setIsPageLoading: page.setIsPageLoading,
        clearMessages: page.clearMessages,
    }), [page.setError, page.setIsPageLoading, page.clearMessages]);

    const planDataActions = useMemo(() => ({
        fetchAvailableTrainingPlans: planData.fetchAvailableTrainingPlans,
        fetchPlanDetails: planData.fetchPlanDetails,
    }), [planData.fetchAvailableTrainingPlans, planData.fetchPlanDetails]);

    const planDataState = useMemo(() => ({
        availableTrainingPlans: planData.availableTrainingPlans,
        isLoadingTrainingPlans: planData.isLoadingTrainingPlans,
        error: planData.error,
    }), [
        planData.availableTrainingPlans,
        planData.isLoadingTrainingPlans,
        planData.error
    ]);

    const exerciseActions = useMemo(() => ({
        fetchExercisesTabData: exerciseHooks.fetchExercisesTabData,
        handleDetailsDialogSave: exerciseHooks.handleDetailsDialogSave,
        executeDeleteExercise: exerciseHooks.executeDeleteExercise,
        handleDuplicateExercise: exerciseHooks.handleDuplicateExercise,
    }), [
        exerciseHooks.fetchExercisesTabData,
        exerciseHooks.handleDetailsDialogSave,
        exerciseHooks.executeDeleteExercise,
        exerciseHooks.handleDuplicateExercise
    ]);

    const workoutActions = useMemo(() => ({
        fetchSavedWorkoutsForPlan: workoutHooks.fetchSavedWorkoutsForPlan,
        clearMessages: workoutHooks.clearMessages,
    }), [workoutHooks.fetchSavedWorkoutsForPlan, workoutHooks.clearMessages]);

    // Create loadInitialPageData with stable dependencies only
    const loadInitialPageData = useCallback(async () => {
        if (!planId) {
            pageActions.setError("Training Plan ID missing from route parameters.");
            pageActions.setIsPageLoading(false);
            return;
        }

        pageActions.setIsPageLoading(true);
        pageActions.setError(null);

        try {
            if (planDataState.availableTrainingPlans.length === 0 && !planDataState.isLoadingTrainingPlans) {
                planDataActions.fetchAvailableTrainingPlans();
            }

            // Execute all data loading operations in parallel
            await Promise.all([
                planDataActions.fetchPlanDetails(),
                exerciseActions.fetchExercisesTabData(),
                workoutActions.fetchSavedWorkoutsForPlan()
            ]);

        } catch (pageLoadError) {
            console.error("Critical error during initial page data load:", pageLoadError);
            pageActions.setError(
                pageLoadError instanceof Error
                    ? pageLoadError.message
                    : "Failed to load all page data."
            );
        } finally {
            pageActions.setIsPageLoading(false);
        }
    }, [
        planId,
        pageActions,
        planDataState,
        planDataActions,
        exerciseActions,
        workoutActions
    ]);

    // Trigger initial data load
    useEffect(() => {
        if (planId) {
            loadInitialPageData();
        } else if (routeParams && !planId) {
            pageActions.setError("Training Plan ID missing from route parameters.");
            pageActions.setIsPageLoading(false);
        }
    }, [planId, routeParams, pageActions, loadInitialPageData]);

    // Create computed values with minimal dependencies
    const definitionsMapMPE = useMemo(() =>
        createDefinitionMapMPE(exerciseDefinitions), [exerciseDefinitions]);

    const existingExerciseDefinitionIdsInPlan = useMemo(() =>
        exercises.map(ex => ex.exerciseDefinitionId.toString()), [exercises]);

    // Setup message clearing
    const clearMessages = useCallback(() => {
        pageActions.clearMessages(() => {
            workoutActions.clearMessages();
        });
    }, [pageActions, workoutActions]);

    // Enhanced exercise hooks that use loadInitialPageData
    const enhancedExerciseHooks = useMemo(() => ({
        ...exerciseHooks,
        handleDetailsDialogSave: async (exerciseData: ExerciseBase) => {
            await exerciseActions.handleDetailsDialogSave(exerciseData);
            await loadInitialPageData();
        },
        executeDeleteExercise: async () => {
            await exerciseActions.executeDeleteExercise(loadInitialPageData);
        },
        handleDuplicateExercise: async (exercise: ExerciseBase) => {
            await exerciseActions.handleDuplicateExercise(exercise, loadInitialPageData);
        }
    }), [exerciseHooks, exerciseActions, loadInitialPageData]);

    // Enhanced workout hooks
    const enhancedWorkoutHooks = useMemo(() => ({
        ...workoutHooks,
        fetchSavedWorkoutsForPlan: async () => {
            await workoutActions.fetchSavedWorkoutsForPlan();
        }
    }), [workoutHooks, workoutActions]);

    return {
        planId,
        router,
        page,
        planData,
        exerciseHooks: enhancedExerciseHooks,
        workoutHooks: enhancedWorkoutHooks,
        definitionsMapMPE,
        existingExerciseDefinitionIdsInPlan,
        loadInitialPageData,
        clearMessages
    };
}; 