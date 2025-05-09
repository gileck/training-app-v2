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

    // Debug logging
    useEffect(() => {
        console.log("useExerciseSelection state:", {
            showSelectionMode,
            selectedExercises,
            activeWorkoutSession: !!activeWorkoutSession
        });
    }, [showSelectionMode, selectedExercises, activeWorkoutSession]);

    // Clear selections when activeWorkoutSession changes
    useEffect(() => {
        if (activeWorkoutSession) {
            console.log("Active workout detected - clearing selections");
            setSelectedExercises([]);
            setShowSelectionMode(false);
        }
    }, [activeWorkoutSession]);

    const handleExerciseSelect = useCallback((exerciseId: string) => {
        console.log("handleExerciseSelect called with:", exerciseId, "showSelectionMode:", showSelectionMode);

        if (!showSelectionMode) {
            console.log("Selection rejected - not in selection mode");
            return;
        }

        setSelectedExercises(prev => {
            const isAlreadySelected = prev.includes(exerciseId);
            console.log("Current selections:", prev, "Is already selected:", isAlreadySelected);

            if (isAlreadySelected) {
                // Remove
                const newList = prev.filter(id => id !== exerciseId);
                console.log("Removing selection, new list:", newList);
                return newList;
            } else {
                // Add
                const newList = [...prev, exerciseId];
                console.log("Adding selection, new list:", newList);
                return newList;
            }
        });
    }, [showSelectionMode]);

    const toggleSelectionMode = useCallback(() => {
        console.log("toggleSelectionMode called, current mode:", showSelectionMode);

        // Don't allow entering selection mode if there's an active workout
        if (activeWorkoutSession && !showSelectionMode) {
            console.log("Cannot enter selection mode - active workout exists");
            return;
        }

        setShowSelectionMode(prev => {
            const newMode = !prev;
            console.log("Setting selection mode to:", newMode);

            if (prev) { // If exiting selection mode, clear selections
                console.log("Exiting selection mode - clearing selections");
                setSelectedExercises([]);
            }
            return newMode;
        });
    }, [activeWorkoutSession, showSelectionMode]);

    const clearSelections = useCallback(() => {
        console.log("clearSelections called");
        setSelectedExercises([]);
        setShowSelectionMode(false);
    }, []);

    const handleSelectAll = useCallback((exercisesToSelect: WorkoutExercise[]) => {
        console.log("handleSelectAll called with", exercisesToSelect.length, "exercises");

        if (activeWorkoutSession) {
            console.log("Cannot select all - active workout exists");
            return;
        }
        const allIds = exercisesToSelect.map(ex => ex._id.toString());
        console.log("Selecting all IDs:", allIds);
        setSelectedExercises(allIds);
        if (!showSelectionMode && allIds.length > 0) {
            console.log("Enabling selection mode");
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