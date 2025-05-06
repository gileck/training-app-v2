import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/client/router';
import { getExercises } from '@/apis/exercises/client';
import { getTrainingPlanById, getActiveTrainingPlan } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import { getWeeklyProgress } from '@/apis/weeklyProgress/client';
import { getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import { getAllSavedWorkouts, getSavedWorkoutDetails } from '@/apis/savedWorkouts/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinitionOption } from '@/apis/exerciseDefinitions/types';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
import { WorkoutExercise } from '@/client/types/workout';
import { EnhancedWorkout } from '../ui/types';

// Helper function to create the definition map
const createDefinitionMap = (defs: ExerciseDefinitionOption[]): Record<string, string> => {
    return defs.reduce((acc: Record<string, string>, def: ExerciseDefinitionOption) => {
        acc[def._id.toString()] = def.name;
        return acc;
    }, {});
};

export const useWorkoutView = () => {
    const { routeParams, navigate } = useRouter();
    const [planId, setPlanId] = useState<string | undefined>(routeParams.planId as string | undefined);
    const weekNumber = parseInt(routeParams.weekNumber as string || '1', 10);

    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    // State for saved workouts
    const [savedWorkouts, setSavedWorkouts] = useState<EnhancedWorkout[]>([]);
    const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(false);

    // State for exercise selection
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(false);

    // Fetch active training plan if no planId is provided
    useEffect(() => {
        async function fetchActivePlan() {
            if (!planId) {
                try {
                    const response = await getActiveTrainingPlan();
                    if (response.data && !('plan' in response.data) && 'name' in response.data) {
                        const activePlanId = response.data._id.toString();
                        setPlanId(activePlanId);
                    } else {
                        setError("No active training plan found. Please select a plan.");
                        setIsLoading(false);
                    }
                } catch (err) {
                    console.error("Failed to fetch active training plan:", err);
                    setError("Failed to fetch active training plan. Please select a plan manually.");
                    setIsLoading(false);
                }
            }
        }
        fetchActivePlan();
    }, [planId]);

    const fetchData = useCallback(async () => {
        if (!planId || isNaN(weekNumber) || weekNumber < 1) {
            if (!planId) {
                return; // Wait for active plan to be fetched
            }
            setError("Invalid Plan ID or Week Number in URL.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Fetch plan, exercises, definitions, and progress for all exercises
            const [planRes, exercisesRes, definitionsRes] = await Promise.all([
                getTrainingPlanById({ planId }),
                getExercises({ trainingPlanId: planId }),
                getAllExerciseDefinitionOptions(),
            ]);

            // Process Plan
            if (!(planRes.data && 'name' in planRes.data)) {
                throw new Error('Failed to fetch plan details or plan not found');
            }
            const currentPlan = planRes.data;
            setPlanDetails(currentPlan);

            // Process Definitions directly into a map
            const defMap = createDefinitionMap((definitionsRes.data && Array.isArray(definitionsRes.data)) ? definitionsRes.data : []);

            // Process Exercises
            if (!(exercisesRes.data && Array.isArray(exercisesRes.data))) {
                throw new Error('Failed to fetch exercises for the plan');
            }
            const planExercises: ExerciseBase[] = exercisesRes.data;

            // Fetch progress for each exercise in parallel
            const progressPromises = planExercises.map(ex =>
                getWeeklyProgress({ planId, exerciseId: ex._id.toString(), weekNumber })
            );

            // Fetch complete exercise definitions in parallel
            const definitionPromises = planExercises.map(ex =>
                getExerciseDefinitionById({ definitionId: ex.exerciseDefinitionId.toString() })
            );

            const [progressResults, definitionResults] = await Promise.all([
                Promise.allSettled(progressPromises),
                Promise.allSettled(definitionPromises)
            ]);

            // Combine exercises with their progress, definition names, and definition details
            const exercisesWithDetails = planExercises.map((ex, index) => {
                // Process progress data
                const progressResult = progressResults[index];
                let progressData: WeeklyProgressBase | undefined = undefined;
                if (progressResult.status === 'fulfilled' && progressResult.value.data) {
                    progressData = progressResult.value.data;
                } else if (progressResult.status === 'rejected') {
                    console.warn(`Failed to fetch progress for exercise ${ex._id}:`, progressResult.reason);
                }

                // Process definition data
                const definitionResult = definitionResults[index];
                let definitionData = undefined;
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
                    name: defMap[ex.exerciseDefinitionId.toString()],
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
            fetchData();
        }
    }, [fetchData, planId]);

    // Enhanced function to fetch saved workouts with their exercises
    const fetchSavedWorkouts = useCallback(async () => {
        setIsWorkoutsLoading(true);
        try {
            // 1. Get all saved workouts
            const response = await getAllSavedWorkouts();

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Failed to fetch saved workouts');
            }

            // 2. Fetch all exercises for the current plan to get sets/reps data
            const planExercisesResponse = await getExercises({ trainingPlanId: planId || '' });

            if (!planExercisesResponse.data || !Array.isArray(planExercisesResponse.data)) {
                throw new Error('Failed to fetch plan exercises');
            }

            // Create a map of exercise definition IDs to their complete data
            const planExercisesMap = planExercisesResponse.data.reduce((map, exercise) => {
                const defId = exercise.exerciseDefinitionId.toString();
                map[defId] = exercise;
                return map;
            }, {} as Record<string, ExerciseBase>);

            // 3. Enhance each workout with its exercises
            const enhancedWorkoutsPromises = response.data.map(async (workout) => {
                try {
                    // Get workout details with exercises
                    const workoutDetailsResponse = await getSavedWorkoutDetails({
                        workoutId: workout._id.toString()
                    });

                    if (!workoutDetailsResponse.data || !workoutDetailsResponse.data.exercises) {
                        return {
                            ...workout,
                            enhancedExercises: [],
                            isExpanded: false,
                            error: 'Failed to fetch workout details'
                        };
                    }

                    const rawExercises = workoutDetailsResponse.data.exercises;

                    // Process each exercise in the workout
                    const exercisePromises = rawExercises.map(async (exercise) => {
                        // Get the exercise definition ID
                        const defId = exercise.exerciseDefinitionId.toString();

                        // Find the corresponding exercise in the plan
                        const planExercise = planExercisesMap[defId];

                        if (!planExercise) {
                            throw new Error(`Exercise not found in training plan: ${defId}`);
                        }

                        // Fetch progress data for this exercise using the planExercise._id
                        const progressResponse = await getWeeklyProgress({
                            planId: planId || '',
                            exerciseId: planExercise._id.toString(),
                            weekNumber
                        });

                        // Fetch definition data
                        const definitionResponse = await getExerciseDefinitionById({
                            definitionId: defId
                        });

                        // Construct the WorkoutExercise object for the UI
                        return {
                            ...exercise,
                            _id: planExercise._id,
                            exerciseDefinitionId: planExercise.exerciseDefinitionId,
                            trainingPlanId: planExercise.trainingPlanId,
                            sets: planExercise.sets,
                            reps: planExercise.reps,
                            weight: planExercise.weight,
                            name: definitionResponse.data?.name || 'Exercise (name not found)',
                            progress: progressResponse.data,
                            definition: definitionResponse.data ? {
                                primaryMuscle: definitionResponse.data.primaryMuscle,
                                secondaryMuscles: definitionResponse.data.secondaryMuscles,
                                bodyWeight: definitionResponse.data.bodyWeight,
                                type: definitionResponse.data.type,
                                imageUrl: definitionResponse.data.imageUrl,
                                hasComments: !!(progressResponse.data?.weeklyNotes?.length)
                            } : undefined
                        } as WorkoutExercise;
                    });

                    // Use Promise.allSettled to handle errors for individual exercises
                    const exerciseResults = await Promise.allSettled(exercisePromises);

                    // Check for errors
                    const rejectedExercises = exerciseResults.filter(
                        result => result.status === 'rejected'
                    );

                    // If any exercises failed, add an error to the workout
                    let workoutError = undefined;
                    if (rejectedExercises.length > 0) {
                        const firstError = rejectedExercises[0] as PromiseRejectedResult;
                        workoutError = `Failed to load some exercises: ${firstError.reason.message || 'Unknown error'}`;
                    }

                    // Get the successful exercise results
                    const enhancedExercises = exerciseResults
                        .filter((result): result is PromiseFulfilledResult<WorkoutExercise> =>
                            result.status === 'fulfilled'
                        )
                        .map(result => result.value);

                    // Return enhanced workout with exercises
                    return {
                        ...workout,
                        enhancedExercises,
                        isExpanded: false,
                        error: workoutError
                    };
                } catch (error) {
                    // Handle errors for entire workout
                    return {
                        ...workout,
                        enhancedExercises: [],
                        isExpanded: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });

            // Wait for all workouts to be processed
            const enhancedWorkouts = await Promise.all(enhancedWorkoutsPromises);
            setSavedWorkouts(enhancedWorkouts);

        } catch (error) {
            console.error('Failed to fetch saved workouts:', error);
            // Don't set global error as this is just for one tab
        } finally {
            setIsWorkoutsLoading(false);
        }
    }, [planId, weekNumber]);

    // Function to toggle workout expanded state
    const toggleWorkoutExpanded = useCallback((workoutId: string) => {
        setSavedWorkouts(prevWorkouts =>
            prevWorkouts.map(workout =>
                workout._id.toString() === workoutId
                    ? { ...workout, isExpanded: !workout.isExpanded }
                    : workout
            )
        );
    }, []);

    // Handler to update local state when a set is completed via API
    const handleSetCompletionUpdate = (exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id.toString() === exerciseId
                    ? { ...ex, progress: updatedProgress }
                    : ex
            )
        );
    };

    // Handler to update set completion for exercises in a Saved Workout
    const handleSavedWorkoutExerciseSetCompletionUpdate = useCallback((workoutId: string, exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setSavedWorkouts(prevSavedWorkouts =>
            prevSavedWorkouts.map(workout => {
                if (workout._id.toString() === workoutId) {
                    return {
                        ...workout,
                        enhancedExercises: workout.enhancedExercises.map(ex =>
                            ex._id.toString() === exerciseId
                                ? { ...ex, progress: updatedProgress }
                                : ex
                        )
                    };
                }
                return workout;
            })
        );
    }, []);

    // Separate exercises into active and completed
    const activeExercises = workoutExercises.filter(ex => {
        const setsDone = ex.progress?.setsCompleted || 0;
        return setsDone < ex.sets;
    });

    const completedExercises = workoutExercises.filter(ex => {
        const setsDone = ex.progress?.setsCompleted || 0;
        return setsDone >= ex.sets;
    });

    // Calculate weekly progress
    const totalExercises = workoutExercises.length;
    const completedExercisesCount = completedExercises.length;
    const progressPercentage = totalExercises > 0 ? (completedExercisesCount / totalExercises) * 100 : 0;

    // Handle exercise selection
    const handleExerciseSelect = (exerciseId: string) => {
        setSelectedExercises(prev => {
            if (prev.includes(exerciseId)) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    };

    // Start selection mode
    const handleStartSelectionMode = () => {
        setShowSelectionMode(true);
        setSelectedExercises([]);
    };

    // Cancel selection mode
    const handleCancelSelectionMode = () => {
        setShowSelectionMode(false);
        setSelectedExercises([]);
    };

    // Start workout with selected exercises
    const handleStartWorkout = () => {
        if (selectedExercises.length === 0) {
            return;
        }

        navigate(`/workout-page?planId=${planId}&week=${weekNumber}&exercises=${selectedExercises.join(',')}`);
    };

    // Toggle show completed exercises
    const toggleShowCompleted = () => {
        setShowCompleted(!showCompleted);
    };

    // Handle navigate week
    const handleNavigateWeek = (week: number) => {
        if (week >= 1 && week <= (planDetails?.durationWeeks || 1)) {
            navigate(`/workout/${planId}/${week}`);
        }
    };

    return {
        // State
        planId,
        weekNumber,
        planDetails,
        isLoading,
        error,
        workoutExercises,
        activeExercises,
        completedExercises,
        showCompleted,
        selectedExercises,
        showSelectionMode,
        progressPercentage,
        totalExercises,
        completedExercisesCount,
        savedWorkouts,
        isWorkoutsLoading,
        toggleWorkoutExpanded,

        // Actions
        navigate,
        handleSetCompletionUpdate,
        handleSavedWorkoutExerciseSetCompletionUpdate,
        handleExerciseSelect,
        handleStartSelectionMode,
        handleCancelSelectionMode,
        handleStartWorkout,
        toggleShowCompleted,
        handleNavigateWeek,
        fetchSavedWorkouts
    };
}; 