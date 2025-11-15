import { useState, useCallback, useEffect } from 'react';
import { TrainingDataState } from '../TrainingDataContext';
import { ExerciseBase, WeeklyProgressBase, SavedWorkout } from '@/common/types/training';
import { getExercises } from '@/apis/exercises/client';
import { getAllSavedWorkouts as getSavedWorkouts } from '@/apis/savedWorkouts/client';
import { getWeeklyProgress } from '@/apis/weeklyProgress/client';
import type { GetWeeklyProgressResponse } from '@/apis/weeklyProgress/types';
import type { CacheResult } from '@/common/cache/types';

import { useNotificationHooks } from './useNotificationHooks';
import { useStorageHooks } from './useStorageHooks';
import { useTrainingPlanHooks } from './useTrainingPlanHooks';
import { useExerciseHooks } from './useExerciseHooks';
import { useWeeklyProgressHooks } from './useWeeklyProgressHooks';
import { useSavedWorkoutHooks } from './useSavedWorkoutHooks';

const getDefaultState = (): TrainingDataState => ({
    trainingPlans: [],
    activePlanId: null,
    planData: {},
    isInitialLoading: true,
    error: null
});

export const useTrainingDataHooks = () => {
    const [state, setState] = useState<TrainingDataState>(getDefaultState());
    const [isLoadingFromServer, setIsLoadingFromServer] = useState(false);

    const updateState = useCallback((newState: Partial<TrainingDataState>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

    // Initialize hooks
    const { notification, showNotification, closeNotification } = useNotificationHooks();
    const { saveToLocalStorage, loadFromLocalStorage } = useStorageHooks();

    const updateStateAndSave = useCallback((newState: Partial<TrainingDataState>) => {
        setState(prev => {
            const updated = { ...prev, ...newState };
            saveToLocalStorage(updated);
            return updated;
        });
    }, [saveToLocalStorage]);

    // Domain hooks
    const trainingPlanHooks = useTrainingPlanHooks(state, updateState, updateStateAndSave);
    const exerciseHooks = useExerciseHooks(state, updateState, updateStateAndSave);
    const weeklyProgressHooks = useWeeklyProgressHooks(state, updateState, saveToLocalStorage, showNotification, setState);
    const savedWorkoutHooks = useSavedWorkoutHooks(state, updateState, updateStateAndSave);

    // Main data loading function that orchestrates all data loading
    const loadTrainingPlans = useCallback(async () => {
        updateState({ error: null });

        // Load from cache first for instant UI, but mark as not loaded to force refresh
        const cachedData = loadFromLocalStorage();
        if (cachedData) {
            // Mark all planData as not loaded to ensure fresh fetch from server
            const stalePlanData = Object.keys(cachedData.planData || {}).reduce((acc, planId) => {
                acc[planId] = {
                    ...cachedData.planData[planId],
                    isLoaded: false, // Mark as stale to force refresh
                    isLoading: false
                };
                return acc;
            }, {} as TrainingDataState['planData']);

            setState(prev => ({
                ...prev,
                trainingPlans: cachedData.trainingPlans,
                activePlanId: cachedData.activePlanId,
                planData: stalePlanData,
                isInitialLoading: false
            }));
            setIsLoadingFromServer(true);
        } else {
            updateState({ isInitialLoading: true });
        }

        try {
            // Load training plans and active plan
            const trainingData = await trainingPlanHooks.loadTrainingPlans();
            if (!trainingData) {
                updateState({ isInitialLoading: false });
                setIsLoadingFromServer(false);
                return;
            }

            // Load ALL plan data for ALL plans
            const planDataPromises = trainingData.trainingPlans.map(async (plan) => {
                try {
                    const [exercisesResponse, savedWorkoutsResponse] = await Promise.all([
                        getExercises({ trainingPlanId: plan._id }),
                        getSavedWorkouts({ trainingPlanId: plan._id })
                    ]);

                    const exercises = exercisesResponse.data || [];
                    const savedWorkouts = savedWorkoutsResponse.data || [];

                    // Load weekly progress for week 1
                    let weeklyProgressData: Record<number, WeeklyProgressBase[]> = {};
                    if (exercises.length > 0) {
                        try {
                            const progressPromises = exercises.map((exercise: ExerciseBase) =>
                                getWeeklyProgress({ planId: plan._id, exerciseId: exercise._id, weekNumber: 1 })
                            );

                            const progressResponses = await Promise.all(progressPromises);
                            const progressForWeek1 = progressResponses
                                .filter((response: CacheResult<GetWeeklyProgressResponse>) => response.data)
                                .map((response: CacheResult<GetWeeklyProgressResponse>) => response.data!);

                            weeklyProgressData = { 1: progressForWeek1 };
                        } catch (progressError) {
                            console.warn(`Failed to load weekly progress for plan ${plan._id}:`, progressError);
                            weeklyProgressData = {};
                        }
                    }

                    const existingWeeklyProgress = cachedData?.planData[plan._id]?.weeklyProgress || {};
                    const mergedWeeklyProgress = {
                        ...existingWeeklyProgress,
                        ...weeklyProgressData
                    };

                    return {
                        planId: plan._id,
                        data: {
                            exercises,
                            savedWorkouts,
                            weeklyProgress: mergedWeeklyProgress,
                            isLoaded: true,
                            isLoading: false
                        }
                    };
                } catch (planDataError) {
                    console.warn(`Failed to load data for plan ${plan._id}:`, planDataError);

                    const existingPlanData = cachedData?.planData[plan._id];
                    if (existingPlanData) {
                        return {
                            planId: plan._id,
                            data: existingPlanData
                        };
                    }

                    return {
                        planId: plan._id,
                        data: {
                            exercises: [],
                            savedWorkouts: [],
                            weeklyProgress: {},
                            isLoaded: false,
                            isLoading: false
                        }
                    };
                }
            });

            const planDataResults = await Promise.all(planDataPromises);
            const planData = planDataResults.reduce((acc, result) => {
                acc[result.planId] = result.data;
                return acc;
            }, {} as Record<string, {
                exercises: ExerciseBase[];
                weeklyProgress: Record<number, WeeklyProgressBase[]>;
                savedWorkouts: SavedWorkout[];
                isLoaded: boolean;
                isLoading: boolean;
            }>);

            const freshData: TrainingDataState = {
                trainingPlans: trainingData.trainingPlans,
                activePlanId: trainingData.activePlanId,
                planData,
                isInitialLoading: false,
                error: null
            };

            setState(freshData);
            saveToLocalStorage(freshData);
            setIsLoadingFromServer(false);

        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load training plans',
                isInitialLoading: false
            });
            setIsLoadingFromServer(false);
        }
    }, [updateState, loadFromLocalStorage, trainingPlanHooks, saveToLocalStorage]);

    // Plan data loading
    const loadPlanData = useCallback(async (planId: string) => {
        // Use setState with function to check and set loading atomically
        let shouldLoad = false;
        setState(prev => {
            const existing = prev.planData[planId];
            if (existing?.isLoaded || existing?.isLoading) {
                shouldLoad = false;
                return prev;
            }

            shouldLoad = true;
            return {
                ...prev,
                planData: {
                    ...prev.planData,
                    [planId]: {
                        exercises: [],
                        weeklyProgress: {},
                        savedWorkouts: [],
                        isLoaded: false,
                        isLoading: true
                    }
                }
            };
        });

        if (!shouldLoad) {
            return;
        }

        try {
            const [exercisesResponse, savedWorkoutsResponse] = await Promise.all([
                getExercises({ trainingPlanId: planId }),
                getSavedWorkouts({ trainingPlanId: planId })
            ]);

            const exercises = exercisesResponse.data || [];
            const savedWorkouts = savedWorkoutsResponse.data || [];

            setState(prev => {
                const newState = {
                    ...prev,
                    planData: {
                        ...prev.planData,
                        [planId]: {
                            exercises,
                            savedWorkouts,
                            weeklyProgress: {},
                            isLoaded: true,
                            isLoading: false
                        }
                    }
                };
                saveToLocalStorage(newState);
                return newState;
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Failed to load plan data',
                planData: {
                    ...prev.planData,
                    [planId]: {
                        ...prev.planData[planId],
                        isLoading: false
                    }
                }
            }));
        }
    }, [saveToLocalStorage]);

    // Load training plans on mount
    useEffect(() => {
        loadTrainingPlans();
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loadTrainingPlans: _, ...otherTrainingPlanHooks } = trainingPlanHooks;

    return {
        state,
        updateState,
        isLoadingFromServer,
        notification,
        closeNotification,
        loadTrainingPlans,
        loadPlanData,
        // Training plan functions
        ...otherTrainingPlanHooks,
        // Exercise functions  
        ...exerciseHooks,
        // Weekly progress functions
        ...weeklyProgressHooks,
        // Saved workout functions
        ...savedWorkoutHooks
    };
}; 