import { useState, useCallback, useEffect, useRef } from 'react';
import { WorkoutExercise } from '@/client/types/workout';
import type { WeeklyNote, WeeklyProgressBase } from '@/apis/weeklyProgress/types';

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

const ACTIVE_WORKOUT_STORAGE_KEY = 'workout:activeSession:v1';
const ACTIVE_WORKOUT_STORAGE_VERSION = 1;

type StoredWeeklyNote = Omit<WeeklyNote, 'date'> & { date: string };

type StoredWeeklyProgress = Omit<WeeklyProgressBase, 'lastUpdatedAt' | 'weeklyNotes'> & {
    lastUpdatedAt: string;
    weeklyNotes: StoredWeeklyNote[];
};

type StoredWorkoutExercise = Omit<WorkoutExercise, 'createdAt' | 'updatedAt' | 'progress'> & {
    createdAt: string;
    updatedAt: string;
    progress?: StoredWeeklyProgress;
};

interface StoredActiveWorkoutSession {
    version: number;
    planId?: string;
    weekNumber: number;
    workoutName?: string | null;
    exercises: StoredWorkoutExercise[];
    persistedAt: string;
}

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const toStoredWeeklyProgress = (progress: WeeklyProgressBase): StoredWeeklyProgress => ({
    ...progress,
    lastUpdatedAt: progress.lastUpdatedAt instanceof Date
        ? progress.lastUpdatedAt.toISOString()
        : new Date(progress.lastUpdatedAt).toISOString(),
    weeklyNotes: (progress.weeklyNotes || []).map(note => ({
        ...note,
        date: note.date instanceof Date ? note.date.toISOString() : new Date(note.date).toISOString(),
    })),
});

const fromStoredWeeklyProgress = (progress: StoredWeeklyProgress): WeeklyProgressBase => ({
    ...progress,
    lastUpdatedAt: new Date(progress.lastUpdatedAt),
    weeklyNotes: (progress.weeklyNotes || []).map(note => ({
        ...note,
        date: new Date(note.date),
    })),
});

const toStoredWorkoutExercise = (exercise: WorkoutExercise): StoredWorkoutExercise => ({
    ...exercise,
    createdAt: (exercise.createdAt instanceof Date ? exercise.createdAt : new Date(exercise.createdAt)).toISOString(),
    updatedAt: (exercise.updatedAt instanceof Date ? exercise.updatedAt : new Date(exercise.updatedAt)).toISOString(),
    progress: exercise.progress ? toStoredWeeklyProgress(exercise.progress) : undefined,
});

const fromStoredWorkoutExercise = (exercise: StoredWorkoutExercise): WorkoutExercise => ({
    ...exercise,
    createdAt: new Date(exercise.createdAt),
    updatedAt: new Date(exercise.updatedAt),
    progress: exercise.progress ? fromStoredWeeklyProgress(exercise.progress) : undefined,
});

const persistActiveWorkoutSessionToStorage = (
    session: WorkoutExercise[],
    workoutName: string | null,
    planId: string,
    weekNumber: number
) => {
    if (!canUseBrowserStorage()) {
        return;
    }
    const payload: StoredActiveWorkoutSession = {
        version: ACTIVE_WORKOUT_STORAGE_VERSION,
        planId,
        weekNumber,
        workoutName: workoutName || 'Active Workout',
        exercises: session.map(toStoredWorkoutExercise),
        persistedAt: new Date().toISOString(),
    };
    try {
        localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('Failed to persist active workout session to localStorage:', error);
    }
};

const clearPersistedActiveWorkoutSession = () => {
    if (!canUseBrowserStorage()) {
        return;
    }
    try {
        localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear active workout session from localStorage:', error);
    }
};

const restoreActiveWorkoutSessionFromStorage = (planId: string, weekNumber: number) => {
    if (!canUseBrowserStorage()) {
        return null;
    }
    try {
        const raw = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as StoredActiveWorkoutSession;
        if (parsed.version !== ACTIVE_WORKOUT_STORAGE_VERSION) {
            clearPersistedActiveWorkoutSession();
            return null;
        }
        if (parsed.planId !== planId || parsed.weekNumber !== weekNumber) {
            return null;
        }
        if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
            return null;
        }
        return {
            workoutName: parsed.workoutName,
            exercises: parsed.exercises.map(fromStoredWorkoutExercise),
        };
    } catch (error) {
        console.warn('Failed to restore active workout session from localStorage:', error);
        return null;
    }
};

export const useActiveWorkoutSession = (
    setActiveTabState: (tabIndex: number) => void,
    onWorkoutStart: (() => void) | undefined,
    currentPlanId: string | undefined,
    currentWeekNumber: number,
    onMainSetCompletionUpdate?: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void // Changed Partial<WeeklyProgressBase> to WeeklyProgressBase
): UseActiveWorkoutSessionReturn => {
    const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutExercise[] | null>(null);
    const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);
    const lastHydratedKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (!currentPlanId) {
            return;
        }

        const hydrationKey = `${currentPlanId}:${currentWeekNumber}`;
        const hasActiveSession = !!(activeWorkoutSession && activeWorkoutSession.length > 0);
        const alreadyHydratedForContext = lastHydratedKeyRef.current === hydrationKey;

        if (hasActiveSession && !alreadyHydratedForContext) {
            setActiveWorkoutSession(null);
            setActiveWorkoutName(null);
        }

        if (hasActiveSession && alreadyHydratedForContext) {
            return;
        }

        lastHydratedKeyRef.current = hydrationKey;
        const restored = restoreActiveWorkoutSessionFromStorage(currentPlanId, currentWeekNumber);
        if (restored) {
            setActiveWorkoutSession(restored.exercises);
            setActiveWorkoutName(restored.workoutName || 'Active Workout');
            if (onWorkoutStart) {
                onWorkoutStart();
            }
            setActiveTabState(ACTIVE_WORKOUT_TAB_INDEX);
        }
    }, [activeWorkoutSession, currentPlanId, currentWeekNumber, onWorkoutStart, setActiveTabState]);

    useEffect(() => {
        if (!currentPlanId) {
            return;
        }
        if (activeWorkoutSession && activeWorkoutSession.length > 0) {
            persistActiveWorkoutSessionToStorage(activeWorkoutSession, activeWorkoutName, currentPlanId, currentWeekNumber);
        } else {
            clearPersistedActiveWorkoutSession();
        }
    }, [activeWorkoutSession, activeWorkoutName, currentPlanId, currentWeekNumber]);

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
        clearPersistedActiveWorkoutSession();
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