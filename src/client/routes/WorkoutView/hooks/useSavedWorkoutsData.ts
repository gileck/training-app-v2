import { useState, useCallback, useMemo } from 'react';
import { useSavedWorkouts } from '@/client/hooks/useTrainingData';
import { WorkoutExercise } from '@/client/types/workout';
import { EnhancedWorkout } from '../components/types';

export interface UseSavedWorkoutsDataReturn {
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;
    fetchSavedWorkoutStructures: () => Promise<void>;
    toggleWorkoutExpanded: (workoutId: string) => void;
    error: string | null;
}

export const useSavedWorkoutsData = (
    planId: string | undefined,
    workoutExercises: WorkoutExercise[]
): UseSavedWorkoutsDataReturn => {
    const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Record<string, boolean>>({});

    const { savedWorkouts, isLoading, error, loadSavedWorkouts } = useSavedWorkouts(planId || '');

    const fetchSavedWorkoutStructures = useCallback(async () => {
        if (!planId) return;
        await loadSavedWorkouts();
    }, [planId, loadSavedWorkouts]);

    const toggleWorkoutExpanded = useCallback((workoutId: string) => {
        setExpandedWorkoutIds(prev => ({
            ...prev,
            [workoutId]: !prev[workoutId]
        }));
    }, []);

    const displayedSavedWorkouts = useMemo(() => {
        return savedWorkouts.map(workout => {
            const enhancedExercises = workout.exercises
                .map((exerciseRef) => {
                    const liveWorkoutExercise = workoutExercises.find(
                        wEx => wEx._id === exerciseRef.exerciseId
                    );
                    if (liveWorkoutExercise) {
                        return liveWorkoutExercise;
                    }
                    return null;
                })
                .filter(Boolean) as WorkoutExercise[];

            return {
                _id: workout._id,
                name: workout.name,
                isExpanded: !!expandedWorkoutIds[workout._id],
                enhancedExercises: enhancedExercises,
            } as EnhancedWorkout;
        });
    }, [savedWorkouts, workoutExercises, expandedWorkoutIds]);

    return {
        savedWorkouts: displayedSavedWorkouts,
        isWorkoutsLoading: isLoading,
        fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,
        error,
    };
}; 