import { useCallback } from 'react';
import { TrainingDataState } from '../TrainingDataContext';
import { CreateSavedWorkoutRequest, SavedWorkout } from '@/common/types/training';
import {
    getAllSavedWorkouts as getSavedWorkouts,
    createSavedWorkout as apiCreateSavedWorkout,
    deleteSavedWorkout as apiDeleteSavedWorkout,
    renameSavedWorkout as apiRenameSavedWorkout
} from '@/apis/savedWorkouts/client';

export const useSavedWorkoutHooks = (
    state: TrainingDataState,
    updateState: (newState: Partial<TrainingDataState>) => void,
    updateStateAndSave: (newState: Partial<TrainingDataState>) => void
) => {
    const loadSavedWorkouts = useCallback(async (planId: string) => {
        const existing = state.planData[planId];
        if (existing?.isLoaded) {
            return;
        }

        try {
            const response = await getSavedWorkouts({ trainingPlanId: planId });
            const savedWorkouts = response.data || [];

            const currentPlanData = state.planData[planId];
            updateStateAndSave({
                planData: {
                    ...state.planData,
                    [planId]: {
                        ...currentPlanData,
                        savedWorkouts,
                        isLoaded: true,
                        isLoading: false
                    }
                }
            });
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load saved workouts'
            });
        }
    }, [state.planData, updateState, updateStateAndSave]);

    const createSavedWorkout = useCallback(async (planId: string, workout: CreateSavedWorkoutRequest) => {
        try {
            updateState({ error: null });
            const response = await apiCreateSavedWorkout(workout);

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                savedWorkouts: [...currentPlanData.savedWorkouts, response.data]
                            }
                        }
                    });
                }
            } else {
                updateState({ error: 'Failed to create saved workout' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create saved workout'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    const updateSavedWorkout = useCallback(async (planId: string, workoutId: string, updates: Partial<SavedWorkout>) => {
        try {
            updateState({ error: null });

            if (updates.name !== undefined) {
                const response = await apiRenameSavedWorkout({ workoutId, newName: updates.name });

                if (response.data && !('error' in response.data)) {
                    const currentPlanData = state.planData[planId];
                    if (currentPlanData) {
                        updateStateAndSave({
                            planData: {
                                ...state.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    savedWorkouts: currentPlanData.savedWorkouts.map(w =>
                                        w._id === workoutId ? response.data as SavedWorkout : w
                                    )
                                }
                            }
                        });
                    }
                } else {
                    const errorMessage = 'error' in response.data! ? response.data.error : 'Failed to rename saved workout';
                    updateState({ error: errorMessage });
                }
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update saved workout'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    const deleteSavedWorkout = useCallback(async (planId: string, workoutId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteSavedWorkout({ workoutId });

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                savedWorkouts: currentPlanData.savedWorkouts.filter(w => w._id !== workoutId)
                            }
                        }
                    });
                }
            } else {
                updateState({ error: 'Failed to delete saved workout' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete saved workout'
            });
        }
    }, [updateState, updateStateAndSave, state.planData]);

    return {
        loadSavedWorkouts,
        createSavedWorkout,
        updateSavedWorkout,
        deleteSavedWorkout
    };
}; 