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
    // Callback to clear selections when a workout starts
    onWorkoutStart?: () => void
): UseActiveWorkoutSessionReturn => {
    const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutExercise[] | null>(null);
    const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);

    const startActiveWorkout = useCallback((exercisesToStart: WorkoutExercise[], name?: string) => {
        setActiveWorkoutSession(exercisesToStart);
        setActiveWorkoutName(name || 'Active Workout');
        if (onWorkoutStart) {
            onWorkoutStart(); // Clear selections, hide selection mode etc.
        }
        setActiveTabState(ACTIVE_WORKOUT_TAB_INDEX);
    }, [setActiveTabState, onWorkoutStart]);

    const handleEndActiveWorkout = useCallback(() => {
        setActiveWorkoutSession(null);
        setActiveWorkoutName(null);
        setActiveTabState(EXERCISES_TAB_INDEX);
    }, [setActiveTabState]);

    const onIncrementActiveSet = useCallback((exerciseId: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            return prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    let progressToUse: WeeklyProgressBase;
                    if (!ex.progress) {
                        // console.warn(`Exercise ${exerciseId} is missing progress. Initializing.`);
                        progressToUse = {
                            _id: 'temp-id-' + Date.now() as any, // Temporary client-side ID, cast to any to match ObjectId expectation
                            userId: ex.userId.toString() as any, // TODO: Ensure ObjectId compatibility
                            planId: ex.trainingPlanId.toString() as any, // TODO: Ensure ObjectId compatibility
                            exerciseId: ex._id.toString() as any, // TODO: Ensure ObjectId compatibility
                            weekNumber: 0, // Placeholder, should come from context
                            setsCompleted: 0,
                            repsPerSet: Array(ex.sets).fill(0),
                            weightPerSet: Array(ex.sets).fill(0),
                            weeklyNotes: [],
                            isExerciseDone: false,
                            lastUpdatedAt: new Date(),
                            createdAt: new Date(),
                        } as WeeklyProgressBase; // Cast needed due to temp _id and any casts for ObjectId fields
                    } else {
                        progressToUse = ex.progress;
                    }

                    const currentSetsCompleted = progressToUse.setsCompleted || 0;
                    if (currentSetsCompleted < ex.sets) {
                        return {
                            ...ex,
                            progress: {
                                ...progressToUse,
                                setsCompleted: currentSetsCompleted + 1,
                                lastUpdatedAt: new Date(),
                                isExerciseDone: (currentSetsCompleted + 1) >= ex.sets,
                            },
                        };
                    }
                }
                return ex;
            });
        });
    }, []);

    const onDecrementActiveSet = useCallback((exerciseId: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            return prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    if (!ex.progress) {
                        // console.warn(`Exercise ${exerciseId} is missing progress for decrement.`);
                        return ex;
                    }
                    const currentSetsCompleted = ex.progress.setsCompleted || 0;
                    if (currentSetsCompleted > 0) {
                        return {
                            ...ex,
                            progress: {
                                ...ex.progress,
                                setsCompleted: currentSetsCompleted - 1,
                                lastUpdatedAt: new Date(),
                                isExerciseDone: false,
                            },
                        };
                    }
                }
                return ex;
            });
        });
    }, []);

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
        onEndActiveWorkout: handleEndActiveWorkout, // Renamed for clarity from original hook
        onRemoveExerciseFromActiveSession,
    };
}; 