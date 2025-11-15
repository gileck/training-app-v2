import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    LinearProgress,
    alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Image from 'next/image';
import { useTheme } from '@mui/material/styles';

import { WorkoutExerciseItemProps } from './types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../hooks/useExerciseSetCompletion';

export const CompactWorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
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
    const isSelected = showSelectionMode ? selectedExercises.includes(exerciseId) : false;

    const { isUpdating, handleSetCheckboxClick } = useExerciseSetCompletion(
        planId,
        weekNumber,
        onSetComplete
    );

    const handleOpenDetailModal = () => setIsDetailModalOpen(true);
    const handleCloseDetailModal = () => setIsDetailModalOpen(false);

    const progressPercent = totalSets > 0 ? (setsDone / totalSets) * 100 : 0;

    const getAccentColor = () => {
        if (isExerciseComplete) return '#30d219';
        if (progressPercent > 0) return theme.palette.primary.main;
        return theme.palette.primary.main;
    };
    const accentColor = getAccentColor();
    const isDarkMode = theme.palette.mode === 'dark';
    const defaultCardBorderColor = isDarkMode ? 'gray' : 'lightgray';
    const selectedCardBorderColor = isDarkMode
        ? (theme.palette.primary.dark)
        : defaultCardBorderColor;

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        if (showSelectionMode && handleExerciseSelect) {
            handleExerciseSelect(exerciseId);
        }
    };

    return (
        <>
            <Paper
                elevation={1}
                data-testid="compact-exercise-card"
                onClick={handleCardClick}
                sx={{
                    mb: 1.5,
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.25) : theme.palette.background.paper,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${defaultCardBorderColor}`,
                    boxShadow: isSelected
                        ? `0 0 0 2px ${selectedCardBorderColor}`
                        : isExerciseComplete
                            ? `0 0 0 0.5px #30d219`
                            : 'none',
                    transition: 'none',
                }}
            >
                <Box sx={{ display: 'flex', p: 1.25, gap: 1.5, alignItems: 'center' }}>
                    {/* Compact Image - Clickable to open details */}
                    <Box
                        onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(); }}
                        sx={{
                            width: 50,
                            height: 50,
                            position: 'relative',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            bgcolor: alpha(theme.palette.text.primary, 0.03),
                            border: `1px solid ${alpha(accentColor, 0.1)}`,
                            flexShrink: 0,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                borderColor: theme.palette.primary.main
                            }
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
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>No img</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Main content area - flex grow */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Exercise name */}
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 'bold',
                                color: theme.palette.text.primary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0.5,
                                textShadow: isSelected
                                    ? `0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`
                                    : `0 0 1px ${alpha(accentColor, 0.3)}`
                            }}
                        >
                            {exercise.name || `Exercise: ${exercise._id}`}
                        </Typography>

                        {/* Sets and completion indicator */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <Typography
                                data-testid="sets-completed"
                                variant="body2"
                                sx={{
                                    color: alpha(theme.palette.text.primary, 0.7),
                                    fontWeight: 'medium',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {setsDone}/{totalSets} sets
                            </Typography>
                            {isExerciseComplete && (
                                <CheckCircleIcon
                                    data-testid="exercise-complete-badge"
                                    sx={{ color: theme.palette.success.main, fontSize: '1rem' }}
                                />
                            )}
                        </Box>

                        {/* Progress bar */}
                        <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                                height: 4,
                                borderRadius: 1,
                                bgcolor: alpha(accentColor, 0.15),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: accentColor,
                                    borderRadius: 1,
                                }
                            }}
                        />
                    </Box>

                    {/* Compact Controls - +/- only */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
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
                                width: 32,
                                height: 32
                            }}
                        >
                            <RemoveIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <IconButton
                            data-testid="increment-sets-button"
                            onClick={(e) => { e.stopPropagation(); handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets); }}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                color: theme.palette.getContrastText(theme.palette.primary.main),
                                bgcolor: alpha(theme.palette.primary.main, 0.9),
                                '&:hover': { bgcolor: theme.palette.primary.main },
                                '&.Mui-disabled': {
                                    color: theme.palette.getContrastText(theme.palette.primary.main),
                                    bgcolor: alpha(theme.palette.primary.main, 0.4)
                                },
                                width: 32,
                                height: 32
                            }}
                        >
                            <AddIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
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
        </>
    );
};

