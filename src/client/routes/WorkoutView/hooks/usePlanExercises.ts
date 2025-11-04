import { useMemo, useCallback, useState, useEffect } from 'react';
import { useExercises, useWeeklyProgress, useTrainingPlans } from '@/client/hooks/useTrainingData';
import { getAllExerciseDefinitionOptions, getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { WeeklyProgressBase, ExerciseBase, TrainingPlan } from '@/common/types/training';
import { WorkoutExercise } from '@/client/types/workout';
import { useRouter } from '@/client/router';

// Helper function to create the definition map
const createDefinitionMap = (defs: ExerciseDefinition[]): Record<string, string> => {
    return defs.reduce((acc: Record<string, string>, def: ExerciseDefinition) => {
        acc[def._id.toString()] = def.name;
        return acc;
    }, {});
};

export interface UsePlanExercisesReturn {
    planId?: string;
    weekNumber: number;
    planDetails: { name: string; durationWeeks: number } | null;
    workoutExercises: WorkoutExercise[];
    isLoading: boolean;
    error: string | null;
    fetchPlanData: () => Promise<void>;
    handleSetCompletionUpdate: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    activePlanExercises: WorkoutExercise[];
    completedPlanExercises: WorkoutExercise[];
    progressPercentage: number;
    totalExercises: number;
    completedExercisesCount: number;
    completedSetsCount: number;
    totalSetsCount: number;
    setPlanId: (id: string) => void;
    setWorkoutExercises: React.Dispatch<React.SetStateAction<WorkoutExercise[]>>;
}

export const usePlanExercises = (initialPlanId?: string, initialWeekNumber?: number): UsePlanExercisesReturn => {
    const { routeParams, navigate } = useRouter();
    const [planId, setPlanIdState] = useState<string | undefined>(initialPlanId || routeParams.planId as string | undefined);
    const [weekNumber, setWeekNumberState] = useState<number>(initialWeekNumber || parseInt(routeParams.weekNumber as string || '1', 10));
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [definitionMap, setDefinitionMap] = useState<Record<string, string>>({});

    const { activeTrainingPlan, trainingPlans, isLoading: initialLoading } = useTrainingPlans();
    const { exercises, isLoading: exercisesLoading, error: exercisesError } = useExercises(planId || '');
    const { progress, isLoading: progressLoading, error: progressError } = useWeeklyProgress(planId || '', weekNumber);

    const setPlanId = useCallback((id: string) => {
        setPlanIdState(id);
    }, []);

    // Auto-set planId from active plan if not provided
    useEffect(() => {
        if (!planId && activeTrainingPlan) {
            const activePlanId = activeTrainingPlan._id;
            setPlanIdState(activePlanId);
            if (!routeParams.planId) {
                // Try to restore last selected week for this plan from localStorage
                let targetWeek = weekNumber;
                try {
                    const stored = localStorage.getItem(`workout:lastWeek:${activePlanId}`);
                    const parsed = stored ? parseInt(stored, 10) : NaN;
                    if (Number.isFinite(parsed) && parsed >= 1) {
                        targetWeek = parsed;
                    }
                } catch {
                    // ignore storage errors
                }
                navigate(`/workout/${activePlanId}/${targetWeek}`, { replace: true });
            }
        }
    }, [planId, activeTrainingPlan, routeParams.planId, weekNumber, navigate]);

    // Update weekNumber from route params
    useEffect(() => {
        const newWeekNumber = parseInt(routeParams.weekNumber as string || '1', 10);
        if (newWeekNumber !== weekNumber) {
            setWeekNumberState(newWeekNumber);
        }
        // Persist current week selection per plan in localStorage
        if (planId && Number.isFinite(newWeekNumber) && newWeekNumber >= 1) {
            try {
                localStorage.setItem(`workout:lastWeek:${planId}`, String(newWeekNumber));
            } catch {
                // ignore storage errors
            }
        }
    }, [routeParams.weekNumber, weekNumber, planId]);

    // Load exercise definitions
    useEffect(() => {
        async function loadDefinitions() {
            try {
                const response = await getAllExerciseDefinitionOptions();
                if (response.data && Array.isArray(response.data)) {
                    const newDefinitionMap = createDefinitionMap(response.data as ExerciseDefinition[]);
                    setDefinitionMap(prevMap => {
                        // Only update if the map actually changed
                        const hasChanged = Object.keys(newDefinitionMap).length !== Object.keys(prevMap).length ||
                            Object.keys(newDefinitionMap).some(key => newDefinitionMap[key] !== prevMap[key]);
                        return hasChanged ? newDefinitionMap : prevMap;
                    });
                }
            } catch (err) {
                console.error("Failed to load exercise definitions:", err);
            }
        }
        loadDefinitions();
    }, []);

    // Build workout exercises from context data
    useEffect(() => {
        if (!exercises.length || !planId) {
            setWorkoutExercises([]);
            return;
        }

        const buildWorkoutExercises = async () => {
            const exercisesWithDetails = await Promise.all(
                exercises.map(async (ex: ExerciseBase) => {
                    const exerciseProgress = progress.find((p: WeeklyProgressBase) => p.exerciseId === ex._id);

                    let exerciseName = 'Unknown Exercise';
                    let definitionData: Partial<Pick<ExerciseDefinition, 'primaryMuscle' | 'secondaryMuscles' | 'bodyWeight' | 'type' | 'imageUrl'> & { hasComments?: boolean }> | undefined = undefined;

                    try {
                        const defResponse = await getExerciseDefinitionById({ definitionId: ex.exerciseDefinitionId });
                        if (defResponse.data) {
                            const def = defResponse.data;
                            exerciseName = def.name; // Use the name from the API response
                            definitionData = {
                                primaryMuscle: def.primaryMuscle,
                                secondaryMuscles: def.secondaryMuscles,
                                bodyWeight: def.bodyWeight,
                                type: def.type,
                                imageUrl: def.imageUrl,
                                hasComments: !!(exerciseProgress?.weeklyNotes?.length)
                            };
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch definition for exercise ${ex._id}:`, err);
                        // Fallback to definition map if individual fetch fails
                        exerciseName = definitionMap[ex.exerciseDefinitionId] || 'Unknown Exercise';
                    }

                    return {
                        ...ex,
                        name: exerciseName,
                        progress: exerciseProgress,
                        definition: definitionData
                    };
                })
            );
            setWorkoutExercises(prev => {
                // Only update if the data actually changed
                const hasChanged = prev.length !== exercisesWithDetails.length ||
                    prev.some((prevEx, idx) =>
                        prevEx._id !== exercisesWithDetails[idx]._id ||
                        prevEx.progress?.setsCompleted !== exercisesWithDetails[idx].progress?.setsCompleted
                    );
                return hasChanged ? exercisesWithDetails : prev;
            });
        };

        buildWorkoutExercises();
    }, [exercises.length, progress.length, planId]);

    const fetchPlanData = useCallback(async () => {
        // Context automatically handles data loading, so this is mostly a no-op
        // but kept for compatibility with existing components
    }, []);

    const handleSetCompletionUpdate = useCallback((exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id === exerciseId
                    ? { ...ex, progress: updatedProgress }
                    : ex
            )
        );
        // Context updates are now handled by useExerciseSetCompletion
    }, []);

    const planDetails = useMemo(() => {
        if (!planId) return null;
        const plan = trainingPlans.find((p: TrainingPlan) => p._id === planId);
        return plan ? { name: plan.name, durationWeeks: plan.durationWeeks } : null;
    }, [planId, trainingPlans]);

    const activePlanExercises = useMemo(() => workoutExercises.filter(ex => {
        const setsPrescribed = ex.sets;
        const setsDone = ex.progress?.setsCompleted || 0;
        return setsDone < setsPrescribed;
    }), [workoutExercises]);

    const completedPlanExercises = useMemo(() => workoutExercises.filter(ex => {
        const setsPrescribed = ex.sets;
        const setsDone = ex.progress?.setsCompleted || 0;
        return setsDone >= setsPrescribed;
    }), [workoutExercises]);

    const { totalExercises, completedExercisesCount, completedSetsCount, totalSetsCount } = useMemo(() => {
        const total = workoutExercises.length;
        const completed = completedPlanExercises.length;
        const totalSets = workoutExercises.reduce((sum, ex) => sum + ex.sets, 0);
        const completedSets = workoutExercises.reduce((sum, ex) => sum + (ex.progress?.setsCompleted || 0), 0);

        return {
            totalExercises: total,
            completedExercisesCount: completed,
            completedSetsCount: completedSets,
            totalSetsCount: totalSets
        };
    }, [workoutExercises, completedPlanExercises]);

    const progressPercentage = useMemo(() => {
        if (totalSetsCount === 0) return 0;
        return Math.round((completedSetsCount / totalSetsCount) * 100);
    }, [completedSetsCount, totalSetsCount]);

    const isLoading = initialLoading || exercisesLoading || progressLoading;
    const error = exercisesError || progressError;

    return {
        planId,
        weekNumber,
        planDetails,
        workoutExercises,
        isLoading,
        error,
        fetchPlanData,
        handleSetCompletionUpdate,
        activePlanExercises,
        completedPlanExercises,
        progressPercentage,
        totalExercises,
        completedExercisesCount,
        completedSetsCount,
        totalSetsCount,
        setPlanId,
        setWorkoutExercises
    };
}; 