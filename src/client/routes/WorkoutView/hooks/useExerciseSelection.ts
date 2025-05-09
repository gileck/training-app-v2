import { useState, useCallback } from 'react';
import { WorkoutExercise } from '@/client/types/workout';

export interface UseExerciseSelectionReturn {
    selectedExercises: string[];
    showSelectionMode: boolean;
    selectedExercisesDetails: WorkoutExercise[];
    handleExerciseSelect: (exerciseId: string) => void;
    toggleSelectionMode: () => void;
    clearSelections: () => void;
    handleSelectAll: (exercises: WorkoutExercise[]) => void;
}

export const useExerciseSelection = (
    allWorkoutExercises: WorkoutExercise[], // All exercises available for selection
    activeWorkoutSession: WorkoutExercise[] | null // To prevent selection if active workout
): UseExerciseSelectionReturn => {
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(false);

    const handleExerciseSelect = useCallback((exerciseId: string) => {
        setSelectedExercises(prev =>
            prev.includes(exerciseId)
                ? prev.filter(id => id !== exerciseId)
                : [...prev, exerciseId]
        );
    }, []);

    const toggleSelectionMode = useCallback(() => {
        if (activeWorkoutSession && !showSelectionMode) {
            // If trying to enter selection mode while an active session exists, do nothing or show a message.
            // For now, just preventing entering selection mode.
            // console.log("Cannot enter selection mode while a workout is active.");
            return;
        }
        setShowSelectionMode(prev => {
            if (prev) { // If exiting selection mode, clear selections
                setSelectedExercises([]);
            }
            return !prev;
        });
    }, [activeWorkoutSession, showSelectionMode]);

    const clearSelections = useCallback(() => {
        setSelectedExercises([]);
        setShowSelectionMode(false);
    }, []);

    const handleSelectAll = useCallback((exercisesToSelect: WorkoutExercise[]) => {
        if (activeWorkoutSession) {
            // console.log("Cannot select all while a workout is active.");
            return;
        }
        const allIds = exercisesToSelect.map(ex => ex._id.toString());
        setSelectedExercises(allIds);
        if (!showSelectionMode && allIds.length > 0) {
            setShowSelectionMode(true);
        }
    }, [activeWorkoutSession, showSelectionMode]);

    const selectedExercisesDetails = allWorkoutExercises.filter(ex => selectedExercises.includes(ex._id.toString()));

    return {
        selectedExercises,
        showSelectionMode,
        selectedExercisesDetails,
        handleExerciseSelect,
        toggleSelectionMode,
        clearSelections,
        handleSelectAll,
    };
}; 