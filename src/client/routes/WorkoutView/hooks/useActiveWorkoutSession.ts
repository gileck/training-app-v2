import { useState, useCallback } from 'react';
import { WorkoutExercise } from '@/client/types/workout';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';

export const EXERCISES_TAB_INDEX = 0;
export const ACTIVE_WORKOUT_TAB_INDEX = 2;

export interface UseActiveWorkoutSessionReturn {
    activeWorkoutSession: WorkoutExercise[] | null;
    activeWorkoutName: string | null;
    startActiveWorkout: (exercisesToStart: WorkoutExercise[], name?: string) => void;
    onIncrementActiveSet: (exerciseId: string) => void;
    onDecrementActiveSet: (exerciseId: string) => void;
    onEndActiveWorkout: () => void;
    onRemoveExerciseFromActiveSession: (exerciseIdToRemove: string) => void;
}

export const useActiveWorkoutSession = (
    setActiveTabState: (tabIndex: number) => void,
    onWorkoutStart: (() => void) | undefined,
    currentPlanId: string | undefined,
    currentWeekNumber: number,
    onMainSetCompletionUpdate?: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void // Changed Partial<WeeklyProgressBase> to WeeklyProgressBase
): UseActiveWorkoutSessionReturn => {
    const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutExercise[] | null>(null);
    const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);

    const startActiveWorkout = useCallback((exercisesToStart: WorkoutExercise[], name?: string) => {
        setActiveWorkoutSession(exercisesToStart);
        setActiveWorkoutName(name || 'Active Workout');
        if (onWorkoutStart) {
            onWorkoutStart();
        }
        setActiveTabState(ACTIVE_WORKOUT_TAB_INDEX);
    }, [setActiveTabState, onWorkoutStart]);

    const handleEndActiveWorkout = useCallback(() => {
        setActiveWorkoutSession(null);
        setActiveWorkoutName(null);
        setActiveTabState(EXERCISES_TAB_INDEX);
    }, [setActiveTabState]);

    const updateExerciseProgress = useCallback((exerciseId: string, isIncrement: boolean) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;

            let newlyUpdatedExerciseForCallback: WorkoutExercise | null = null;

            const newSession = prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    const baseProgress = ex.progress || {
                        _id: crypto.randomUUID(),
                        exerciseId: ex._id.toString(),
                        setsCompleted: 0,
                        repsPerSet: Array(ex.sets || 0).fill(0),
                        weightPerSet: Array(ex.sets || 0).fill(0),
                        isExerciseDone: false,
                        lastUpdatedAt: new Date(),
                        createdAt: new Date(),
                        userId: ex.userId?.toString() || crypto.randomUUID(),
                        planId: currentPlanId || crypto.randomUUID(),
                        weekNumber: currentWeekNumber,
                        weeklyNotes: []
                    } as WeeklyProgressBase;

                    let newSetsCompleted = baseProgress.setsCompleted || 0;
                    if (isIncrement && newSetsCompleted < ex.sets) {
                        newSetsCompleted++;
                    } else if (!isIncrement && newSetsCompleted > 0) {
                        newSetsCompleted--;
                    }

                    newlyUpdatedExerciseForCallback = {
                        ...ex,
                        progress: {
                            ...baseProgress,
                            setsCompleted: newSetsCompleted,
                            lastUpdatedAt: new Date(),
                            isExerciseDone: newSetsCompleted >= ex.sets,
                        } as WeeklyProgressBase,
                    };

                    if (newlyUpdatedExerciseForCallback.progress && onMainSetCompletionUpdate && currentPlanId) {
                        onMainSetCompletionUpdate(exerciseId, newlyUpdatedExerciseForCallback.progress as WeeklyProgressBase);
                    }
                    return newlyUpdatedExerciseForCallback;
                }
                return ex;
            });
            return newSession;
        });
        // No direct return value of the updated exercise here
    }, [currentPlanId, currentWeekNumber, onMainSetCompletionUpdate]); // Added onMainSetCompletionUpdate

    const onIncrementActiveSet = useCallback((exerciseId: string) => {
        updateExerciseProgress(exerciseId, true);
    }, [updateExerciseProgress]);

    const onDecrementActiveSet = useCallback((exerciseId: string) => {
        updateExerciseProgress(exerciseId, false);
    }, [updateExerciseProgress]);

    const onRemoveExerciseFromActiveSession = useCallback((exerciseIdToRemove: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            const updatedSession = prevSession.filter(ex => ex._id.toString() !== exerciseIdToRemove);
            if (updatedSession.length === 0) {
                handleEndActiveWorkout();
                return null;
            }
            return updatedSession;
        });
    }, [handleEndActiveWorkout]);

    return {
        activeWorkoutSession,
        activeWorkoutName,
        startActiveWorkout,
        onIncrementActiveSet,
        onDecrementActiveSet,
        onEndActiveWorkout: handleEndActiveWorkout,
        onRemoveExerciseFromActiveSession,
    };
}; 