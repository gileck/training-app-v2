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

import { WorkoutExerciseItemProps } from './types'; // WorkoutExercise type will come via props.exercise
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../hooks/useExerciseSetCompletion';

// --- Color constants ---
const LIGHT_CARD = '#FFFFFF';
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const NEON_PINK = '#D500F9';

export const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
    exercise,
    planId,
    weekNumber,
    onSetComplete,
    selectedExercises,
    handleExerciseSelect,
    showSelectionMode
}) => {
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
        if (isExerciseComplete) return NEON_GREEN;
        if (progressPercent > 0) return NEON_BLUE;
        return NEON_PURPLE;
    };
    const accentColor = getAccentColor();

    const handleHeaderClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showSelectionMode && handleExerciseSelect) {
            handleExerciseSelect(exerciseId);
        }
    };

    return (
        <>
            <Paper
                elevation={2}
                sx={{
                    mb: 2.5,
                    bgcolor: LIGHT_CARD,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${isSelected ? alpha(NEON_PINK, 0.5) : alpha(accentColor, 0.2)}`,
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected
                        ? `0 4px 12px ${alpha(NEON_PINK, 0.2)}`
                        : `0 4px 12px ${alpha(accentColor, 0.1)}`,
                    '&:hover': {
                        boxShadow: isSelected
                            ? `0 8px 16px ${alpha(NEON_PINK, 0.25)}`
                            : `0 8px 16px ${alpha(accentColor, 0.15)}`,
                        transform: 'translateY(-3px)'
                    }
                }}
            >
                <Box
                    onClick={handleHeaderClick}
                    sx={{
                        p: 1.5,
                        bgcolor: isSelected ? alpha(NEON_PINK, 0.1) : alpha(accentColor, 0.05),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid ${isSelected ? alpha(NEON_PINK, 0.3) : alpha(accentColor, 0.1)}`,
                        cursor: showSelectionMode ? 'pointer' : 'default' // Only show pointer if selectable
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isSelected && (
                            <CheckCircleIcon sx={{ color: NEON_PINK }} />
                        )}
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 'bold',
                                color: isSelected ? NEON_PINK : '#333',
                                textShadow: isSelected
                                    ? `0 0 1px ${alpha(NEON_PINK, 0.3)}`
                                    : `0 0 1px ${alpha(accentColor, 0.3)}`
                            }}
                        >
                            {exercise.name || `Exercise: ${exercise._id}`}
                        </Typography>
                        {isExerciseComplete && !isSelected && (
                            <CheckCircleIcon sx={{ color: NEON_GREEN }} />
                        )}
                    </Box>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                        height: 4,
                        bgcolor: alpha(isSelected ? NEON_PINK : accentColor, 0.1),
                        '& .MuiLinearProgress-bar': {
                            bgcolor: isSelected ? NEON_PINK : accentColor
                        }
                    }}
                />
                <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: alpha('#000000', 0.03),
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
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: alpha('#000000', 0.7) }}>
                            {exercise.reps} reps
                            {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` • ${exercise.weight}kg`}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                            <Typography sx={{ color: alpha('#000000', 0.8), fontWeight: 'medium' }}>
                                Sets: {setsDone}/{totalSets}
                            </Typography>
                            {exercise.definition?.hasComments && (
                                <Chip
                                    label="Comments"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: alpha(NEON_PINK, 0.1),
                                        color: NEON_PINK,
                                        border: `1px solid ${alpha(NEON_PINK, 0.2)}`
                                    }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        bgcolor: alpha(NEON_BLUE, 0.1),
                                        color: NEON_BLUE,
                                        border: `1px solid ${alpha(NEON_BLUE, 0.2)}`
                                    }}
                                />
                            )}
                            {exercise.definition?.secondaryMuscles?.map((muscle, index) => (
                                <Chip
                                    key={index}
                                    label={muscle}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        bgcolor: alpha('#000000', 0.05),
                                        color: alpha('#000000', 0.6),
                                        border: `1px solid ${alpha('#000000', 0.1)}`
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
                <Divider sx={{ bgcolor: alpha('#000000', 0.05) }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5 }}>
                    <IconButton
                        onClick={handleOpenDetailModal}
                        size="small"
                        sx={{ color: NEON_PURPLE }}
                    >
                        <InfoIcon fontSize="small" />
                    </IconButton>
                    <Stack direction="row" spacing={1.5}>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone <= 0}
                            sx={{
                                color: '#333',
                                bgcolor: alpha('#000000', 0.03),
                                '&:hover': {
                                    bgcolor: alpha('#000000', 0.06)
                                },
                                '&.Mui-disabled': {
                                    color: alpha('#000000', 0.2)
                                }
                            }}
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                color: '#fff',
                                bgcolor: alpha(NEON_BLUE, 0.8),
                                '&:hover': {
                                    bgcolor: NEON_BLUE
                                },
                                '&.Mui-disabled': {
                                    color: '#fff',
                                    bgcolor: alpha(NEON_BLUE, 0.4)
                                }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleCompleteAllSets(exerciseId, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                color: '#fff',
                                bgcolor: alpha(NEON_GREEN, 0.8),
                                '&:hover': {
                                    bgcolor: NEON_GREEN
                                },
                                '&.Mui-disabled': {
                                    color: '#fff',
                                    bgcolor: alpha(NEON_GREEN, 0.4)
                                }
                            }}
                        >
                            <DoneAllIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
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