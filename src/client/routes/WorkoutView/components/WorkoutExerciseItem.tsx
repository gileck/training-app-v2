import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    alpha,
    IconButton,
    Stack,
    Divider,
    LinearProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import Image from 'next/image';
import { useTheme } from '@mui/material/styles';

import { WorkoutExerciseItemProps } from './types'; // WorkoutExercise type will come via props.exercise
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../hooks/useExerciseSetCompletion';

// Colors are derived from the MUI theme to support light/dark modes

export const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
    exercise,
    planId,
    weekNumber,
    onSetComplete,
    selectedExercises,
    handleExerciseSelect,
    showSelectionMode
}) => {
    const theme = useTheme();
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const setsDone = exercise.progress?.setsCompleted || 0;
    const totalSets = exercise.sets;
    const isExerciseComplete = setsDone >= totalSets;
    const exerciseId = exercise._id.toString();
    // Default isSelected to false if showSelectionMode is false or undefined
    const isSelected = showSelectionMode ? selectedExercises.includes(exerciseId) : false;

    const { isUpdating, handleSetCheckboxClick, handleCompleteAllSets } = useExerciseSetCompletion(
        planId,
        weekNumber,
        onSetComplete
    );

    const handleOpenDetailModal = () => setIsDetailModalOpen(true);
    const handleCloseDetailModal = () => setIsDetailModalOpen(false);

    const progressPercent = totalSets > 0 ? (setsDone / totalSets) * 100 : 0;

    const getAccentColor = () => {
        if (isExerciseComplete) return theme.palette.success.main;
        if (progressPercent > 0) return theme.palette.primary.main;
        return theme.palette.secondary.main;
    };
    const accentColor = getAccentColor();

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent click action if clicking on interactive elements like buttons
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        // Only handle exercise selection if in selection mode and handler is provided
        if (showSelectionMode && handleExerciseSelect) {
            handleExerciseSelect(exerciseId);
        }
    };

    return (
        <>
            <Paper
                elevation={2}
                data-testid="exercise-progress-card"
                onClick={handleCardClick}
                sx={{
                    mb: 2.5,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${isSelected ? alpha(theme.palette.secondary.main, 0.5) : alpha(accentColor, 0.2)}`,
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected
                        ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                        : `0 4px 12px ${alpha(accentColor, 0.1)}`,
                    '&:hover': {
                        boxShadow: isSelected
                            ? `0 8px 16px ${alpha(theme.palette.secondary.main, 0.25)}`
                            : `0 8px 16px ${alpha(accentColor, 0.15)}`,
                        transform: 'translateY(-3px)',
                        cursor: showSelectionMode ? 'pointer' : 'default'
                    }
                }}
            >
                {/* Main content area: Image on left, details on right */}
                <Box sx={{ display: 'flex', p: 1.5, gap: 2 }}>
                    {/* Image on the left */}
                    <Box
                        sx={{
                            width: 100, // Adjusted width for the image
                            height: 100, // Adjusted height for the image
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: alpha(theme.palette.text.primary, 0.03),
                            border: `1px solid ${alpha(accentColor, 0.1)}`,
                            flexShrink: 0
                        }}
                    >
                        {exercise.definition?.imageUrl ? (
                            <Image
                                src={exercise.definition.imageUrl}
                                alt={exercise.name || 'Exercise'}
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">No image</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Details section on the right */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box> {/* Top part of details: Name, Reps, Sets */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography
                                    variant="h6" // Larger for exercise name
                                    sx={{
                                        fontWeight: 'bold',
                                        color: isSelected ? theme.palette.secondary.main : theme.palette.text.primary,
                                        mb: 0.5,
                                        textShadow: isSelected
                                            ? `0 0 1px ${alpha(theme.palette.secondary.main, 0.3)}`
                                            : `0 0 1px ${alpha(accentColor, 0.3)}`
                                    }}
                                >
                                    {exercise.name || `Exercise: ${exercise._id}`}
                                </Typography>
                                <IconButton
                                    onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(); }}
                                    size="small"
                                    sx={{ color: theme.palette.info.main, mt: -0.5 }} // Align with top
                                >
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                                {exercise.reps} reps
                                {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                                {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` • ${exercise.weight}kg`}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography data-testid="sets-completed" sx={{ color: alpha(theme.palette.text.primary, 0.8), fontWeight: 'medium' }}>
                                    Sets: {setsDone}/{totalSets}
                                </Typography>
                                {isExerciseComplete && !isSelected && (
                                    <CheckCircleIcon data-testid="exercise-complete-badge" sx={{ color: theme.palette.success.main, fontSize: '1.2rem' }} />
                                )}
                                {exercise.definition?.hasComments && (
                                    <Chip
                                        label="Comments"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                            color: theme.palette.secondary.main,
                                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* Progress bar moved here - below name/reps/sets */}
                        <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                                height: 6, // Slightly thicker as per drawing
                                borderRadius: 1,
                                bgcolor: alpha(isSelected ? theme.palette.secondary.main : accentColor, 0.15),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: isSelected ? theme.palette.secondary.main : accentColor,
                                    borderRadius: 1,
                                },
                                my: 1 // Margin top and bottom
                            }}
                        />
                    </Box>
                </Box>

                {/* Controls and Chips Section - Revised as per new drawing */}
                <Box sx={{ px: 1.5, pb: 0.5 }}>
                    <Divider sx={{ bgcolor: alpha(theme.palette.divider, 1), my: 1.5 }} />

                    {/* First Row: Primary Muscle Chip + Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', minWidth: 'fit-content' }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    sx={{
                                        height: 24,
                                        fontSize: '0.75rem',
                                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                                        color: theme.palette.primary.main,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        fontWeight: 500
                                    }}
                                />
                            )}
                            {/* Secondary muscles removed as per new design */}
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <IconButton
                                data-testid="decrement-sets-button"
                                onClick={(e) => { e.stopPropagation(); handleSetCheckboxClick(exerciseId, setsDone - 1, setsDone, totalSets); }}
                                size="small"
                                disabled={isUpdating || setsDone <= 0}
                                sx={{
                                    color: theme.palette.text.primary,
                                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
                                    '&.Mui-disabled': { color: alpha(theme.palette.text.primary, 0.3) },
                                    width: 36, height: 36
                                }}
                            >
                                <RemoveIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                data-testid="increment-sets-button"
                                onClick={(e) => { e.stopPropagation(); handleSetCheckboxClick(exerciseId, setsDone + 1, setsDone, totalSets); }}
                                size="medium"
                                disabled={isUpdating || setsDone >= totalSets}
                                sx={{
                                    color: theme.palette.getContrastText(theme.palette.primary.main),
                                    bgcolor: alpha(theme.palette.primary.main, 0.9),
                                    '&:hover': { bgcolor: theme.palette.primary.main },
                                    '&.Mui-disabled': { color: theme.palette.getContrastText(theme.palette.primary.main), bgcolor: alpha(theme.palette.primary.main, 0.4) },
                                    width: 36, height: 36
                                }}
                            >
                                <AddIcon />
                            </IconButton>
                            <IconButton
                                data-testid="complete-all-sets-button"
                                onClick={(e) => { e.stopPropagation(); handleCompleteAllSets(exerciseId, setsDone, totalSets); }}
                                size="small"
                                disabled={isUpdating || setsDone >= totalSets}
                                sx={{
                                    color: theme.palette.getContrastText(theme.palette.success.main),
                                    bgcolor: alpha(theme.palette.success.main, 0.9),
                                    '&:hover': { bgcolor: theme.palette.success.main },
                                    '&.Mui-disabled': { color: theme.palette.getContrastText(theme.palette.success.main), bgcolor: alpha(theme.palette.success.main, 0.4) },
                                    width: 36, height: 36
                                }}
                            >
                                <DoneAllIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>
                </Box>
            </Paper>
            <ExerciseDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                exercise={exercise}
                planId={planId}
                weekNumber={weekNumber}
            />

            {/* Error notification for failed progress saves */}
            {isUpdating && (
                <Box
                    data-testid="error-notification"
                    sx={{
                        position: 'fixed',
                        top: 80,
                        right: 20,
                        zIndex: 9999,
                        bgcolor: theme.palette.error.main,
                        color: theme.palette.getContrastText(theme.palette.error.main),
                        p: 2,
                        borderRadius: 1,
                        display: 'none'
                    }}
                >
                    Could not save progress. Please try again.
                </Box>
            )}
        </>
    );
}; 