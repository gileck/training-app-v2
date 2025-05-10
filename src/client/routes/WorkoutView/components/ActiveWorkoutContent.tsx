import React, { useState } from 'react';
import { Box, Typography, Button, LinearProgress, alpha, Paper, CircularProgress, Alert } from '@mui/material';
import { WorkoutExercise } from '@/client/types/workout';
import { LargeExerciseCard } from './LargeExerciseCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For completion indication
import SaveIcon from '@mui/icons-material/Save'; // Icon for Save button
import { SaveWorkoutDialog } from './SaveWorkoutDialog'; // Import the new dialog

// Neon color constants
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const LIGHT_PAPER_BG = '#F5F5F7'; // Background for the new Paper header
const NEUTRAL_BUTTON_BORDER = alpha('#000000', 0.23); // For default end workout button
const DEFAULT_CUSTOM_WORKOUT_NAME = 'Workout'; // Default name from useWorkoutView

interface ActiveWorkoutContentProps {
    exercises: WorkoutExercise[];
    workoutName?: string | null;
    onIncrementSet: (exerciseId: string) => void;
    onDecrementSet: (exerciseId: string) => void;
    onEndWorkout: () => void;
    onRemoveExerciseFromSession: (exerciseId: string) => void;
    onSaveActiveSession: (name: string) => Promise<void>; // New prop
    isSavingWorkout: boolean; // New prop
    saveError: string | null; // New prop
}

export const ActiveWorkoutContent: React.FC<ActiveWorkoutContentProps> = ({
    exercises,
    workoutName,
    onIncrementSet,
    onDecrementSet,
    onEndWorkout,
    onRemoveExerciseFromSession,
    onSaveActiveSession,
    isSavingWorkout,
    saveError
}) => {
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    if (!exercises || exercises.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No exercises in this workout session.
                </Typography>
            </Box>
        );
    }

    const totalSetsInSession = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const completedSetsInSession = exercises.reduce((sum, ex) => sum + (ex.progress?.setsCompleted || 0), 0);
    const overallProgressPercent = totalSetsInSession > 0 ? (completedSetsInSession / totalSetsInSession) * 100 : 0;
    const isWorkoutComplete = overallProgressPercent >= 100 && totalSetsInSession > 0;
    const currentWorkoutName = workoutName || 'Active Workout';
    const headerAccentColor = isWorkoutComplete ? NEON_GREEN : NEON_BLUE;

    const showSaveButton = workoutName === DEFAULT_CUSTOM_WORKOUT_NAME;

    const handleSaveDialogSave = async (newName: string) => {
        await onSaveActiveSession(newName);
        // The `useWorkoutView` hook should update `activeWorkoutName` on successful save,
        // which will cause `showSaveButton` to become false and hide the button.
        // If save was successful (no error), close dialog.
        // The saveError prop will be updated by the hook.
        // We might want to keep the dialog open if there was a saveError from the hook.
        // For now, assume a successful save will change workoutName and hide the button, then close dialog.
        if (!saveError) { // A bit simplistic, as saveError might not be updated immediately
            setIsSaveDialogOpen(false);
        }
    };

    return (
        <Box sx={{ pt: 2, pb: 4 }}>
            <Paper
                elevation={2}
                sx={{
                    mb: 2.5, // Margin below the header paper
                    bgcolor: LIGHT_PAPER_BG,
                    borderRadius: 3, // Consistent with LargeExerciseCard
                    border: `1.5px solid ${alpha(headerAccentColor, 0.4)}`,
                    boxShadow: `0 4px 12px ${alpha(headerAccentColor, 0.1)}`,
                    p: { xs: 1.5, sm: 2 }
                }}
            >
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', textAlign: 'center', color: alpha('#000000', 0.85), mb: 1.5 }}>
                    {currentWorkoutName}
                </Typography>

                <LinearProgress
                    variant="determinate"
                    value={overallProgressPercent}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha(headerAccentColor, 0.2),
                        '& .MuiLinearProgress-bar': {
                            bgcolor: headerAccentColor,
                            borderRadius: 5,
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: alpha('#000000', 0.7) }}>
                        Overall Progress: {completedSetsInSession} / {totalSetsInSession} sets
                    </Typography>
                    {isWorkoutComplete && (
                        <CheckCircleOutlineIcon sx={{ color: NEON_GREEN, fontSize: '1.2rem' }} />
                    )}
                </Box>
            </Paper>

            {saveError && !isSaveDialogOpen && (
                <Alert severity="error" sx={{ mb: 2, mx: 1 }}>{saveError}</Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2.5, px: 1 }}>
                {showSaveButton && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isSavingWorkout ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={() => setIsSaveDialogOpen(true)}
                        disabled={isSavingWorkout}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 'bold',
                            bgcolor: NEON_BLUE,
                            color: 'white',
                            minWidth: '150px',
                            py: 0.8,
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: alpha(NEON_BLUE, 0.85)
                            }
                        }}
                    >
                        {isSavingWorkout && !isSaveDialogOpen ? 'Saving...' : 'Save Workout'}
                    </Button>
                )}
                <Button
                    variant={isWorkoutComplete ? "contained" : "outlined"}
                    color={isWorkoutComplete ? "success" : "inherit"}
                    onClick={onEndWorkout}
                    disabled={isSavingWorkout}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        borderColor: isWorkoutComplete ? undefined : NEUTRAL_BUTTON_BORDER,
                        bgcolor: isWorkoutComplete ? NEON_GREEN : undefined,
                        color: isWorkoutComplete ? 'white' : undefined,
                        minWidth: '150px',
                        py: 0.8,
                        borderRadius: 2,
                        '&:hover': {
                            bgcolor: isWorkoutComplete ? alpha(NEON_GREEN, 0.85) : undefined,
                            borderColor: isWorkoutComplete ? undefined : alpha(NEUTRAL_BUTTON_BORDER, 0.7)
                        }
                    }}
                >
                    {isWorkoutComplete ? 'Finish Workout' : 'End Workout'}
                </Button>
            </Box>

            <SaveWorkoutDialog
                open={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                onSave={handleSaveDialogSave}
                currentName={currentWorkoutName === DEFAULT_CUSTOM_WORKOUT_NAME ? 'My Custom Workout' : currentWorkoutName}
                isSaving={isSavingWorkout}
            />

            {exercises.map((exercise) => (
                <LargeExerciseCard
                    key={exercise._id.toString()}
                    exercise={exercise}
                    onIncrementSet={onIncrementSet}
                    onDecrementSet={onDecrementSet}
                    onRemoveExercise={onRemoveExerciseFromSession}
                />
            ))}
        </Box>
    );
}; 