import React from 'react';
import {
    Box,
    Button,
    alpha,
    IconButton,
    Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';

import { ExerciseTabContentProps } from './types';
import { WorkoutExerciseItem } from './WorkoutExerciseItem';
import { CompactWorkoutExerciseItem } from './CompactWorkoutExerciseItem';
import { WorkoutExerciseItemSkeleton } from './WorkoutExerciseItemSkeleton';
import { useSettings } from '@/client/settings/SettingsContext';
// const NEON_BLUE = '#3D5AFE'; // Removed as it's unused
// const NEON_PINK = '#D500F9'; // Removed as it's unused

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
    toggleShowCompleted
}) => {
    const theme = useTheme();
    const { settings, updateSettings } = useSettings();
    const viewMode = settings.exerciseViewMode;

    const toggleViewMode = () => {
        updateSettings({
            exerciseViewMode: viewMode === 'detailed' ? 'compact' : 'detailed'
        });
    };

    if (isLoading) {
        return (
            <Box sx={{ pt: 3 }}>
                {[...Array(3)].map((_, index) => (
                    <WorkoutExerciseItemSkeleton key={`skeleton-${index}`} />
                ))}
            </Box>
        );
    }

    const ExerciseComponent = viewMode === 'compact' ? CompactWorkoutExerciseItem : WorkoutExerciseItem;


    return (
        <Box>
            {/* Actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Tooltip title={viewMode === 'detailed' ? 'Switch to Compact View' : 'Switch to Detailed View'}>
                    <IconButton
                        onClick={toggleViewMode}
                        sx={{
                            color: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.15)
                            }
                        }}
                    >
                        {viewMode === 'detailed' ? <ViewCompactIcon /> : <ViewListIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <></>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box sx={{ mb: 4 }}>
                        {activeExercises.map((exercise) => (
                            <ExerciseComponent
                                key={exercise._id.toString()}
                                exercise={exercise}
                                planId={planId}
                                weekNumber={weekNumber}
                                onSetComplete={handleSetCompletionUpdate}
                                selectedExercises={selectedExercises}
                                handleExerciseSelect={handleExerciseSelect}
                                showSelectionMode={showSelectionMode}
                            />
                        ))}
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
                            {showCompleted && completedExercises.map((exercise) => (
                                <ExerciseComponent
                                    key={exercise._id.toString()}
                                    exercise={exercise}
                                    planId={planId}
                                    weekNumber={weekNumber}
                                    onSetComplete={handleSetCompletionUpdate}
                                    selectedExercises={selectedExercises}
                                    handleExerciseSelect={handleExerciseSelect}
                                    showSelectionMode={showSelectionMode}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )
            }
        </Box >
    );
}; 