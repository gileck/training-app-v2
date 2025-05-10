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
    allWorkoutExercises: WorkoutExercise[],
    activeWorkoutSession: WorkoutExercise[] | null,
    initialSelectionMode: boolean = false
): UseExerciseSelectionReturn => {
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(initialSelectionMode);

    // Effect to manage selection mode based on active workout removed,
    // as we now want to allow selection even if a workout is active.
    // The initialSelectionMode prop will set the default state.

    const handleExerciseSelect = useCallback((exerciseId: string) => {
        if (!showSelectionMode) return; // Still respect if user manually turned off selection mode

        setSelectedExercises(prev => {
            const isAlreadySelected = prev.includes(exerciseId);
            if (isAlreadySelected) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    }, [showSelectionMode]);

    const toggleSelectionMode = useCallback(() => {
        // Guard preventing toggle during active workout is removed.
        setShowSelectionMode(prev => {
            const newMode = !prev;
            if (prev && newMode === false) { // If user is manually turning OFF selection mode
                setSelectedExercises([]); // Clear selections when turning off selection mode
            }
            return newMode;
        });
    }, []); // Removed activeWorkoutSession from dependencies

    const clearSelections = useCallback(() => {
        setSelectedExercises([]);
        // We don't necessarily turn off selection mode here, 
        // as clearing might be for re-selecting.
        // User can use toggleSelectionMode to explicitly turn it off.
    }, []);

    const handleSelectAll = useCallback((exercisesToSelect: WorkoutExercise[]) => {
        // Guard preventing select all during active workout is removed.
        const allIds = exercisesToSelect.map(ex => ex._id.toString());
        setSelectedExercises(allIds);
        if (!showSelectionMode && allIds.length > 0) {
            setShowSelectionMode(true); // Automatically enter selection mode if not already in it
        }
    }, [showSelectionMode]);

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