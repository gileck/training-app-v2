import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { TrainingDataContext, TrainingDataState, TrainingDataContextType } from './TrainingDataContext';
import {
    CreateTrainingPlanRequest,
    UpdateTrainingPlanRequest,
    AddExerciseRequest,
    UpdateExerciseRequest,
    CreateSavedWorkoutRequest,
    SavedWorkout,
    ExerciseBase,
    WeeklyProgressBase
} from '@/common/types/training';

// Import API clients
import {
    getAllTrainingPlans,
    getActiveTrainingPlan,
    createTrainingPlan as apiCreateTrainingPlan,
    updateTrainingPlan as apiUpdateTrainingPlan,
    deleteTrainingPlan as apiDeleteTrainingPlan,
    duplicateTrainingPlan as apiDuplicateTrainingPlan,
    setActiveTrainingPlan as apiSetActiveTrainingPlan
} from '@/apis/trainingPlans/client';

import {
    getExercises,
    addExercise as apiAddExercise,
    updateExercise as apiUpdateExercise,
    deleteExercise as apiDeleteExercise
} from '@/apis/exercises/client';

import {
    getAllSavedWorkouts as getSavedWorkouts,
    createSavedWorkout as apiCreateSavedWorkout,
    deleteSavedWorkout as apiDeleteSavedWorkout
} from '@/apis/savedWorkouts/client';

import {
    getWeeklyProgress,
    updateSetCompletion as apiUpdateSetCompletion
} from '@/apis/weeklyProgress/client';
import type { GetWeeklyProgressResponse } from '@/apis/weeklyProgress/types';
import type { CacheResult } from '@/common/cache/types';
import { LinearProgress } from '@mui/material';

interface TrainingDataProviderProps {
    children: ReactNode;
}

export const TrainingDataProvider: React.FC<TrainingDataProviderProps> = ({ children }) => {
    // Initial state
    const [state, setState] = useState<TrainingDataState>({
        trainingPlans: [],
        activePlanId: null,
        planData: {},
        isInitialLoading: true,
        error: null
    });

    // Update state function
    const updateState = useCallback((newState: Partial<TrainingDataState>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

    // Training Plans Actions
    const loadTrainingPlans = useCallback(async () => {
        try {
            updateState({ isInitialLoading: true, error: null });

            // Load both training plans and active plan in parallel
            const [trainingPlansResponse, activeTrainingPlanResponse] = await Promise.all([
                getAllTrainingPlans(),
                getActiveTrainingPlan()
            ]);

            if (trainingPlansResponse.data) {
                let activePlanId = null;

                // Check if we got an active plan from API
                if (activeTrainingPlanResponse.data && '_id' in activeTrainingPlanResponse.data) {
                    activePlanId = activeTrainingPlanResponse.data._id;
                } else {
                    // Fallback: find the first plan marked as active, or use the first plan
                    const activePlan = trainingPlansResponse.data.find(plan => plan.isActive);
                    activePlanId = activePlan?._id || trainingPlansResponse.data[0]?._id || null;
                }

                // Update training plans and active plan first
                updateState({
                    trainingPlans: trainingPlansResponse.data,
                    activePlanId
                });

                // If we have an active plan, load its data immediately
                if (activePlanId) {
                    try {
                        // Load active plan data in parallel
                        const [exercisesResponse, savedWorkoutsResponse] = await Promise.all([
                            getExercises({ trainingPlanId: activePlanId }),
                            getSavedWorkouts({ trainingPlanId: activePlanId })
                        ]);

                        const exercises = exercisesResponse.data || [];
                        const savedWorkouts = savedWorkoutsResponse.data || [];

                        // Load weekly progress for week 1 for all exercises
                        let weeklyProgressData: Record<number, WeeklyProgressBase[]> = {};
                        if (exercises.length > 0) {
                            try {
                                const progressPromises = exercises.map((exercise: ExerciseBase) =>
                                    getWeeklyProgress({ planId: activePlanId, exerciseId: exercise._id, weekNumber: 1 })
                                );

                                const progressResponses = await Promise.all(progressPromises);
                                const progressForWeek1 = progressResponses
                                    .filter((response: CacheResult<GetWeeklyProgressResponse>) => response.data)
                                    .map((response: CacheResult<GetWeeklyProgressResponse>) => response.data!);

                                weeklyProgressData = { 1: progressForWeek1 };
                            } catch (progressError) {
                                console.warn('Failed to load weekly progress for week 1:', progressError);
                                weeklyProgressData = {};
                            }
                        }

                        // Update state with active plan data
                        setState(prev => ({
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [activePlanId]: {
                                    exercises,
                                    savedWorkouts,
                                    weeklyProgress: weeklyProgressData,
                                    isLoaded: true,
                                    isLoading: false
                                }
                            },
                            isInitialLoading: false
                        }));
                    } catch (planDataError) {
                        console.warn('Failed to load active plan data:', planDataError);
                        updateState({ isInitialLoading: false });
                    }
                } else {
                    updateState({ isInitialLoading: false });
                }
            } else {
                updateState({
                    error: 'Failed to load training plans',
                    isInitialLoading: false
                });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load training plans',
                isInitialLoading: false
            });
        }
    }, [updateState]);

    const createTrainingPlan = useCallback(async (plan: CreateTrainingPlanRequest) => {
        try {
            updateState({ error: null });
            const response = await apiCreateTrainingPlan(plan);

            if (response.data) {
                setState(prev => ({
                    ...prev,
                    trainingPlans: [...prev.trainingPlans, response.data]
                }));
            } else {
                updateState({ error: 'Failed to create training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create training plan'
            });
        }
    }, [updateState]);

    const updateTrainingPlan = useCallback(async (planId: string, updates: UpdateTrainingPlanRequest) => {
        try {
            updateState({ error: null });
            const response = await apiUpdateTrainingPlan({ ...updates, planId } as UpdateTrainingPlanRequest);

            if (response.data) {
                setState(prev => ({
                    ...prev,
                    trainingPlans: prev.trainingPlans.map(plan =>
                        plan._id === planId ? response.data! : plan
                    )
                }));
            } else {
                updateState({ error: 'Failed to update training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update training plan'
            });
        }
    }, [updateState]);

    const deleteTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteTrainingPlan({ planId });

            if (response.data) {
                setState(prev => ({
                    ...prev,
                    trainingPlans: prev.trainingPlans.filter(plan => plan._id !== planId),
                    // Clear plan data if it was loaded
                    planData: Object.fromEntries(
                        Object.entries(prev.planData).filter(([id]) => id !== planId)
                    )
                }));
            } else {
                updateState({ error: 'Failed to delete training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete training plan'
            });
        }
    }, [updateState]);

    const duplicateTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDuplicateTrainingPlan({ planId });

            if (response.data) {
                setState(prev => ({
                    ...prev,
                    trainingPlans: [...prev.trainingPlans, response.data]
                }));
            } else {
                updateState({ error: 'Failed to duplicate training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to duplicate training plan'
            });
        }
    }, [updateState]);

    const setActiveTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiSetActiveTrainingPlan({ planId });

            if (response.data) {
                updateState({ activePlanId: planId });
            } else {
                updateState({ error: 'Failed to set active training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to set active training plan'
            });
        }
    }, [updateState]);

    // Plan Data Loading (Demand Loading)
    const loadPlanData = useCallback(async (planId: string) => {
        setState(prev => {
            const existing = prev.planData[planId];
            if (existing?.isLoaded || existing?.isLoading) return prev;

            // Set loading state
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

        try {
            // Load all plan data in parallel
            const [exercisesResponse, savedWorkoutsResponse] = await Promise.all([
                getExercises({ trainingPlanId: planId }),
                getSavedWorkouts({ trainingPlanId: planId })
            ]);

            const exercises = exercisesResponse.data || [];
            const savedWorkouts = savedWorkoutsResponse.data || [];

            // Update state with loaded data
            setState(prev => ({
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
            }));
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
    }, []);

    // Exercise Actions
    const loadExercises = useCallback(async (planId: string) => {
        // This will be handled by loadPlanData
        await loadPlanData(planId);
    }, [loadPlanData]);

    const createExercise = useCallback(async (planId: string, exercise: AddExerciseRequest) => {
        try {
            updateState({ error: null });
            const response = await apiAddExercise(exercise);

            if (response.data) {
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    exercises: [...currentPlanData.exercises, response.data]
                                }
                            }
                        };
                    }
                    return prev;
                });
            } else {
                updateState({ error: 'Failed to create exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create exercise'
            });
        }
    }, [updateState]);

    const updateExercise = useCallback(async (planId: string, exerciseId: string, updates: UpdateExerciseRequest) => {
        try {
            updateState({ error: null });
            const response = await apiUpdateExercise(updates);

            if (response.data) {
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    exercises: currentPlanData.exercises.map(ex =>
                                        ex._id === exerciseId ? response.data! : ex
                                    )
                                }
                            }
                        };
                    }
                    return prev;
                });
            } else {
                updateState({ error: 'Failed to update exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update exercise'
            });
        }
    }, [updateState]);

    const deleteExercise = useCallback(async (planId: string, exerciseId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteExercise({ exerciseId, trainingPlanId: planId });

            if (response.data) {
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    exercises: currentPlanData.exercises.filter(ex => ex._id !== exerciseId)
                                }
                            }
                        };
                    }
                    return prev;
                });
            } else {
                updateState({ error: 'Failed to delete exercise' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete exercise'
            });
        }
    }, [updateState]);

    // Weekly Progress Actions
    const loadWeeklyProgress = useCallback(async (planId: string, weekNumber: number) => {
        try {
            setState(prev => {
                const currentPlanData = prev.planData[planId];
                if (!currentPlanData?.exercises.length) return prev;

                // Load progress for all exercises in the plan for the given week
                const progressPromises = currentPlanData.exercises.map(exercise =>
                    getWeeklyProgress({ planId, exerciseId: exercise._id, weekNumber })
                );

                Promise.all(progressPromises).then(progressResponses => {
                    const progressData = progressResponses
                        .filter(response => response.data)
                        .map(response => response.data!);

                    setState(innerPrev => ({
                        ...innerPrev,
                        planData: {
                            ...innerPrev.planData,
                            [planId]: {
                                ...innerPrev.planData[planId],
                                weeklyProgress: {
                                    ...innerPrev.planData[planId].weeklyProgress,
                                    [weekNumber]: progressData
                                }
                            }
                        }
                    }));
                }).catch(error => {
                    setState(innerPrev => ({
                        ...innerPrev,
                        error: error instanceof Error ? error.message : 'Failed to load weekly progress'
                    }));
                });

                return prev;
            });
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load weekly progress'
            });
        }
    }, [updateState]);

    const updateSetCompletion = useCallback(async (planId: string, weekNumber: number, exerciseId: string, setsIncrement: number, totalSetsForExercise: number, completeAll?: boolean) => {
        try {
            updateState({ error: null });

            // Make API call first
            const response = await apiUpdateSetCompletion({
                planId,
                exerciseId,
                weekNumber,
                setsIncrement,
                totalSetsForExercise,
                completeAll
            });

            if (response.data?.success && response.data.updatedProgress) {
                // Update state with the response data
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        const currentWeekProgress = currentPlanData.weeklyProgress[weekNumber] || [];
                        const updatedWeekProgress = currentWeekProgress.map(p =>
                            p.exerciseId === exerciseId ? response.data!.updatedProgress! : p
                        );

                        // If progress doesn't exist, add it
                        if (!currentWeekProgress.find(p => p.exerciseId === exerciseId)) {
                            updatedWeekProgress.push(response.data!.updatedProgress!);
                        }

                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    weeklyProgress: {
                                        ...currentPlanData.weeklyProgress,
                                        [weekNumber]: updatedWeekProgress
                                    }
                                }
                            }
                        };
                    }
                    return prev;
                });
                return response.data!.updatedProgress!;
            } else {
                throw new Error(response.data?.message || 'Failed to update set completion');
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update set completion'
            });
            throw error;
        }
    }, [updateState]);

    // Saved Workouts Actions
    const loadSavedWorkouts = useCallback(async (planId: string) => {
        // This will be handled by loadPlanData
        await loadPlanData(planId);
    }, [loadPlanData]);

    const createSavedWorkout = useCallback(async (planId: string, workout: CreateSavedWorkoutRequest) => {
        try {
            updateState({ error: null });
            const response = await apiCreateSavedWorkout(workout);

            if (response.data) {
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    savedWorkouts: [...currentPlanData.savedWorkouts, response.data]
                                }
                            }
                        };
                    }
                    return prev;
                });
            } else {
                updateState({ error: 'Failed to create saved workout' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create saved workout'
            });
        }
    }, [updateState]);

    const updateSavedWorkout = useCallback(async (planId: string, workoutId: string, updates: Partial<SavedWorkout>) => {
        // Implementation would depend on available API
        console.log('updateSavedWorkout not implemented yet', { planId, workoutId, updates });
    }, []);

    const deleteSavedWorkout = useCallback(async (planId: string, workoutId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteSavedWorkout({ workoutId });

            if (response.data) {
                setState(prev => {
                    const currentPlanData = prev.planData[planId];
                    if (currentPlanData) {
                        return {
                            ...prev,
                            planData: {
                                ...prev.planData,
                                [planId]: {
                                    ...currentPlanData,
                                    savedWorkouts: currentPlanData.savedWorkouts.filter(w => w._id !== workoutId)
                                }
                            }
                        };
                    }
                    return prev;
                });
            } else {
                updateState({ error: 'Failed to delete saved workout' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete saved workout'
            });
        }
    }, [updateState]);

    // Load training plans on mount
    useEffect(() => {
        loadTrainingPlans();
    }, []);

    // Context value
    const contextValue: TrainingDataContextType = {
        state,
        updateState,
        loadTrainingPlans,
        createTrainingPlan,
        updateTrainingPlan,
        deleteTrainingPlan,
        duplicateTrainingPlan,
        setActiveTrainingPlan,
        loadPlanData,
        loadExercises,
        createExercise,
        updateExercise,
        deleteExercise,
        loadWeeklyProgress,
        updateSetCompletion,
        loadSavedWorkouts,
        createSavedWorkout,
        updateSavedWorkout,
        deleteSavedWorkout
    };

    const isLoading = state.isInitialLoading

    return (
        <TrainingDataContext.Provider value={contextValue}>
            {isLoading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }} />}
            {!isLoading && children}
        </TrainingDataContext.Provider>
    );
}; 