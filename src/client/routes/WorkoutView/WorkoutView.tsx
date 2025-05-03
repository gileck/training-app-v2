import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Stack,
    Paper,
    Chip,
    Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info'; // For detail button
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // For completed exercise
import DoneAllIcon from '@mui/icons-material/DoneAll'; // For completing all sets
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from '@/client/router';
import { getExercises } from '@/apis/exercises/client';
import { getTrainingPlanById, getActiveTrainingPlan } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import { getWeeklyProgress, updateSetCompletion } from '@/apis/weeklyProgress/client';
import { getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinitionOption } from '@/apis/exerciseDefinitions/types';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import Image from 'next/image';
import { WorkoutExercise } from '@/client/types/workout';

// Helper function to create the definition map (same as in ManagePlanExercises)
const createDefinitionMap = (defs: ExerciseDefinitionOption[]): Record<string, string> => {
    return defs.reduce((acc: Record<string, string>, def: ExerciseDefinitionOption) => {
        acc[def._id.toString()] = def.name;
        return acc;
    }, {});
};

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    return null;
};

interface WeekNavigatorProps {
    currentWeek: number;
    maxWeeks: number;
    planId: string;
    navigate: (path: string) => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, planId, navigate }) => {
    const handleNavigateWeek = (week: number) => {
        if (week >= 1 && week <= maxWeeks) {
            navigate(`/workout/${planId}/${week}`);
        }
    };

    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={() => handleNavigateWeek(currentWeek - 1)} disabled={currentWeek <= 1}>
                <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">
                Week {currentWeek} / {maxWeeks}
            </Typography>
            <IconButton onClick={() => handleNavigateWeek(currentWeek + 1)} disabled={currentWeek >= maxWeeks}>
                <ArrowForwardIcon />
            </IconButton>
        </Stack>
    );
};

interface WorkoutExerciseItemProps {
    exercise: WorkoutExercise;
    planId: string;
    weekNumber: number;
    onSetComplete: (exerciseId: string, newProgress: WeeklyProgressBase) => void;
    showSelectionMode: boolean;
    selectedExercises: string[];
    handleExerciseSelect: (exerciseId: string) => void;
}

const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({ exercise, planId, weekNumber, onSetComplete, showSelectionMode, selectedExercises, handleExerciseSelect }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const setsDone = exercise.progress?.setsCompleted || 0;
    const totalSets = exercise.sets; // Assuming exercise.sets is the total required
    const isExerciseComplete = setsDone >= totalSets;

    const handleSetCheckboxClick = async (setIndex: number) => {
        const targetSetsCompleted = setIndex + 1;
        const increment = targetSetsCompleted > setsDone ? 1 : -1; // Basic increment/decrement

        // Prevent exceeding total sets or going below zero
        if ((increment > 0 && setsDone >= totalSets) || (increment < 0 && setsDone <= 0)) {
            return;
        }

        setIsUpdating(true);
        try {
            const requestParams = {
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                setsIncrement: increment,
                totalSetsForExercise: totalSets // Pass total sets for backend check
            };

            const response = await updateSetCompletion(requestParams);

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exercise._id.toString(), response.data.updatedProgress);
            } else {
                // Handle error (e.g., show a snackbar)
                console.error("[WorkoutExerciseItem] Failed to update set completion:", response.data?.message || 'No error message provided.', response);
                // Consider adding user-facing error feedback here (Snackbar?)
            }
        } catch (err) {
            console.error("[WorkoutExerciseItem] Error calling updateSetCompletion:", err);
            // Handle error
        } finally {
            setIsUpdating(false);
        }
    };

    // Handler to complete all sets at once
    const handleCompleteAllSets = async () => {
        if (setsDone >= totalSets || isUpdating) return;

        setIsUpdating(true);
        try {
            const requestParams = {
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                setsIncrement: 1, // This value is ignored when completeAll is true
                totalSetsForExercise: totalSets,
                completeAll: true // Use the new API parameter
            };

            const response = await updateSetCompletion(requestParams);

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exercise._id.toString(), response.data.updatedProgress);
            } else {
                console.error("[WorkoutExerciseItem] Failed to complete all sets:", response.data?.message || 'No error message provided.', response);
            }
        } catch (err) {
            console.error("[WorkoutExerciseItem] Error completing all sets:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOpenDetailModal = () => {
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
    };

    return (
        <>
            <Paper elevation={2} sx={{ p: 2, mb: 2, opacity: isExerciseComplete ? 0.7 : 1, position: 'relative' }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Left side: Exercise image (stacked on mobile) */}
                    <Box sx={{
                        width: { xs: '100%', sm: 100 },
                        height: { xs: 120, sm: 100 },
                        position: 'relative',
                        flexShrink: 0,
                        mb: { xs: 1, sm: 0 }
                    }}>
                        {exercise.definition?.imageUrl ? (
                            <Image
                                src={exercise.definition.imageUrl}
                                alt={exercise.name || 'Exercise'}
                                fill
                                style={{ objectFit: 'contain', borderRadius: '8px' }}
                            />
                        ) : (
                            <Box sx={{
                                width: '100%',
                                height: '100%',
                                bgcolor: 'grey.200',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography variant="caption" color="text.secondary">No image</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Right side: Exercise details */}
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="h6"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    {exercise.name || `Exercise: ${exercise._id}`}
                                </Typography>
                                {isExerciseComplete && (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                )}
                                {exercise.definition?.hasComments && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            px: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        Comments
                                    </Typography>
                                )}
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    onClick={() => handleSetCheckboxClick(setsDone)}
                                    color="success"
                                    size="small"
                                    disabled={isUpdating || setsDone >= totalSets}
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleSetCheckboxClick(setsDone - 2)}
                                    color="default"
                                    size="small"
                                    disabled={isUpdating || setsDone <= 0}
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={handleCompleteAllSets}
                                    color="success"
                                    size="small"
                                    disabled={isUpdating || setsDone >= totalSets}
                                    title="Complete all sets"
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                            Sets: {setsDone} / {totalSets}
                        </Typography>

                        <Typography variant="body2" mt={0.5} sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                            {exercise.reps} reps
                            {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` ${exercise.weight}kg`}
                        </Typography>

                        {/* Muscle group tags */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        bgcolor: 'grey.300',
                                        '&:hover': { bgcolor: 'grey.400' },
                                        fontSize: '0.7rem',
                                        height: 24
                                    }}
                                />
                            )}
                            {exercise.definition?.secondaryMuscles?.map((muscle, index) => (
                                <Chip
                                    key={index}
                                    label={muscle}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        borderColor: 'grey.400',
                                        fontSize: '0.7rem',
                                        height: 24
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Info button positioned at bottom right */}
                <IconButton
                    color="primary"
                    onClick={handleOpenDetailModal}
                    size="small"
                    title="View exercise details"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'grey.100' }
                    }}
                >
                    <InfoIcon fontSize="small" />
                </IconButton>

                {showSelectionMode && (
                    <Checkbox
                        checked={selectedExercises.includes(exercise._id.toString())}
                        onChange={() => handleExerciseSelect(exercise._id.toString())}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                )}
            </Paper>

            <ExerciseDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                exercise={exercise}
                planId={planId}
                weekNumber={weekNumber}
            />
        </>
    );
};

// --- Main Component --- //

export const WorkoutView = () => {
    const { routeParams, navigate } = useRouter();
    const [planId, setPlanId] = useState<string | undefined>(routeParams.planId as string | undefined);
    const weekNumber = parseInt(routeParams.weekNumber as string || '1', 10);

    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);

    // Add state for exercise selection
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(false);

    // Fetch active training plan if no planId is provided
    useEffect(() => {
        async function fetchActivePlan() {
            if (!planId) {
                try {
                    const response = await getActiveTrainingPlan();
                    // Check if response.data is a TrainingPlan (not the error object)
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
    }, [fetchData, planId]); // Rerun if planId or weekNumber changes

    // Handler to update local state when a set is completed via API
    const handleSetCompletionUpdate = (exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id.toString() === exerciseId
                    ? { ...ex, progress: updatedProgress } // Update progress for the specific exercise
                    : ex
            )
        );
    };

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

    // Add handler for exercise selection
    const handleExerciseSelect = (exerciseId: string) => {
        setSelectedExercises(prev => {
            if (prev.includes(exerciseId)) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    };

    // Add handler to start selection mode
    const handleStartSelectionMode = () => {
        setShowSelectionMode(true);
        setSelectedExercises([]);
    };

    // Add handler to cancel selection mode
    const handleCancelSelectionMode = () => {
        setShowSelectionMode(false);
        setSelectedExercises([]);
    };

    // Add button to start workout with selected exercises
    const handleStartWorkout = () => {
        if (selectedExercises.length === 0) {
            // Show error or inform user
            return;
        }

        // Navigate to workout view with selected exercises
        navigate(`/workout-page?planId=${planId}&week=${weekNumber}&exercises=${selectedExercises.join(',')}`);
    };

    // --- Render Logic --- //

    if (isLoading) {
        return <LoadingErrorDisplay isLoading={true} error={null} />;
    }

    if (!planId) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color="error" sx={{ mb: 2 }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />}>
                    Go to Training Plans
                </Button>
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />}>
                    Back to Plans
                </Button>
            </Box>
        )
    }

    if (!planDetails) {
        // Should be caught by error handling, but as a fallback
        return <Typography sx={{ p: 2 }}>Plan details could not be loaded.</Typography>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                align="center"
                sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
            >
                {planDetails.name}
            </Typography>

            <WeekNavigator
                currentWeek={weekNumber}
                maxWeeks={planDetails.durationWeeks}
                planId={planId}
                navigate={navigate}
            />

            {/* Weekly Progress Bar */}
            <Box sx={{ mb: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                        Weekly Progress: {completedExercisesCount}/{totalExercises} exercises
                    </Typography>
                    <Typography variant="body2">
                        {progressPercentage.toFixed(0)}%
                    </Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.300',
                            borderRadius: 4,
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${progressPercentage}%`,
                            height: 8,
                            bgcolor: 'success.main',
                            borderRadius: 4,
                            transition: 'width 0.3s ease-in-out',
                        }}
                    />
                </Box>
            </Box>

            {/* Add button to enable selection mode above the exercise list */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Exercises
                </Typography>

                {!showSelectionMode ? (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleStartSelectionMode}
                        startIcon={<AddIcon />}
                    >
                        Create Workout
                    </Button>
                ) : (
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={handleStartWorkout}
                            disabled={selectedExercises.length === 0}
                        >
                            Start Workout ({selectedExercises.length})
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelSelectionMode}
                        >
                            Cancel
                        </Button>
                    </Stack>
                )}
            </Box>

            {workoutExercises.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                    No exercises found for this plan.
                </Typography>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                mt: 2,
                                mb: 1,
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                display: activeExercises.length === 0 ? 'none' : 'block'
                            }}
                        >
                            Active Exercises
                        </Typography>
                        {activeExercises.map((exercise) => (
                            <WorkoutExerciseItem
                                key={exercise._id.toString()}
                                exercise={exercise}
                                planId={planId}
                                weekNumber={weekNumber}
                                onSetComplete={handleSetCompletionUpdate}
                                showSelectionMode={showSelectionMode}
                                selectedExercises={selectedExercises}
                                handleExerciseSelect={handleExerciseSelect}
                            />
                        ))}
                    </Box>

                    {/* Completed Exercises */}
                    {completedExercises.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Button
                                onClick={() => setShowCompleted(!showCompleted)}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    justifyContent: 'space-between',
                                    py: 1,
                                    mb: 1,
                                    display: 'flex',
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}
                                endIcon={showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                                <Box component="span">
                                    Completed Exercises ({completedExercises.length})
                                </Box>
                            </Button>

                            <Box sx={{ display: showCompleted ? 'block' : 'none' }}>
                                {completedExercises.map((exercise) => (
                                    <WorkoutExerciseItem
                                        key={exercise._id.toString()}
                                        exercise={exercise}
                                        planId={planId}
                                        weekNumber={weekNumber}
                                        onSetComplete={handleSetCompletionUpdate}
                                        showSelectionMode={showSelectionMode}
                                        selectedExercises={selectedExercises}
                                        handleExerciseSelect={handleExerciseSelect}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            {showSelectionMode && selectedExercises.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Selected Exercises: {selectedExercises.length}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {selectedExercises.map((exerciseId) => {
                            const exercise = workoutExercises.find(e => e._id.toString() === exerciseId);
                            return (
                                <Chip
                                    key={exerciseId}
                                    label={exercise?.name || exerciseId}
                                    onDelete={() => handleExerciseSelect(exerciseId)}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                />
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
}; 