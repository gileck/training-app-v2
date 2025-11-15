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

    /**
     * Create a new saved workout and persist it to the server and localStorage.
     * 
     * FLOW:
     * 1. Call server API to create workout in MongoDB
     * 2. Receive created workout with _id from server
     * 3. Optimistically update local state with new workout
     * 4. Save updated state to localStorage for persistence
     * 
     * EDGE CASE HANDLING:
     * - If planData doesn't exist yet (new plan or cleared cache):
     *   * Initialize planData with empty exercises/progress
     *   * Set isLoaded: true (will be marked stale on next page load)
     *   * Add the new workout to savedWorkouts array
     * 
     * WHY updateStateAndSave:
     * - Saves to both React state (immediate UI update) and localStorage (persistence)
     * - User sees workout immediately without loading spinner
     * - Workout persists across page refreshes
     * - Will be validated with server on next page load (marked as stale)
     * 
     * See: docs/data-caching-and-persistence.md for complete flow
     */
    const createSavedWorkout = useCallback(async (planId: string, workout: CreateSavedWorkoutRequest) => {
        try {
            updateState({ error: null });
            
            // Call server API to create workout (bypasses cache for fresh data)
            const response = await apiCreateSavedWorkout(workout);

            if (response.data) {
                const currentPlanData = state.planData[planId];
                if (currentPlanData) {
                    // Normal case: planData exists, just add new workout to the list
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                ...currentPlanData,
                                savedWorkouts: [...currentPlanData.savedWorkouts, response.data]
                            }
                        }
                    });
                } else {
                    // Edge case: planData doesn't exist (new plan or cleared cache)
                    // Initialize planData with the new workout
                    // Note: isLoaded: true will be marked as false on next page load (see useTrainingDataHooks.ts line 81-87)
                    updateStateAndSave({
                        planData: {
                            ...state.planData,
                            [planId]: {
                                exercises: [],
                                weeklyProgress: {},
                                savedWorkouts: [response.data],
                                isLoaded: true,  // Will be marked stale on next page load
                                isLoading: false
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