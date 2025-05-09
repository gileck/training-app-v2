import { useState, useCallback, useEffect } from 'react';
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
    activeWorkoutSession: WorkoutExercise[] | null, // To prevent selection if active workout
    initialSelectionMode: boolean = false // Optional parameter to set initial selection mode
): UseExerciseSelectionReturn => {
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(initialSelectionMode);

    // Clear selections when activeWorkoutSession changes
    useEffect(() => {
        if (activeWorkoutSession) {
            setSelectedExercises([]);
            setShowSelectionMode(false);
        }
    }, [activeWorkoutSession]);

    const handleExerciseSelect = useCallback((exerciseId: string) => {
        if (!showSelectionMode) return;

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
        // Don't allow entering selection mode if there's an active workout
        if (activeWorkoutSession && !showSelectionMode) {
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