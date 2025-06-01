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

            const originalWeekProgress = [...currentWeekProgress];

            const currentSets = currentProgress?.setsCompleted || 0;
            let newSetsCompleted: number;

            if (completeAll) {
                newSetsCompleted = totalSetsForExercise;
            } else {
                newSetsCompleted = Math.max(0, Math.min(totalSetsForExercise, currentSets + setsIncrement));
            }

            const isExerciseDone = newSetsCompleted >= totalSetsForExercise;

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

            // Optimistic update
            updateState({
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
            });

            // Background API call
            apiUpdateSetCompletion({
                planId,
                exerciseId,
                weekNumber,
                setsIncrement,
                totalSetsForExercise,
                completeAll
            }).then(response => {
                if (response.data?.success && response.data.updatedProgress) {
                    setState(currentState => {
                        const currentPlanData = currentState.planData[planId];
                        if (!currentPlanData) return currentState;

                        const currentWeekProgress = currentPlanData.weeklyProgress[weekNumber] || [];
                        const updatedWeekProgress = currentWeekProgress.map(p =>
                            p.exerciseId === exerciseId ? response.data!.updatedProgress! : p
                        );

                        const newState = {
                            ...currentState,
                            planData: {
                                ...currentState.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    weeklyProgress: {
                                        ...currentPlanData.weeklyProgress,
                                        [weekNumber]: updatedWeekProgress
                                    }
                                }
                            }
                        };

                        saveToLocalStorage(newState);
                        return newState;
                    });
                } else {
                    // Rollback on error
                    setState(currentState => ({
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
                    }));
                    showNotification(`Could not save progress: ${response.data?.message || 'Server error'}`, 'error');
                }
            }).catch(error => {
                // Rollback on error
                setState(currentState => ({
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
                }));
                showNotification(`Could not save progress: ${error instanceof Error ? error.message : 'Network error'}`, 'error');
            });

            return optimisticProgress;
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update set completion'
            });
            throw error;
        }
    }, [state, updateState, saveToLocalStorage, showNotification]);

    return {
        loadWeeklyProgress,
        updateSetCompletion
    };
}; 