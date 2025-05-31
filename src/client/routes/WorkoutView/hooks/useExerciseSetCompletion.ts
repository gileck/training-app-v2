import { useState } from 'react';
import { useWeeklyProgress } from '@/client/hooks/useTrainingData';
import { WeeklyProgressBase } from '@/apis/weeklyProgress/types';

export const useExerciseSetCompletion = (
    planId: string,
    weekNumber: number,
    onSetComplete: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void
) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { updateSetCompletion } = useWeeklyProgress(planId, weekNumber);

    const handleSetCheckboxClick = async (
        exerciseId: string,
        setIndex: number,
        setsDone: number,
        totalSets: number
    ) => {
        const targetSetsCompleted = setIndex + 1;
        const increment = targetSetsCompleted > setsDone ? 1 : -1;

        // Prevent exceeding total sets or going below zero
        if ((increment > 0 && setsDone >= totalSets) || (increment < 0 && setsDone <= 0)) {
            return;
        }

        setIsUpdating(true);
        try {
            const updatedProgress = await updateSetCompletion(
                exerciseId,
                increment,
                totalSets
            );

            if (updatedProgress) {
                onSetComplete(exerciseId, updatedProgress);
            }
        } catch (err) {
            console.error("[useExerciseSetCompletion] Error calling updateSetCompletion:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCompleteAllSets = async (
        exerciseId: string,
        setsDone: number,
        totalSets: number
    ) => {
        if (setsDone >= totalSets || isUpdating) return;

        setIsUpdating(true);
        try {
            const updatedProgress = await updateSetCompletion(
                exerciseId,
                1, // This value is ignored when completeAll is true
                totalSets,
                true // completeAll
            );

            if (updatedProgress) {
                onSetComplete(exerciseId, updatedProgress);
            }
        } catch (err) {
            console.error("[useExerciseSetCompletion] Error completing all sets:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        isUpdating,
        handleSetCheckboxClick,
        handleCompleteAllSets
    };
}; 