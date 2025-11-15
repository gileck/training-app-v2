import React, { useCallback } from 'react';
import { TrainingDataState } from '../TrainingDataContext';
import { WeeklyProgressBase } from '@/common/types/training';
import {
    getWeeklyProgress,
    updateSetCompletion as apiUpdateSetCompletion
} from '@/apis/weeklyProgress/client';
import type { GetWeeklyProgressResponse } from '@/apis/weeklyProgress/types';
import type { CacheResult } from '@/common/cache/types';

export const useWeeklyProgressHooks = (
    state: TrainingDataState,
    updateState: (newState: Partial<TrainingDataState>) => void,
    saveToLocalStorage: (data: TrainingDataState) => void,
    showNotification: (message: string, severity?: 'error' | 'warning' | 'info' | 'success') => void,
    setState: React.Dispatch<React.SetStateAction<TrainingDataState>>
) => {
    const loadWeeklyProgress = useCallback(async (planId: string, weekNumber: number) => {
        try {
            const currentPlanData = state.planData[planId];
            if (!currentPlanData?.exercises.length) return;

            const progressPromises = currentPlanData.exercises.map(exercise =>
                getWeeklyProgress({ planId, exerciseId: exercise._id, weekNumber })
            );

            const progressResponses = await Promise.all(progressPromises);
            const progressData = progressResponses
                .filter((response: CacheResult<GetWeeklyProgressResponse>) => response.data)
                .map((response: CacheResult<GetWeeklyProgressResponse>) => response.data!);

            const newState = {
                ...state,
                planData: {
                    ...state.planData,
                    [planId]: {
                        ...state.planData[planId],
                        weeklyProgress: {
                            ...state.planData[planId].weeklyProgress,
                            [weekNumber]: progressData
                        }
                    }
                }
            };

            updateState({
                planData: {
                    ...state.planData,
                    [planId]: {
                        ...state.planData[planId],
                        weeklyProgress: {
                            ...state.planData[planId].weeklyProgress,
                            [weekNumber]: progressData
                        }
                    }
                }
            });

            saveToLocalStorage(newState);
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load weekly progress'
            });
        }
    }, [state, updateState, saveToLocalStorage]);

    /**
     * Updates set completion for an exercise using optimistic updates.
     * 
     * ## Race Condition Prevention Strategy
     * 
     * This function uses a "trust the optimistic update" approach to prevent race conditions:
     * 
     * 1. **Optimistic Update (Immediate)**: Calculate the new state and apply it immediately
     *    - This becomes our source of truth
     *    - Save to localStorage for persistence
     *    - User sees instant feedback
     * 
     * 2. **Server Sync (Background)**: Send the update to the server
     *    - On SUCCESS: Do nothing (our optimistic update is already correct)
     *    - On ERROR: Rollback to the original state and notify the user
     * 
     * ## Why This Prevents Race Conditions
     * 
     * Traditional approach (problematic):
     * - User clicks + (0→1): Optimistic to 1, API call #1 sent
     * - User clicks + (1→2): Optimistic to 2, API call #2 sent
     * - API call #1 responds (setsCompleted=1): ❌ Overwrites state back to 1
     * - API call #2 responds (setsCompleted=2): Updates to 2
     * - Result: Flickering UI, temporary incorrect state
     * 
     * Our approach (correct):
     * - User clicks + (0→1): Optimistic to 1, saved to localStorage, API call #1 sent
     * - User clicks + (1→2): Optimistic to 2, saved to localStorage, API call #2 sent
     * - API call #1 responds: ✅ Success, do nothing (state is already 2)
     * - API call #2 responds: ✅ Success, do nothing (state is already 2)
     * - Result: Smooth UI, always correct state
     * 
     * @param planId - The training plan ID
     * @param weekNumber - The week number (1-indexed)
     * @param exerciseId - The exercise ID
     * @param setsIncrement - How many sets to increment/decrement (+1 or -1)
     * @param totalSetsForExercise - Total sets for validation
     * @param completeAll - If true, complete all remaining sets at once
     * @returns The optimistic progress object
     */
    const updateSetCompletion = useCallback(async (
        planId: string,
        weekNumber: number,
        exerciseId: string,
        setsIncrement: number,
        totalSetsForExercise: number,
        completeAll?: boolean
    ) => {
        try {
            updateState({ error: null });

            const currentPlanData = state.planData[planId];
            const currentWeekProgress = currentPlanData?.weeklyProgress[weekNumber] || [];
            const currentProgress = currentWeekProgress.find(p => p.exerciseId === exerciseId);

            // Store original state for potential rollback
            const originalWeekProgress = [...currentWeekProgress];

            // Calculate new sets completed
            const currentSets = currentProgress?.setsCompleted || 0;
            let newSetsCompleted: number;

            if (completeAll) {
                newSetsCompleted = totalSetsForExercise;
            } else {
                newSetsCompleted = Math.max(0, Math.min(totalSetsForExercise, currentSets + setsIncrement));
            }

            const isExerciseDone = newSetsCompleted >= totalSetsForExercise;

            // Create optimistic progress object
            const optimisticProgress: WeeklyProgressBase = {
                _id: currentProgress?._id || `temp-${exerciseId}-${weekNumber}`,
                userId: currentProgress?.userId || 'temp-user',
                planId,
                exerciseId,
                weekNumber,
                setsCompleted: newSetsCompleted,
                isExerciseDone,
                completed: isExerciseDone,
                lastUpdatedAt: new Date(),
                weeklyNotes: currentProgress?.weeklyNotes || []
            };

            // STEP 1: Apply optimistic update - this is our source of truth
            const newStateAfterOptimistic = {
                ...state,
                planData: {
                    ...state.planData,
                    [planId]: {
                        ...currentPlanData,
                        weeklyProgress: {
                            ...currentPlanData?.weeklyProgress,
                            [weekNumber]: currentWeekProgress.map(p =>
                                p.exerciseId === exerciseId ? optimisticProgress : p
                            ).concat(
                                !currentWeekProgress.find(p => p.exerciseId === exerciseId) ? [optimisticProgress] : []
                            )
                        }
                    }
                }
            };

            updateState({
                planData: newStateAfterOptimistic.planData
            });

            // STEP 2: Save optimistic state to localStorage immediately for persistence
            saveToLocalStorage(newStateAfterOptimistic);

            // STEP 3: Background API call to sync with server
            // We ONLY use the response for error handling (rollback), never for updating state on success
            apiUpdateSetCompletion({
                planId,
                exerciseId,
                weekNumber,
                setsIncrement,
                totalSetsForExercise,
                completeAll
            }).then(response => {
                if (!response.data?.success) {
                    // Server rejected the update - rollback to original state
                    setState(currentState => {
                        const rolledBackState = {
                            ...currentState,
                            planData: {
                                ...currentState.planData,
                                [planId]: {
                                    ...currentState.planData[planId],
                                    weeklyProgress: {
                                        ...currentState.planData[planId]?.weeklyProgress,
                                        [weekNumber]: originalWeekProgress
                                    }
                                }
                            }
                        };
                        saveToLocalStorage(rolledBackState);
                        return rolledBackState;
                    });
                    showNotification(`Could not save progress: ${response.data?.message || 'Server error'}`, 'error');
                }
                // On success: Do nothing! Our optimistic update is already correct.
                // This is the key to preventing race conditions - we never overwrite with server data.
            }).catch(error => {
                // Network error - rollback to original state
                setState(currentState => {
                    const rolledBackState = {
                        ...currentState,
                        planData: {
                            ...currentState.planData,
                            [planId]: {
                                ...currentState.planData[planId],
                                weeklyProgress: {
                                    ...currentState.planData[planId]?.weeklyProgress,
                                    [weekNumber]: originalWeekProgress
                                }
                            }
                        }
                    };
                    saveToLocalStorage(rolledBackState);
                    return rolledBackState;
                });
                showNotification(`Could not save progress: ${error instanceof Error ? error.message : 'Network error'}`, 'error');
            });

            return optimisticProgress;
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update set completion'
            });
            throw error;
        }
    }, [state, updateState, saveToLocalStorage, showNotification, setState]);

    return {
        loadWeeklyProgress,
        updateSetCompletion
    };
}; 