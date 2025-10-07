import { useCallback } from 'react';
import { addExercise, updateExercise, deleteExercise } from '@/apis/exercises/client';
import { createSavedWorkout, deleteSavedWorkout, renameSavedWorkout } from '@/apis/savedWorkouts/client';
import type { CacheResult } from '@/common/cache/types';

interface UseAiAssistantActionsOptions {
    planId?: string;
}

export const useAiAssistantActions = ({ planId }: UseAiAssistantActionsOptions) => {
    const addExerciseToPlan = useCallback(async (payload: { exerciseDefinitionId: string; sets?: number; reps?: number }) => {
        if (!planId) return;
        await addExercise({ trainingPlanId: planId, exerciseDefinitionId: payload.exerciseDefinitionId, sets: payload.sets, reps: payload.reps } as any);
    }, [planId]);

    const removeExerciseFromPlan = useCallback(async (payload: { exerciseId: string }) => {
        if (!planId) return;
        await deleteExercise({ trainingPlanId: planId, exerciseId: payload.exerciseId } as any);
    }, [planId]);

    const updateExerciseInPlan = useCallback(async (payload: { exerciseId: string; updates: Record<string, unknown> }) => {
        if (!planId) return;
        await updateExercise({ trainingPlanId: planId, exerciseId: payload.exerciseId, updates: payload.updates } as any);
    }, [planId]);

    const createWorkout = useCallback(async (payload: { name?: string }) => {
        if (!planId) return;
        await createSavedWorkout({ trainingPlanId: planId, name: payload.name ?? '' } as any);
    }, [planId]);

    const deleteWorkout = useCallback(async (payload: { workoutId: string }) => {
        if (!planId) return;
        await deleteSavedWorkout({ trainingPlanId: planId, savedWorkoutId: payload.workoutId } as any);
    }, [planId]);

    const renameWorkout = useCallback(async (payload: { workoutId: string; newName: string }) => {
        if (!planId) return;
        await renameSavedWorkout({ trainingPlanId: planId, savedWorkoutId: payload.workoutId, newName: payload.newName } as any);
    }, [planId]);

    return {
        addExerciseToPlan,
        removeExerciseFromPlan,
        updateExerciseInPlan,
        createWorkout,
        deleteWorkout,
        renameWorkout,
    };
};



