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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#000' }} />
        </Box>
    );
    if (error) return (
        <Alert
            severity="error"
            sx={{
                my: 2,
                borderRadius: 0,
                boxShadow: 'none',
                bgcolor: '#fff',
                border: '1px solid #f44336',
                color: '#f44336',
                '& .MuiAlert-icon': {
                    color: '#f44336'
                }
            }}
        >
            {error}
        </Alert>
    );
    return null;
};

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate }) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            borderBottom: '1px solid #eee',
            pb: 2
        }}>
            <IconButton
                onClick={() => onNavigate(currentWeek - 1)}
                disabled={currentWeek <= 1}
                sx={{ color: '#000' }}
            >
                <ArrowBackIcon />
            </IconButton>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Week {currentWeek} of {maxWeeks}
            </Typography>
            <IconButton
                onClick={() => onNavigate(currentWeek + 1)}
                disabled={currentWeek >= maxWeeks}
                sx={{ color: '#000' }}
            >
                <ArrowForwardIcon />
            </IconButton>
        </Box>
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

    return (
        <>
            <Box
                sx={{
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid #eee',
                    opacity: isExerciseComplete ? 0.6 : 1
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 500,
                            color: '#000',
                            textDecoration: isExerciseComplete ? 'line-through' : 'none'
                        }}
                    >
                        {exercise.name || `Exercise: ${exercise._id}`}
                    </Typography>

                    {showSelectionMode && (
                        <Checkbox
                            checked={selectedExercises.includes(exerciseId)}
                            onChange={() => handleExerciseSelect(exerciseId)}
                            sx={{
                                color: '#ccc',
                                padding: 0,
                                '&.Mui-checked': {
                                    color: '#000'
                                }
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Left: Image */}
                    <Box
                        sx={{
                            width: 70,
                            height: 70,
                            position: 'relative',
                            bgcolor: '#f5f5f5',
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
                                <Typography variant="caption" color="#aaa">No image</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Right: Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#777', mb: 1 }}>
                            {exercise.reps} reps
                            {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` · ${exercise.weight}kg`}
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Sets: {setsDone}/{totalSets}
                        </Typography>

                        {/* Muscle tags */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        border: '1px solid #ddd',
                                        color: '#555'
                                    }}
                                />
                            )}
                            {exercise.definition?.secondaryMuscles?.map((muscle, index) => (
                                <Chip
                                    key={index}
                                    label={muscle}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        border: '1px solid #eee',
                                        color: '#888'
                                    }}
                                />
                            ))}
                            {exercise.definition?.hasComments && (
                                <Chip
                                    label="Comments"
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        border: '1px solid #ddd',
                                        color: '#555'
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                        onClick={handleOpenDetailModal}
                        size="small"
                        startIcon={<InfoOutlinedIcon fontSize="small" />}
                        sx={{
                            color: '#777',
                            textTransform: 'none',
                            padding: 0,
                            minWidth: 'auto',
                            '&:hover': {
                                color: '#000',
                                background: 'none'
                            }
                        }}
                    >
                        Details
                    </Button>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone <= 0}
                            sx={{
                                minWidth: 30,
                                width: 30,
                                height: 30,
                                p: 0,
                                color: '#000',
                                border: '1px solid #ddd',
                                borderRadius: 0,
                                '&:hover': {
                                    border: '1px solid #000',
                                    background: 'none'
                                },
                                '&.Mui-disabled': {
                                    color: '#ccc',
                                    border: '1px solid #eee'
                                }
                            }}
                        >
                            <RemoveIcon fontSize="small" />
                        </Button>
                        <Button
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                minWidth: 30,
                                width: 30,
                                height: 30,
                                p: 0,
                                color: '#000',
                                border: '1px solid #ddd',
                                borderRadius: 0,
                                '&:hover': {
                                    border: '1px solid #000',
                                    background: 'none'
                                },
                                '&.Mui-disabled': {
                                    color: '#ccc',
                                    border: '1px solid #eee'
                                }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </Button>
                        <Button
                            onClick={() => handleCompleteAllSets(exerciseId, setsDone, totalSets)}
                            size="small"
                            disabled={isUpdating || setsDone >= totalSets}
                            sx={{
                                minWidth: 30,
                                width: 30,
                                height: 30,
                                p: 0,
                                color: '#000',
                                border: '1px solid #ddd',
                                borderRadius: 0,
                                '&:hover': {
                                    border: '1px solid #000',
                                    background: 'none'
                                },
                                '&.Mui-disabled': {
                                    color: '#ccc',
                                    border: '1px solid #eee'
                                }
                            }}
                        >
                            <CheckIcon fontSize="small" />
                        </Button>
                    </Stack>
                </Box>
            </Box>

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
export const MinimalistWorkoutView: React.FC<WorkoutViewProps> = ({
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
    if (isLoading) {
        return <LoadingErrorDisplay isLoading={true} error={null} />;
    }

    if (!planId) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#777' }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        borderRadius: 0,
                        color: '#000',
                        borderColor: '#000',
                        '&:hover': {
                            borderColor: '#000',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    sx={{
                        mt: 2,
                        textTransform: 'none',
                        borderRadius: 0,
                        color: '#000',
                        borderColor: '#000',
                        '&:hover': {
                            borderColor: '#000',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    if (!planDetails) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="body1">Plan details could not be loaded.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3, borderBottom: '1px solid #eee', pb: 3 }}>
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 400,
                        color: '#000',
                        letterSpacing: '-0.01em'
                    }}
                >
                    {planDetails.name}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#777',
                        mt: 0.5
                    }}
                >
                    Training Program
                </Typography>
            </Box>

            <WeekNavigator
                currentWeek={weekNumber}
                maxWeeks={planDetails.durationWeeks}
                onNavigate={handleNavigateWeek}
            />

            {/* Weekly Progress */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#777' }}>
                        Weekly Progress
                    </Typography>
                    <Typography variant="body2">
                        {completedExercisesCount} of {totalExercises} ({progressPercentage.toFixed(0)}%)
                    </Typography>
                </Box>

                <Box sx={{ position: 'relative', height: 4, mb: 3 }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '100%',
                            bgcolor: '#f5f5f5'
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progressPercentage}%`,
                            bgcolor: '#000',
                            transition: 'width 0.3s ease'
                        }}
                    />
                </Box>
            </Box>

            {/* Workout actions */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Exercises
                </Typography>

                {!showSelectionMode ? (
                    <Button
                        onClick={handleStartSelectionMode}
                        variant="outlined"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            borderRadius: 0,
                            borderColor: '#000',
                            color: '#000',
                            '&:hover': {
                                borderColor: '#000',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        Create Workout
                    </Button>
                ) : (
                    <Stack direction="row" spacing={2}>
                        <Button
                            onClick={handleStartWorkout}
                            variant="contained"
                            disabled={selectedExercises.length === 0}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 0,
                                bgcolor: '#000',
                                color: '#fff',
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: '#333',
                                    boxShadow: 'none'
                                },
                                '&.Mui-disabled': {
                                    bgcolor: '#eee',
                                    color: '#aaa'
                                }
                            }}
                        >
                            Start ({selectedExercises.length})
                        </Button>
                        <Button
                            onClick={handleCancelSelectionMode}
                            variant="text"
                            sx={{
                                textTransform: 'none',
                                color: '#777',
                                '&:hover': {
                                    bgcolor: 'transparent',
                                    color: '#000'
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
                <Box sx={{ textAlign: 'center', py: 5, border: '1px solid #eee' }}>
                    <Typography variant="body1" color="#777">
                        No exercises found for this plan
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box sx={{ mb: 4 }}>
                        {activeExercises.length > 0 && (
                            <Typography
                                variant="body2"
                                sx={{
                                    mb: 2,
                                    color: '#777',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: '0.8rem'
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
                                variant="text"
                                fullWidth
                                sx={{
                                    justifyContent: 'space-between',
                                    textTransform: 'none',
                                    color: '#777',
                                    border: '1px solid #eee',
                                    borderRadius: 0,
                                    p: 1.5,
                                    mb: 2,
                                    '&:hover': {
                                        bgcolor: '#f9f9f9'
                                    }
                                }}
                                endIcon={showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                                <Box component="span">
                                    Completed Exercises ({completedExercises.length})
                                </Box>
                            </Button>

                            {showCompleted && (
                                <Box>
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
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* Selected exercises summary */}
            {showSelectionMode && selectedExercises.length > 0 && (
                <Paper
                    elevation={1}
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 0,
                        border: '1px solid #eee',
                        boxShadow: 'none'
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Selected Exercises: {selectedExercises.length}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                        {selectedExercises.map((exerciseId) => {
                            const exercise = [...activeExercises, ...completedExercises].find(e =>
                                e._id.toString() === exerciseId
                            );
                            return (
                                <Chip
                                    key={exerciseId}
                                    label={exercise?.name || exerciseId}
                                    onDelete={() => handleExerciseSelect(exerciseId)}
                                    size="small"
                                    sx={{
                                        borderRadius: 0,
                                        bgcolor: '#f5f5f5',
                                        color: '#000',
                                        border: '1px solid #eee',
                                        '& .MuiChip-deleteIcon': {
                                            color: '#777',
                                            '&:hover': {
                                                color: '#000'
                                            }
                                        }
                                    }}
                                />
                            );
                        })}
                    </Box>
                    <Button
                        onClick={handleStartWorkout}
                        variant="contained"
                        fullWidth
                        sx={{
                            textTransform: 'none',
                            borderRadius: 0,
                            bgcolor: '#000',
                            color: '#fff',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#333',
                                boxShadow: 'none'
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