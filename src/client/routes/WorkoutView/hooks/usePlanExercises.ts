import { useState, useEffect, useCallback, useMemo } from 'react';
import { getExercises } from '@/apis/exercises/client';
import { getTrainingPlanById, getActiveTrainingPlan } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions, getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import { getWeeklyProgress } from '@/apis/weeklyProgress/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
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
    planDetails: TrainingPlan | null;
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

    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const setPlanId = useCallback((id: string) => {
        setPlanIdState(id);
    }, []);

    useEffect(() => {
        if (initialPlanId && initialPlanId !== planId) {
            setPlanIdState(initialPlanId);
        }
    }, [initialPlanId, planId]);

    useEffect(() => {
        const newWeekNumber = parseInt(routeParams.weekNumber as string || '1', 10);
        if (newWeekNumber !== weekNumber) {
            setWeekNumberState(newWeekNumber);
        }
    }, [routeParams.weekNumber, weekNumber]);


    // Fetch active training plan if no planId is provided
    useEffect(() => {
        async function fetchActivePlan() {
            if (!planId) {
                setIsLoading(true);
                try {
                    const response = await getActiveTrainingPlan();
                    if (response.data && !('plan' in response.data) && 'name' in response.data) {
                        const activePlanId = response.data._id.toString();
                        setPlanIdState(activePlanId);
                        // Navigate to include the planId in the URL if it wasn't there
                        if (!routeParams.planId && activePlanId) {
                            navigate(`/workout/${activePlanId}/${weekNumber}`, { replace: true });
                        }
                    } else {
                        setError("No active training plan found. Please select a plan.");
                    }
                } catch (err) {
                    console.error("Failed to fetch active training plan:", err);
                    setError("Failed to fetch active training plan. Please select a plan manually.");
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchActivePlan();
    }, [planId, routeParams.planId, weekNumber, navigate]);

    const fetchPlanData = useCallback(async () => {
        if (!planId || isNaN(weekNumber) || weekNumber < 1) {
            if (!planId) { // Still waiting for active plan
                setIsLoading(true); // Show loading until planId is set
                return;
            }
            setError("Invalid Plan ID or Week Number in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [planRes, exercisesRes, definitionsRes] = await Promise.all([
                getTrainingPlanById({ planId }),
                getExercises({ trainingPlanId: planId }),
                getAllExerciseDefinitionOptions(),
            ]);

            if (!(planRes.data && 'name' in planRes.data)) {
                throw new Error('Failed to fetch plan details or plan not found');
            }
            const currentPlan = planRes.data;
            setPlanDetails(currentPlan);

            const defMap = createDefinitionMap((definitionsRes.data && Array.isArray(definitionsRes.data)) ? definitionsRes.data as ExerciseDefinition[] : []);

            if (!(exercisesRes.data && Array.isArray(exercisesRes.data))) {
                throw new Error('Failed to fetch exercises for the plan');
            }
            const planExercises: ExerciseBase[] = exercisesRes.data;

            const progressPromises = planExercises.map(ex =>
                getWeeklyProgress({ planId, exerciseId: ex._id.toString(), weekNumber })
            );
            const definitionPromises = planExercises.map(ex =>
                getExerciseDefinitionById({ definitionId: ex.exerciseDefinitionId.toString() })
            );

            const [progressResults, definitionResults] = await Promise.all([
                Promise.allSettled(progressPromises),
                Promise.allSettled(definitionPromises)
            ]);

            const exercisesWithDetails = planExercises.map((ex, index) => {
                const progressResult = progressResults[index];
                let progressData: WeeklyProgressBase | undefined = undefined;
                if (progressResult.status === 'fulfilled' && progressResult.value.data) {
                    progressData = progressResult.value.data as WeeklyProgressBase;
                } else if (progressResult.status === 'rejected') {
                    console.warn(`Failed to fetch progress for exercise ${ex._id}:`, progressResult.reason);
                }

                const definitionResult = definitionResults[index];
                let definitionData: Partial<Pick<ExerciseDefinition, 'primaryMuscle' | 'secondaryMuscles' | 'bodyWeight' | 'type' | 'imageUrl'> & { hasComments?: boolean }> | undefined = undefined;
                if (definitionResult.status === 'fulfilled' && definitionResult.value.data) {
                    const def = definitionResult.value.data;
                    definitionData = {
                        primaryMuscle: def.primaryMuscle,
                        secondaryMuscles: def.secondaryMuscles,
                        bodyWeight: def.bodyWeight,
                        type: def.type,
                        imageUrl: def.imageUrl,
                        hasComments: !!(progressData?.weeklyNotes?.length)
                    };
                }

                return {
                    ...ex,
                    name: defMap[ex.exerciseDefinitionId.toString()] || 'Unknown Exercise',
                    progress: progressData,
                    definition: definitionData
                };
            });
            setWorkoutExercises(exercisesWithDetails);
        } catch (err) {
            console.error("Failed to load workout data:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setPlanDetails(null);
            setWorkoutExercises([]);
        } finally {
            setIsLoading(false);
        }
    }, [planId, weekNumber]);

    useEffect(() => {
        if (planId) {
            fetchPlanData();
        }
    }, [planId, weekNumber, fetchPlanData]); // Added weekNumber here, so if weekNumber changes, data re-fetches

    const handleSetCompletionUpdate = useCallback((exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id.toString() === exerciseId
                    ? { ...ex, progress: updatedProgress }
                    : ex
            )
        );
    }, []);

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

    const progressPercentage = useMemo(() => {
        if (workoutExercises.length === 0) return 0;
        const totalPossibleSets = workoutExercises.reduce((acc, ex) => acc + ex.sets, 0);
        if (totalPossibleSets === 0) return 0; // Avoid division by zero
        const totalCompletedSets = workoutExercises.reduce((acc, ex) => acc + (ex.progress?.setsCompleted || 0), 0);
        return Math.round((totalCompletedSets / totalPossibleSets) * 100);
    }, [workoutExercises]);

    const totalExercises = useMemo(() => workoutExercises.length, [workoutExercises]);
    const completedExercisesCount = useMemo(() => completedPlanExercises.length, [completedPlanExercises]);
    const completedSetsCount = useMemo(() => workoutExercises.reduce((acc, ex) => acc + (ex.progress?.setsCompleted || 0), 0), [workoutExercises]);
    const totalSetsCount = useMemo(() => workoutExercises.reduce((acc, ex) => acc + ex.sets, 0), [workoutExercises]);

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
        setWorkoutExercises,
    };
}; 