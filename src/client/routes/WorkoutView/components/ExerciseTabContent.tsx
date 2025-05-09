import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    alpha
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { ExerciseTabContentProps } from './types';
import { WorkoutExerciseItem } from './WorkoutExerciseItem';

// --- Color constants (assuming these are used by WorkoutExerciseItem too) ---
const LIGHT_PAPER = '#F5F5F7';
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
    handleSetCompletionUpdate,
    handleExerciseSelect,
    toggleShowCompleted
}) => {
    return (
        <Box>
            {/* Actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* <Typography
                    variant="h6"
                    sx={{
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        fontWeight: 'bold',
                        color: '#333'
                    }}
                >
                    Exercises
                </Typography> */}

                {/* {selectedExercises.length > 0 && (
                    <Chip
                        label={`${selectedExercises.length} Selected`}
                        onDelete={() => {
                            // Clear all selections by calling handleExerciseSelect for each
                            // This assumes handleExerciseSelect toggles selection.
                            selectedExercises.forEach(id => handleExerciseSelect(id));
                        }}
                        sx={{
                            bgcolor: alpha(NEON_PINK, 0.1),
                            color: NEON_PINK,
                            fontWeight: 'bold',
                            border: `1px solid ${alpha(NEON_PINK, 0.2)}`,
                            '& .MuiChip-deleteIcon': {
                                color: alpha(NEON_PINK, 0.7),
                                '&:hover': {
                                    color: NEON_PINK
                                }
                            }
                        }}
                    />
                )} */}
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <Paper
                    elevation={2}
                    sx={{
                        textAlign: 'center',
                        mt: 6,
                        p: 4,
                        borderRadius: 3,
                        bgcolor: LIGHT_PAPER,
                        border: `1px dashed ${alpha('#000000', 0.2)}`
                    }}
                >
                    <Typography variant="h6" color={alpha('#000000', 0.5)}>
                        No exercises found for this plan
                    </Typography>
                </Paper>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box sx={{ mb: 4 }}>
                        {/* {activeExercises.length > 0 && (
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    color: NEON_BLUE,
                                    fontWeight: 'medium',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    fontSize: '0.875rem'
                                }}
                            >
                                Active Exercises
                            </Typography>
                        )} */}
                        {activeExercises.map((exercise) => (
                            <WorkoutExerciseItem
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
                                    color: alpha('#000000', 0.8),
                                    borderColor: alpha('#000000', 0.2),
                                    textTransform: 'none',
                                    '&:hover': {
                                        borderColor: alpha('#000000', 0.4),
                                        bgcolor: alpha('#000000', 0.03)
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
                                <WorkoutExerciseItem
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
            )}
        </Box>
    );
}; 