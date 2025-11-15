import React from 'react';
import {
    Box,
    Button,
    alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { ExerciseTabContentProps } from './types';
import { WorkoutExerciseItem } from './WorkoutExerciseItem';
import { CompactWorkoutExerciseItem } from './CompactWorkoutExerciseItem';
import { WorkoutExerciseItemSkeleton } from './WorkoutExerciseItemSkeleton';

export const ExerciseTabContent: React.FC<ExerciseTabContentProps> = ({
    planId,
    weekNumber,
    activeExercises,
    completedExercises,
    showCompleted,
    selectedExercises,
    showSelectionMode,
    isLoading,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    toggleShowCompleted,
    viewMode = 'detailed'
}) => {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Box sx={{ pt: 3 }}>
                {[...Array(3)].map((_, index) => (
                    <WorkoutExerciseItemSkeleton key={`skeleton-${index}`} />
                ))}
            </Box>
        );
    }

    const renderExercise = (exercise: typeof activeExercises[0]) => {
        const exerciseProps = {
            exercise,
            planId,
            weekNumber,
            onSetComplete: handleSetCompletionUpdate,
            selectedExercises,
            handleExerciseSelect,
            showSelectionMode
        };

        return viewMode === 'compact' ? (
            <CompactWorkoutExerciseItem key={exercise._id.toString()} {...exerciseProps} />
        ) : (
            <WorkoutExerciseItem key={exercise._id.toString()} {...exerciseProps} />
        );
    };

    return (
        <Box>
            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <></>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box sx={{ mb: 4 }}>
                        {activeExercises.map((exercise) => renderExercise(exercise))}
                    </Box>

                    {/* Completed Exercises */}
                    {completedExercises.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Button
                                onClick={toggleShowCompleted}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    justifyContent: 'space-between',
                                    py: 1.5,
                                    px: 3,
                                    mb: 2,
                                    borderRadius: 8,
                                    color: alpha(theme.palette.text.primary, 0.8),
                                    borderColor: alpha(theme.palette.text.primary, 0.2),
                                    textTransform: 'none',
                                    '&:hover': {
                                        borderColor: alpha(theme.palette.text.primary, 0.4),
                                        bgcolor: alpha(theme.palette.text.primary, 0.06)
                                    }
                                }}
                                endIcon={showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                                <Box component="span">
                                    Completed Exercises ({completedExercises.length})
                                </Box>
                            </Button>

                            {/* Use a conditional rendering that doesn't rely on display:none for better accessibility and performance if lists are long */}
                            {showCompleted && completedExercises.map((exercise) => renderExercise(exercise))}
                        </Box>
                    )}
                </Box>
            )
            }
        </Box >
    );
}; 