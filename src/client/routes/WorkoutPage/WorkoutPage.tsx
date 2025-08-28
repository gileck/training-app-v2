import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Divider, IconButton, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useRouter } from '@/client/router';
import { useExercises } from '@/client/hooks/useTrainingData';
import { getExerciseDefinitionById } from '@/apis/exerciseDefinitions/client';
import { getWeeklyProgress, updateSetCompletion } from '@/apis/weeklyProgress/client';
import { createSavedWorkout } from '@/apis/savedWorkouts/client';
import { WeeklyProgressBase } from '@/apis/weeklyProgress/types';
import { WorkoutExercise } from '@/client/types/workout';
import { LoadingErrorDisplay } from '@/client/components/LoadingErrorDisplay';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { SaveWorkoutDialog } from '@/client/components/SaveWorkoutDialog';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Helper component for each exercise in the workout
const WorkoutExerciseCard: React.FC<{
    exercise: WorkoutExercise;
    planId: string;
    weekNumber: number;
    onSetComplete: (exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
}> = ({ exercise, planId, weekNumber, onSetComplete }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const setsDone = exercise.progress?.setsCompleted || 0;
    const totalSets = exercise.sets;
    const isComplete = setsDone >= totalSets;

    const handleSetClick = async (setIndex: number) => {
        if (isUpdating) return;

        const targetSetsCompleted = setIndex + 1;
        const increment = targetSetsCompleted > setsDone ? 1 : -1;

        if ((increment > 0 && setsDone >= totalSets) || (increment < 0 && setsDone <= 0)) {
            return;
        }

        setIsUpdating(true);
        try {
            const response = await updateSetCompletion({
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                setsIncrement: increment,
                totalSetsForExercise: totalSets
            });

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exercise._id.toString(), response.data.updatedProgress);
            }
        } catch (error) {
            console.error('Failed to update set completion:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCompleteAllSets = async () => {
        if (isUpdating || setsDone >= totalSets) return;

        setIsUpdating(true);
        try {
            const response = await updateSetCompletion({
                planId,
                exerciseId: exercise._id.toString(),
                weekNumber,
                setsIncrement: 1,
                totalSetsForExercise: totalSets,
                completeAll: true
            });

            if (response.data?.success && response.data.updatedProgress) {
                onSetComplete(exercise._id.toString(), response.data.updatedProgress);
            }
        } catch (error) {
            console.error('Failed to complete all sets:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 2,
                borderLeft: isComplete ? '4px solid #4caf50' : 'none',
                opacity: isComplete ? 0.8 : 1
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="h3">
                    {exercise.name || 'Unnamed Exercise'}
                </Typography>
                {isComplete && (
                    <Chip
                        label="Completed"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {exercise.definition?.primaryMuscle || 'Unknown muscle group'}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
                {exercise.sets} sets × {exercise.reps} reps
                {exercise.weight && ` • ${exercise.weight}`}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                    Sets completed: {setsDone}/{totalSets}
                </Typography>

                {Array.from({ length: totalSets }).map((_, index) => (
                    <IconButton
                        key={index}
                        onClick={() => handleSetClick(index)}
                        disabled={isUpdating}
                        color={index < setsDone ? 'success' : 'default'}
                        size="small"
                    >
                        {index < setsDone ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    </IconButton>
                ))}

                {!isComplete && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCompleteAllSets}
                        disabled={isUpdating}
                        sx={{ ml: 'auto' }}
                    >
                        Complete All
                    </Button>
                )}
            </Box>

            <Button
                variant="text"
                size="small"
                onClick={() => setIsDetailModalOpen(true)}
                sx={{ mt: 1 }}
            >
                View Details
            </Button>

            {isDetailModalOpen && (
                <ExerciseDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    exercise={exercise}
                    planId={planId}
                    weekNumber={weekNumber}
                />
            )}
        </Paper>
    );
};

export const WorkoutPage: React.FC = () => {
    const { queryParams, navigate } = useRouter();
    const planId = queryParams.planId as string;
    const weekNumber = parseInt(queryParams.week as string, 10);
    const exerciseIdsString = queryParams.exercises as string || '';

    // Create a ref to track component mount state
    const isMountedRef = React.useRef(true);

    // Extract and memoize exercise IDs to prevent re-renders
    const exerciseIds = React.useMemo(() => {
        return exerciseIdsString ? exerciseIdsString.split(',') : [];
    }, [exerciseIdsString]);

    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [savedWorkout, setSavedWorkout] = useState<{ name: string, id: string } | null>(null);

    // Use centralized training data context for plan exercises
    const {
        exercises: planExercises,
        isLoading: isPlanLoading,
        isLoaded: isPlanLoaded,
        error: planError,
    } = useExercises(planId);

    // Function to fetch exercise data
    const fetchExercises = useCallback(async () => {
        if (!planId || isNaN(weekNumber) || exerciseIds.length === 0) {
            if (isMountedRef.current) {
                setError('Invalid workout parameters');
                setIsLoading(false);
            }
            return;
        }

        // Wait until plan exercises are loaded by context
        if (!isPlanLoaded) {
            // Show loading state while plan data loads
            if (isMountedRef.current) setIsLoading(true);
            return;
        }

        if (isMountedRef.current) {
            setIsLoading(true);
            setError(planError);
        }

        try {
            // Filter to only get the selected exercises from context
            const selectedExercises = (planExercises || [])
                .filter(ex => exerciseIds.includes(ex._id.toString()));

            if (selectedExercises.length === 0) {
                setError('No valid exercises found for this workout');
                setIsLoading(false);
                return;
            }

            // Fetch progress and definitions for each exercise
            const workoutExercisesWithDetails = await Promise.all(selectedExercises.map(async (ex) => {
                // Fetch progress
                const progressResponse = await getWeeklyProgress({
                    planId,
                    exerciseId: ex._id.toString(),
                    weekNumber
                });

                // Fetch definition
                const definitionResponse = await getExerciseDefinitionById({
                    definitionId: ex.exerciseDefinitionId.toString()
                });

                const progressData = progressResponse.data;
                const definitionData = definitionResponse.data;

                // Return combined data
                return {
                    ...ex,
                    name: definitionData?.name,
                    progress: progressData,
                    definition: definitionData ? {
                        primaryMuscle: definitionData.primaryMuscle,
                        secondaryMuscles: definitionData.secondaryMuscles,
                        bodyWeight: definitionData.bodyWeight,
                        type: definitionData.type,
                        imageUrl: definitionData.imageUrl
                    } : undefined
                };
            }));

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setWorkoutExercises(workoutExercisesWithDetails);
            }
        } catch (err) {
            console.error('Failed to load workout data:', err);
            if (isMountedRef.current) {
                setError('An error occurred while loading workout data');
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [planId, weekNumber, exerciseIds, isPlanLoaded, planExercises, planError]);

    // Only run the effect once on mount or when dependencies actually change
    useEffect(() => {
        // Set isMounted to true on mount
        isMountedRef.current = true;

        // Call fetch function
        fetchExercises();

        // Cleanup function to prevent state updates after unmounting
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchExercises]);

    // Return early if we don't have required parameters (after hooks)
    if (!planId || isNaN(weekNumber) || !exerciseIdsString) {
        return (
            <Box sx={{ p: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/training-plans')}
                >
                    Back to Plans
                </Button>
                <Typography sx={{ mt: 2 }}>
                    Missing required workout parameters.
                </Typography>
            </Box>
        );
    }

    // Handler for set completion updates
    const handleSetComplete = (exerciseId: string, updatedProgress: WeeklyProgressBase) => {
        setWorkoutExercises(prevExercises =>
            prevExercises.map(ex =>
                ex._id.toString() === exerciseId
                    ? { ...ex, progress: updatedProgress }
                    : ex
            )
        );
    };

    // Handler for saving the workout
    const handleSaveWorkout = async (name: string) => {
        setIsSaveDialogOpen(false);
        if (!name.trim()) {
            setError("Workout name cannot be empty.");
            return;
        }
        try {
            // Ensure planId is available and valid before calling createSavedWorkout
            if (!planId) {
                setError("Cannot save workout without a valid Training Plan ID.");
                return;
            }
            const response = await createSavedWorkout({
                name,
                exerciseIds: workoutExercises.map(ex => ex._id.toString()),
                trainingPlanId: planId
            });
            if (response.data && 'error' in response.data) {
                setError(String(response.data.error) || 'Failed to create saved workout');
                return;
            }

            // Store the saved workout info
            if (response.data && response.data._id) {
                setSavedWorkout({
                    name,
                    id: response.data._id.toString()
                });
            }

            return true;
        } catch (error) {
            console.error('Error creating saved workout:', error);
            if (error && typeof error === 'object' && 'message' in error) {
                setError(error.message as string);
            } else {
                setError('Failed to create saved workout');
            }
        }
    };

    // Calculate workout completion stats
    const totalExercises = workoutExercises.length;
    const completedExercises = workoutExercises.filter(ex =>
        (ex.progress?.setsCompleted || 0) >= ex.sets
    ).length;
    const progressPercentage = totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/workout/${planId}/${weekNumber}`)}
                    sx={{ mb: 2 }}
                >
                    Back
                </Button>
                <LoadingErrorDisplay isLoading={false} error={error} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/workout/${planId}/${weekNumber}`)}
                >
                    Back to Week {weekNumber}
                </Button>

                {savedWorkout ? (
                    <Chip
                        label={`Saved as: ${savedWorkout.name}`}
                        color="success"
                        variant="outlined"
                        onClick={() => navigate('/saved-workouts')}
                        sx={{ cursor: 'pointer' }}
                    />
                ) : (
                    <Button
                        startIcon={<SaveIcon />}
                        variant="outlined"
                        onClick={() => setIsSaveDialogOpen(true)}
                    >
                        Save Workout
                    </Button>
                )}
            </Box>

            {/* Progress Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    {savedWorkout ? savedWorkout.name : "Workout Progress"}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">
                        Completed: {completedExercises}/{totalExercises} exercises
                    </Typography>
                    <Typography variant="body1">
                        {progressPercentage}%
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, mb: 1 }}>
                    <Box
                        sx={{
                            height: 10,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            width: `${progressPercentage}%`,
                            transition: 'width 0.3s'
                        }}
                    />
                </Box>
            </Paper>

            {/* Exercise List */}
            <Box>
                <Typography variant="h5" gutterBottom>
                    Exercises
                </Typography>

                {workoutExercises.length === 0 ? (
                    <Typography>No exercises selected for this workout.</Typography>
                ) : (
                    workoutExercises.map(exercise => (
                        <WorkoutExerciseCard
                            key={exercise._id.toString()}
                            exercise={exercise}
                            planId={planId}
                            weekNumber={weekNumber}
                            onSetComplete={handleSetComplete}
                        />
                    ))
                )}
            </Box>

            {/* Save Workout Dialog */}
            {isSaveDialogOpen && (
                <SaveWorkoutDialog
                    open={isSaveDialogOpen}
                    onClose={() => setIsSaveDialogOpen(false)}
                    onSave={handleSaveWorkout}
                />
            )}
        </Box>
    );
}; 