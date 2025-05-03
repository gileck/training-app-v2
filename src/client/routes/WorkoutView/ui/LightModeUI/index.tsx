import React from 'react';
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
    alpha,
    Divider,
    LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// --- Color constants for the light theme --- //
const LIGHT_BG = '#FFFFFF';
const LIGHT_PAPER = '#F5F5F7';
const LIGHT_CARD = '#FFFFFF';
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const NEON_PINK = '#D500F9';

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: NEON_PURPLE }} />
        </Box>
    );
    if (error) return (
        <Alert
            severity="error"
            sx={{
                my: 2,
                bgcolor: alpha('#FF0000', 0.1),
                color: '#D32F2F',
                border: `1px solid ${alpha('#FF0000', 0.2)}`,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                    color: '#D32F2F'
                }
            }}
        >
            {error}
        </Alert>
    );
    return null;
};

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate, isWeekLoading = false }) => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 3,
                bgcolor: LIGHT_PAPER,
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha(NEON_PURPLE, 0.2)}`,
                boxShadow: `0 4px 12px ${alpha(NEON_PURPLE, 0.15)}`
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                <IconButton
                    onClick={() => onNavigate(currentWeek - 1)}
                    disabled={currentWeek <= 1 || isWeekLoading}
                    sx={{
                        color: NEON_PURPLE,
                        '&.Mui-disabled': {
                            color: alpha(NEON_PURPLE, 0.3)
                        }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {isWeekLoading ? (
                        <CircularProgress
                            size={24}
                            sx={{
                                color: NEON_BLUE,
                                position: 'absolute',
                                left: -36,
                                mx: 'auto'
                            }}
                        />
                    ) : null}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#333',
                            textShadow: `0 0 1px ${alpha(NEON_PURPLE, 0.3)}`
                        }}
                    >
                        WEEK {currentWeek} / {maxWeeks}
                    </Typography>
                </Box>
                <IconButton
                    onClick={() => onNavigate(currentWeek + 1)}
                    disabled={currentWeek >= maxWeeks || isWeekLoading}
                    sx={{
                        color: NEON_PURPLE,
                        '&.Mui-disabled': {
                            color: alpha(NEON_PURPLE, 0.3)
                        }
                    }}
                >
                    <ArrowForwardIcon />
                </IconButton>
            </Stack>
        </Paper>
    );
};

const WorkoutExerciseItem: React.FC<WorkoutExerciseItemProps> = ({
    exercise,
    planId,
    weekNumber,
    onSetComplete,
    showSelectionMode,
    selectedExercises,
    handleExerciseSelect
}) => {
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const setsDone = exercise.progress?.setsCompleted || 0;
    const totalSets = exercise.sets;
    const isExerciseComplete = setsDone >= totalSets;
    const exerciseId = exercise._id.toString();

    const { isUpdating, handleSetCheckboxClick, handleCompleteAllSets } = useExerciseSetCompletion(
        planId,
        weekNumber,
        onSetComplete
    );

    const handleOpenDetailModal = () => setIsDetailModalOpen(true);
    const handleCloseDetailModal = () => setIsDetailModalOpen(false);

    // Progress calculation
    const progressPercent = (setsDone / totalSets) * 100;

    // Get appropriate accent color
    const getAccentColor = () => {
        if (isExerciseComplete) return NEON_GREEN;
        if (progressPercent > 0) return NEON_BLUE;
        return NEON_PURPLE;
    };

    const accentColor = getAccentColor();

    return (
        <>
            <Paper
                elevation={2}
                sx={{
                    mb: 2.5,
                    bgcolor: LIGHT_CARD,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(accentColor, 0.2)}`,
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 12px ${alpha(accentColor, 0.1)}`,
                    '&:hover': {
                        boxShadow: `0 8px 16px ${alpha(accentColor, 0.15)}`,
                        transform: 'translateY(-3px)'
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 1.5,
                    bgcolor: alpha(accentColor, 0.05),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${alpha(accentColor, 0.1)}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 'bold',
                                color: '#333',
                                textShadow: `0 0 1px ${alpha(accentColor, 0.3)}`
                            }}
                        >
                            {exercise.name || `Exercise: ${exercise._id}`}
                        </Typography>
                        {isExerciseComplete && (
                            <CheckCircleIcon sx={{ color: NEON_GREEN }} />
                        )}
                    </Box>
                    {showSelectionMode && (
                        <Checkbox
                            checked={selectedExercises.includes(exerciseId)}
                            onChange={() => handleExerciseSelect(exerciseId)}
                            sx={{
                                color: alpha(NEON_PINK, 0.5),
                                '&.Mui-checked': {
                                    color: NEON_PINK
                                }
                            }}
                        />
                    )}
                </Box>

                {/* Progress bar */}
                <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                        height: 4,
                        bgcolor: alpha(accentColor, 0.1),
                        '& .MuiLinearProgress-bar': {
                            bgcolor: accentColor
                        }
                    }}
                />

                {/* Content */}
                <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                    {/* Left: Image */}
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

                    {/* Right: Details */}
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

                        {/* Muscle tags */}
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

                {/* Action buttons */}
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

// Main Component
export const NeonLightWorkoutView: React.FC<WorkoutViewProps> = ({
    planId,
    weekNumber,
    planDetails,
    isLoading,
    error,
    activeExercises,
    completedExercises,
    showCompleted,
    selectedExercises,
    showSelectionMode,
    progressPercentage,
    totalExercises,
    completedExercisesCount,

    navigate,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    handleStartSelectionMode,
    handleCancelSelectionMode,
    handleStartWorkout,
    toggleShowCompleted,
    handleNavigateWeek
}) => {
    // State to track loading of week data
    const [isWeekLoading, setIsWeekLoading] = React.useState(false);

    // Modified navigate handler to show loading state
    const handleWeekNavigate = (week: number) => {
        setIsWeekLoading(true);
        handleNavigateWeek(week);
    };

    // Reset loading state when data arrives or week number changes
    React.useEffect(() => {
        if (!isLoading) {
            setIsWeekLoading(false);
        }
    }, [isLoading, weekNumber]);

    if (!planId) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 2, color: '#D32F2F', fontWeight: 'bold' }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: alpha('#000000', 0.6) }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        bgcolor: NEON_PURPLE,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    if (error && !isWeekLoading) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 2, color: NEON_PURPLE, fontWeight: 'bold' }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        mt: 2,
                        bgcolor: NEON_PURPLE,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    // Show full page loading only for initial load, not for week changes
    if (isLoading && !isWeekLoading && !planDetails) {
        return <LoadingErrorDisplay isLoading={true} error={null} />;
    }

    if (!planDetails) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography>Plan details could not be loaded.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: LIGHT_BG,
            color: '#333',
            minHeight: '100vh',
            pb: 8
        }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.75rem', md: '2.25rem' },
                        fontWeight: 'bold',
                        color: '#333',
                        textShadow: `0 0 1px ${alpha(NEON_PURPLE, 0.3)}`,
                        letterSpacing: 1,
                        mb: 1
                    }}
                >
                    {planDetails.name}
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: alpha('#000000', 0.6),
                        textTransform: 'uppercase',
                        letterSpacing: 2
                    }}
                >
                    Training Program
                </Typography>
            </Box>

            <WeekNavigator
                currentWeek={weekNumber}
                maxWeeks={planDetails.durationWeeks}
                onNavigate={handleWeekNavigate}
                isWeekLoading={isWeekLoading}
            />

            {/* Weekly Progress */}
            <Paper
                elevation={2}
                sx={{
                    mb: 4,
                    p: 2,
                    bgcolor: LIGHT_PAPER,
                    borderRadius: 3,
                    border: `1px solid ${alpha(NEON_BLUE, 0.2)}`,
                    boxShadow: `0 4px 12px ${alpha(NEON_BLUE, 0.1)}`
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: alpha('#000000', 0.8) }}>
                        Weekly Progress
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 'bold',
                            color: progressPercentage >= 100 ? NEON_GREEN : NEON_BLUE
                        }}
                    >
                        {progressPercentage.toFixed(0)}%
                    </Typography>
                </Box>

                <Box sx={{ position: 'relative', height: 8, mb: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(NEON_BLUE, 0.1),
                            '& .MuiLinearProgress-bar': {
                                bgcolor: progressPercentage >= 100 ? NEON_GREEN : NEON_BLUE,
                                borderRadius: 4
                            }
                        }}
                    />
                </Box>

                <Typography
                    variant="body2"
                    align="center"
                    sx={{ color: alpha('#000000', 0.6) }}
                >
                    {completedExercisesCount} of {totalExercises} exercises completed
                </Typography>
            </Paper>

            {/* Display content area loading state during week changes */}
            {(isLoading || isWeekLoading) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                    <CircularProgress sx={{ color: NEON_PURPLE }} />
                </Box>
            ) : (
                <>
                    {/* Actions */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                fontWeight: 'bold',
                                color: '#333',
                                position: 'relative',
                                '&:after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: -8,
                                    left: 0,
                                    width: 40,
                                    height: 2,
                                    bgcolor: NEON_PURPLE
                                }
                            }}
                        >
                            Exercises
                        </Typography>

                        {!showSelectionMode ? (
                            <Button
                                variant="contained"
                                onClick={handleStartSelectionMode}
                                startIcon={<FlashOnIcon />}
                                sx={{
                                    bgcolor: NEON_PINK,
                                    color: 'white',
                                    borderRadius: 8,
                                    textTransform: 'none',
                                    boxShadow: `0 4px 12px ${alpha(NEON_PINK, 0.3)}`,
                                    '&:hover': {
                                        bgcolor: alpha(NEON_PINK, 0.9),
                                        boxShadow: `0 6px 14px ${alpha(NEON_PINK, 0.4)}`
                                    }
                                }}
                            >
                                Create Workout
                            </Button>
                        ) : (
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleStartWorkout}
                                    disabled={selectedExercises.length === 0}
                                    startIcon={<FlashOnIcon />}
                                    sx={{
                                        bgcolor: NEON_GREEN,
                                        color: 'white',
                                        borderRadius: 8,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        boxShadow: `0 4px 12px ${alpha(NEON_GREEN, 0.3)}`,
                                        '&:hover': {
                                            bgcolor: alpha(NEON_GREEN, 0.9),
                                            boxShadow: `0 6px 14px ${alpha(NEON_GREEN, 0.4)}`
                                        },
                                        '&.Mui-disabled': {
                                            color: alpha('#FFFFFF', 0.4),
                                            bgcolor: alpha(NEON_GREEN, 0.3)
                                        }
                                    }}
                                >
                                    Start ({selectedExercises.length})
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelSelectionMode}
                                    sx={{
                                        color: '#333',
                                        borderColor: alpha('#000000', 0.3),
                                        borderRadius: 8,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#000000',
                                            bgcolor: alpha('#000000', 0.05)
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        )}
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
                                {activeExercises.length > 0 && (
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
                                )}
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
                </>
            )}

            {/* Selected exercises summary */}
            {showSelectionMode && selectedExercises.length > 0 && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 32px)',
                        maxWidth: 500,
                        p: 2,
                        borderRadius: 3,
                        zIndex: 100,
                        bgcolor: alpha(LIGHT_PAPER, 0.95),
                        border: `1px solid ${alpha(NEON_PURPLE, 0.3)}`,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 5px 15px ${alpha(NEON_PURPLE, 0.2)}`
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                        Selected: {selectedExercises.length}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {selectedExercises.map((exerciseId) => {
                            const exercise = [...activeExercises, ...completedExercises].find(e =>
                                e._id.toString() === exerciseId
                            );
                            return (
                                <Chip
                                    key={exerciseId}
                                    label={exercise?.name || exerciseId}
                                    onDelete={() => handleExerciseSelect(exerciseId)}
                                    sx={{
                                        bgcolor: alpha(NEON_PURPLE, 0.1),
                                        color: NEON_PURPLE,
                                        border: `1px solid ${alpha(NEON_PURPLE, 0.2)}`,
                                        '& .MuiChip-deleteIcon': {
                                            color: alpha(NEON_PURPLE, 0.7),
                                            '&:hover': {
                                                color: NEON_PURPLE
                                            }
                                        }
                                    }}
                                />
                            );
                        })}
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleStartWorkout}
                        startIcon={<FlashOnIcon />}
                        fullWidth
                        sx={{
                            py: 1,
                            bgcolor: NEON_GREEN,
                            color: 'white',
                            fontWeight: 'bold',
                            borderRadius: 8,
                            textTransform: 'none',
                            boxShadow: `0 4px 12px ${alpha(NEON_GREEN, 0.3)}`,
                            '&:hover': {
                                bgcolor: alpha(NEON_GREEN, 0.9),
                                boxShadow: `0 6px 14px ${alpha(NEON_GREEN, 0.4)}`
                            }
                        }}
                    >
                        Start Workout
                    </Button>
                </Paper>
            )}
        </Box>
    );
};