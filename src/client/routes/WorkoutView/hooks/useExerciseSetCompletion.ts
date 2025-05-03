import { useState } from 'react';
import { updateSetCompletion } from '@/apis/weeklyProgress/client';
import { WeeklyProgressBase } from '@/apis/weeklyProgress/types';

export const useExerciseSetCompletion = (
    planId: string,
    weekNumber: number,
    onSetComplete: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void
) => {
    const [isUpdating, setIsUpdating] = useState(false);

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
            const requestParams = {
                planId,
                exerciseId,
                weekNumber,
                setsIncrement: increment,
                totalSetsForExercise: totalSets
            };

            const response = await updateSetCompletion(requestParams);

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exerciseId, response.data.updatedProgress);
            } else {
                console.error("[useExerciseSetCompletion] Failed to update set completion:",
                    response.data?.message || 'No error message provided.', response);
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
            const requestParams = {
                planId,
                exerciseId,
                weekNumber,
                setsIncrement: 1, // This value is ignored when completeAll is true
                totalSetsForExercise: totalSets,
                completeAll: true
            };

            const response = await updateSetCompletion(requestParams);

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exerciseId, response.data.updatedProgress);
            } else {
                console.error("[useExerciseSetCompletion] Failed to complete all sets:",
                    response.data?.message || 'No error message provided.', response);
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