import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { LoadingErrorDisplay } from './LoadingErrorDisplay';
import { WorkoutItem } from './WorkoutItem';
import type { ClientWorkoutDisplay } from '../types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';

interface WorkoutsTabProps {
    isPageLoading: boolean;
    planDetails: { name?: string } | null;
    workoutHooks: {
        savedWorkout_error: string | null;
        savedWorkout_workouts: ClientWorkoutDisplay[];
        savedWorkout_expandedWorkoutId: string | null;
        savedWorkout_isRenamingWorkoutId: string | null;
        savedWorkout_isRemovingExercise: string | null;
        savedWorkout_exerciseDefinitionMap: Map<string, ExerciseDefinition>;
        savedWorkout_handleOpenAddWorkoutDialog: () => void;
        savedWorkout_handleToggleExpand: (workoutId: string) => void;
        savedWorkout_openRenameDialog: (workout: ClientWorkoutDisplay) => void;
        savedWorkout_openDeleteDialog: (workoutId: string) => void;
        savedWorkout_handleOpenAddExerciseDialog: (workout: ClientWorkoutDisplay) => Promise<void>;
        savedWorkout_handleRemoveExercise: (workoutId: string, exerciseId: string) => Promise<void>;
    };
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
    isPageLoading,
    planDetails,
    workoutHooks
}) => {
    const {
        savedWorkout_error,
        savedWorkout_workouts,
        savedWorkout_expandedWorkoutId,
        savedWorkout_isRenamingWorkoutId,
        savedWorkout_isRemovingExercise,
        savedWorkout_exerciseDefinitionMap,
        savedWorkout_handleOpenAddWorkoutDialog,
        savedWorkout_handleToggleExpand,
        savedWorkout_openRenameDialog,
        savedWorkout_openDeleteDialog,
        savedWorkout_handleOpenAddExerciseDialog,
        savedWorkout_handleRemoveExercise
    } = workoutHooks;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={savedWorkout_handleOpenAddWorkoutDialog}
                    disabled={isPageLoading || !planDetails || !!savedWorkout_error}
                    color="primary"
                >
                    Add Workout
                </Button>
            </Box>
            <LoadingErrorDisplay isLoading={isPageLoading} error={savedWorkout_error} />
            {!isPageLoading && !savedWorkout_error && savedWorkout_workouts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ mb: 2 }}>
                        No saved workouts found for this plan. Click &quot;Add Workout&quot; above to get started.
                    </Typography>
                </Box>
            )}
            {!isPageLoading && !savedWorkout_error && savedWorkout_workouts.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                    <Stack spacing={2}>
                        {savedWorkout_workouts.map((workout) => (
                            <WorkoutItem
                                key={workout._id.toString()}
                                workout={workout}
                                expandedWorkoutId={savedWorkout_expandedWorkoutId}
                                isRenamingWorkoutId={savedWorkout_isRenamingWorkoutId}
                                isRemovingExercise={savedWorkout_isRemovingExercise}
                                exerciseDefinitionMap={savedWorkout_exerciseDefinitionMap}
                                onToggleExpand={savedWorkout_handleToggleExpand}
                                onOpenRenameDialog={savedWorkout_openRenameDialog}
                                onOpenDeleteDialog={savedWorkout_openDeleteDialog}
                                onOpenAddExerciseDialog={savedWorkout_handleOpenAddExerciseDialog}
                                onRemoveExercise={savedWorkout_handleRemoveExercise}
                            />
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}; 