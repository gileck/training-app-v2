import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllSavedWorkouts, getSavedWorkoutDetails } from '@/apis/savedWorkouts/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import { WorkoutExercise } from '@/client/types/workout';
import { EnhancedWorkout } from '../components/types'; // Assuming this type is still relevant or will be adjusted

interface SavedWorkoutStructure {
    _id: string;
    name: string;
    exercises: ExerciseBase[];
}

export interface UseSavedWorkoutsDataReturn {
    savedWorkouts: EnhancedWorkout[];
    isWorkoutsLoading: boolean;
    fetchSavedWorkoutStructures: () => Promise<void>;
    toggleWorkoutExpanded: (workoutId: string) => void;
    // handleSavedWorkoutExerciseSetCompletionUpdate will be handled by the main hook or another specialized one
    // as it needs to modify workoutExercises from usePlanExercises
    error: string | null;
}

export const useSavedWorkoutsData = (
    planId: string | undefined,
    workoutExercises: WorkoutExercise[],
    onSetCompletionUpdate: (exerciseId: string, updatedProgress: any) => void // More specific type needed
): UseSavedWorkoutsDataReturn => {
    const [savedWorkoutStructures, setSavedWorkoutStructures] = useState<SavedWorkoutStructure[]>([]);
    const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(false);
    const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const fetchSavedWorkoutStructures = useCallback(async () => {
        if (!planId) {
            // console.warn("fetchSavedWorkoutStructures called without planId being set.");
            // No need to set loading true if we don't fetch
            return;
        }
        setIsWorkoutsLoading(true);
        setError(null);
        try {
            const savedWorkoutsListResponse = await getAllSavedWorkouts();

            if (!savedWorkoutsListResponse.data || !Array.isArray(savedWorkoutsListResponse.data)) {
                throw new Error('Failed to fetch the list of saved workouts.');
            }

            const structuresPromises = savedWorkoutsListResponse.data.map(async (swHeader) => {
                const detailsResponse = await getSavedWorkoutDetails({ workoutId: swHeader._id.toString() });

                if (!detailsResponse.data || !Array.isArray(detailsResponse.data.exercises)) {
                    console.error(`Failed to load exercise details for saved workout: ${swHeader.name}`);
                    return null;
                }
                return {
                    _id: swHeader._id.toString(),
                    name: swHeader.name,
                    exercises: detailsResponse.data.exercises,
                } as SavedWorkoutStructure;
            });

            const newSavedWorkoutStructures = (await Promise.all(structuresPromises))
                .filter(structure => structure !== null) as SavedWorkoutStructure[];

            setSavedWorkoutStructures(newSavedWorkoutStructures);

        } catch (err) {
            console.error("Failed to load saved workout structures:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching saved workout structures');
            setSavedWorkoutStructures([]);
        } finally {
            setIsWorkoutsLoading(false);
        }
    }, [planId]); // Removed dependencies that are not used inside this useCallback

    useEffect(() => {
        if (planId) {
            fetchSavedWorkoutStructures();
        }
    }, [planId, fetchSavedWorkoutStructures]);

    const toggleWorkoutExpanded = useCallback((workoutId: string) => {
        setExpandedWorkoutIds(prev => ({
            ...prev,
            [workoutId]: !prev[workoutId]
        }));
    }, []);

    const displayedSavedWorkouts = useMemo(() => {
        return savedWorkoutStructures.map(structure => {
            const enhancedExercises = structure.exercises
                .map(savedExBase => {
                    const liveWorkoutExercise = workoutExercises.find(
                        wEx => wEx.exerciseDefinitionId.toString() === savedExBase.exerciseDefinitionId.toString()
                    );
                    if (liveWorkoutExercise) {
                        return liveWorkoutExercise;
                    }
                    // console.warn(`No live exercise found for definitionId: ${savedExBase.exerciseDefinitionId} from saved workout: ${structure.name}.`);
                    return null;
                })
                .filter(Boolean) as WorkoutExercise[];

            return {
                _id: structure._id,
                name: structure.name,
                isExpanded: !!expandedWorkoutIds[structure._id],
                enhancedExercises: enhancedExercises,
            } as EnhancedWorkout;
        });
    }, [savedWorkoutStructures, workoutExercises, expandedWorkoutIds]);

    return {
        savedWorkouts: displayedSavedWorkouts,
        isWorkoutsLoading,
        fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,
        error,
    };
}; 