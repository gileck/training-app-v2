import { useCallback } from 'react';
import { TrainingDataState } from '../TrainingDataContext';
import { AddExerciseRequest, UpdateExerciseRequest } from '@/common/types/training';
import {
    getExercises,
    addExercise as apiAddExercise,
    updateExercise as apiUpdateExercise,
    deleteExercise as apiDeleteExercise
} from '@/apis/exercises/client';

export const useExerciseHooks = (
    state: TrainingDataState,
    updateState: (newState: Partial<TrainingDataState>) => void,
    updateStateAndSave: (newState: Partial<TrainingDataState>) => void
) => {
    const loadExercises = useCallback(async (planId: string) => {
        const existing = state.planData[planId];
        if (existing?.isLoaded) {
            return;
        }

        try {
            const response = await getExercises({ trainingPlanId: planId });
            const exercises = response.data || [];

            const currentPlanData = state.planData[planId];
            updateStateAndSave({
                planData: {
                    ...state.planData,
                    [planId]: {
                        ...currentPlanData,
                        exercises,
                        isLoaded: true,
                        isLoading: false
                    }
                }
            });
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load exercises'
            });
        }
    }, [state.planData, updateState, updateStateAndSave]);

    const createExercise = useCallback(async (planId: string, exercise: AddExerciseRequest) => {
        try {
            updateState({ error: null });
            const response = await apiAddExercise(exercise);

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                exercises: [...currentPlanData.exercises, response.data]
                            }
                        }
                    });
                }
            } else {
                updateState({ error: 'Failed to create exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create exercise'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    const updateExercise = useCallback(async (planId: string, exerciseId: string, updates: UpdateExerciseRequest) => {
        try {
            updateState({ error: null });
            const response = await apiUpdateExercise(updates);

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                exercises: currentPlanData.exercises.map(ex =>
                                    ex._id === exerciseId ? response.data! : ex
                                )
                            }
                        }
                    });
                }
            } else {
                updateState({ error: 'Failed to update exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update exercise'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    const deleteExercise = useCallback(async (planId: string, exerciseId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteExercise({ exerciseId, trainingPlanId: planId });

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                exercises: currentPlanData.exercises.filter(ex => ex._id !== exerciseId)
                            }
                        }
                    });
                }
            } else {
                updateState({ error: 'Failed to delete exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete exercise'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    return {
        loadExercises,
        createExercise,
        updateExercise,
        deleteExercise
    };
}; 