import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { EnhancedWorkout } from '../components/types';

// --- New Structure Definitions ---
// SavedWorkoutExerciseStructure removed as it was unused
interface SavedWorkoutStructure {
    _id: string; // Saved Workout ID
    name: string;
    exercises: ExerciseBase[]; 
}
// --- End New Structure Definitions ---

// Helper function to create the definition map
const createDefinitionMap = (defs: ExerciseDefinitionOption[]): Record<string, string> => {
    return defs.reduce((acc: Record<string, string>, def: ExerciseDefinitionOption) => {
        acc[def._id.toString()] = def.name;
        return acc;
    }, {});
};

// Tab indices (can be moved to a shared constants file or kept here if only used by this hook and its consumers)
const EXERCISES_TAB_INDEX = 0;
// const WORKOUTS_TAB_INDEX = 1; // Already defined in MainView, ensure consistency or centralize
const ACTIVE_WORKOUT_TAB_INDEX = 2;

export const useWorkoutView = () => {
    const { routeParams, navigate } = useRouter();
    const [planId, setPlanId] = useState<string | undefined>(routeParams.planId as string | undefined);
    const weekNumber = parseInt(routeParams.weekNumber as string || '1', 10);

    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    // State for active workout session
    const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutExercise[] | null>(null);
    const [activeWorkoutName, setActiveWorkoutName] = useState<string | null>(null);

    // State for saved workout structures (templates)
    const [savedWorkoutStructures, setSavedWorkoutStructures] = useState<SavedWorkoutStructure[]>([]);
    const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(false);
    const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Record<string, boolean>>({});

    // State for exercise selection
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(false);

    // New state for activeTab, managed by the hook
    const [activeTab, setActiveTabState] = useState<number>(EXERCISES_TAB_INDEX);

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

    const fetchSavedWorkoutStructures = useCallback(async () => {
        if (!planId) {
            console.warn("fetchSavedWorkoutStructures called without planId being set.");
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
                    // Return a structure that indicates an error or skip it
                    return null; 
                }
                // getSavedWorkoutDetailsResponse has exercises as ExerciseBase[]
                return {
                    _id: swHeader._id.toString(),
                    name: swHeader.name,
                    exercises: detailsResponse.data.exercises, // This is ExerciseBase[]
                } as SavedWorkoutStructure;
            });

            const newSavedWorkoutStructures = (await Promise.all(structuresPromises))
                .filter(structure => structure !== null) as SavedWorkoutStructure[];
            
            setSavedWorkoutStructures(newSavedWorkoutStructures);

        } catch (err) {
            console.error("Failed to load saved workout structures:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching saved workout structures');
            setSavedWorkoutStructures([]); // Clear previous structures on error
        } finally {
            setIsWorkoutsLoading(false);
        }
    }, [planId, setIsLoading, setError, setSavedWorkoutStructures]);

    useEffect(() => {
        if (planId) {
            fetchData();
            if (fetchSavedWorkoutStructures) {
                fetchSavedWorkoutStructures();
            }
        }
    }, [planId, fetchData, fetchSavedWorkoutStructures]);

    const handleSetCompletionUpdate = useCallback((exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id.toString() === exerciseId
                    ? { ...ex, progress: updatedProgress }
                    : ex
            )
        );
    }, [setWorkoutExercises]);

    // This function will now only call handleSetCompletionUpdate.
    // The WorkoutTabContent should ensure it passes the correct exerciseId from the live WorkoutExercise.
    const handleSavedWorkoutExerciseSetCompletionUpdate = useCallback((
        workoutId: string, // workoutId might not be needed if exerciseId is sufficient
        exerciseId: string, 
        updatedProgress: WeeklyProgressBase
    ) => {
        handleSetCompletionUpdate(exerciseId, updatedProgress);
        // No longer directly updates savedWorkoutStructures or savedWorkouts for progress here.
        // The change will flow via workoutExercises -> useMemo -> displayedSavedWorkouts.
    }, [handleSetCompletionUpdate]);

    const toggleWorkoutExpanded = useCallback((workoutId: string) => {
        setExpandedWorkoutIds(prev => ({
            ...prev,
            [workoutId]: !prev[workoutId]
        }));
    }, [setExpandedWorkoutIds]);

    // Create displayedSavedWorkouts using useMemo
    const displayedSavedWorkouts = useMemo(() => {
        return savedWorkoutStructures.map(structure => {
            const enhancedExercises = structure.exercises // structure.exercises are ExerciseBase[] from getSavedWorkoutDetails
                .map(savedExBase => {
                    // Match based on exerciseDefinitionId as savedExBase._id is temporary from server
                    const liveWorkoutExercise = workoutExercises.find(
                        wEx => wEx.exerciseDefinitionId.toString() === savedExBase.exerciseDefinitionId.toString()
                    );

                    if (liveWorkoutExercise) {
                        return liveWorkoutExercise; 
                    } else {
                        // This warning is more relevant now if a definition ID from a saved workout
                        // doesn't exist in any of the current plan's live exercises.
                        console.warn(`No live exercise found for definitionId: ${savedExBase.exerciseDefinitionId} from saved workout: ${structure.name}. This exercise will not be shown.`);
                        return null;
                    }
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

    // Calculate active and completed exercises based on the single source of truth: workoutExercises
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
    
    const calculateProgressPercentage = useCallback(() => {
        if (workoutExercises.length === 0) return 0;
        const totalPossibleSets = workoutExercises.reduce((acc, ex) => acc + ex.sets, 0);
        if (totalPossibleSets === 0) return 0;
        const totalCompletedSets = workoutExercises.reduce((acc, ex) => acc + (ex.progress?.setsCompleted || 0), 0);
        return Math.round((totalCompletedSets / totalPossibleSets) * 100);
    }, [workoutExercises]);

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
    };

    // Cancel selection mode
    const handleCancelSelectionMode = () => {
        setSelectedExercises([]);
        setShowSelectionMode(false);
    };

    const handleTabChange = useCallback((eventOrNewValue: React.SyntheticEvent | number, newValue?: number) => {
        if (typeof eventOrNewValue === 'number') {
            setActiveTabState(eventOrNewValue as number);
        } else if (newValue !== undefined) {
            setActiveTabState(newValue);
        }
    }, []);

    // New function to start an active workout session
    const startActiveWorkout = useCallback((exercisesToStart: WorkoutExercise[], name?: string) => {
        setActiveWorkoutSession(exercisesToStart);
        setActiveWorkoutName(name || 'Active Workout');
        setSelectedExercises([]); 
        setShowSelectionMode(false); 
        setActiveTabState(ACTIVE_WORKOUT_TAB_INDEX); // Explicitly switch tab
    }, [setActiveWorkoutSession, setActiveWorkoutName, setSelectedExercises, setShowSelectionMode, setActiveTabState]);

    // Handlers for active workout session exercise sets
    const handleIncrementActiveSet = useCallback((exerciseId: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            return prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    if (!ex.progress) {
                        console.error(`Exercise ${exerciseId} is missing progress object during increment.`);
                        return ex;
                    }
                    const currentSetsCompleted = ex.progress.setsCompleted || 0;
                    if (currentSetsCompleted < ex.sets) {
                        return {
                            ...ex,
                            progress: {
                                ...ex.progress, // Spread existing progress
                                setsCompleted: currentSetsCompleted + 1,
                                lastUpdatedAt: new Date(),
                                isExerciseDone: (currentSetsCompleted + 1) >= ex.sets,
                            } as WeeklyProgressBase, // Keep type assertion if necessary for TS
                        };
                    }
                }
                return ex;
            });
        });
    }, [setActiveWorkoutSession]);

    const handleDecrementActiveSet = useCallback((exerciseId: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            return prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    if (!ex.progress) {
                        console.error(`Exercise ${exerciseId} is missing progress object during decrement.`);
                        return ex;
                    }
                    const currentSetsCompleted = ex.progress.setsCompleted || 0;
                    if (currentSetsCompleted > 0) {
                        return {
                            ...ex,
                            progress: {
                                ...ex.progress,
                                setsCompleted: currentSetsCompleted - 1,
                                lastUpdatedAt: new Date(),
                                isExerciseDone: false, // If decrementing, it's no longer fully done by this action
                            } as WeeklyProgressBase,
                        };
                    }
                }
                return ex;
            });
        });
    }, [setActiveWorkoutSession]);

    const handleCompleteActiveExercise = useCallback((exerciseId: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            return prevSession.map(ex => {
                if (ex._id.toString() === exerciseId) {
                    if (!ex.progress) {
                        console.error(`Exercise ${exerciseId} is missing progress object during completion.`);
                        return ex;
                    }
                    return {
                        ...ex,
                        progress: {
                            ...ex.progress,
                            setsCompleted: ex.sets, // Mark all sets as complete
                            isExerciseDone: true,
                            lastUpdatedAt: new Date(),
                        } as WeeklyProgressBase,
                    };
                }
                return ex;
            });
        });
    }, [setActiveWorkoutSession]);

    const handleEndActiveWorkout = useCallback(() => {
        setActiveWorkoutSession(null);
        setActiveWorkoutName(null);
        setActiveTabState(EXERCISES_TAB_INDEX); 
    }, [setActiveWorkoutSession, setActiveWorkoutName, setActiveTabState]);

    const handleRemoveExerciseFromActiveSession = useCallback((exerciseIdToRemove: string) => {
        setActiveWorkoutSession(prevSession => {
            if (!prevSession) return null;
            const updatedSession = prevSession.filter(ex => ex._id.toString() !== exerciseIdToRemove);
            if (updatedSession.length === 0) {
                // If session becomes empty, end it and switch tabs
                handleEndActiveWorkout(); 
                return null; // Or return empty array, then handleEndActiveWorkout will clear it
            }
            return updatedSession;
        });
    }, [setActiveWorkoutSession, handleEndActiveWorkout]);

    const handleStartWorkout = useCallback(() => {
        if (selectedExercises.length > 0) {
            const exercisesToStart = workoutExercises.filter(ex => selectedExercises.includes(ex._id.toString()));
            if (exercisesToStart.length > 0) {
                startActiveWorkout(exercisesToStart, 'Custom Workout');
            } else {
                console.warn("Could not find full exercise details for selected IDs to start workout.");
            }
        } else {
            console.warn("handleStartWorkout called with no selected exercises.");
        }
    }, [selectedExercises, workoutExercises, startActiveWorkout]);

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
        planId,
        weekNumber,
        planDetails,
        workoutExercises,
        isLoading,
        error,
        showCompleted,
        selectedExercises,
        showSelectionMode,
        progressPercentage: calculateProgressPercentage(),
        totalExercises: workoutExercises.length,
        completedExercisesCount: completedPlanExercises.length,
        activeExercises: showCompleted ? workoutExercises : activePlanExercises,
        completedExercises: completedPlanExercises,
        savedWorkouts: displayedSavedWorkouts,
        isWorkoutsLoading,
        activeWorkoutSession,
        activeWorkoutName,
        startActiveWorkout,
        // Active set handlers
        onIncrementActiveSet: handleIncrementActiveSet,
        onDecrementActiveSet: handleDecrementActiveSet,
        onCompleteActiveExercise: handleCompleteActiveExercise,
        onEndActiveWorkout: handleEndActiveWorkout,
        onRemoveExerciseFromActiveSession: handleRemoveExerciseFromActiveSession,
        navigate,
        handleSetCompletionUpdate,
        handleExerciseSelect,
        handleStartSelectionMode,
        handleCancelSelectionMode,
        handleStartWorkout,
        toggleShowCompleted,
        handleNavigateWeek,
        fetchSavedWorkouts: fetchSavedWorkoutStructures,
        toggleWorkoutExpanded,
        handleSavedWorkoutExerciseSetCompletionUpdate,
        activeTab,
        handleTabChange,
    };
}; 