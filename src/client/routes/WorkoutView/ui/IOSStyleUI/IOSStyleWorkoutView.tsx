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
    Switch,
    Card,
    styled,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// Styled components for iOS feel
const IOSButton = styled(Button)(() => ({
    borderRadius: 8,
    padding: '8px 16px',
    textTransform: 'none',
    fontWeight: 500,
    boxShadow: 'none',
    transition: 'all 0.2s',
    '&:hover': {
        boxShadow: 'none',
        opacity: 0.9,
    },
}));

const IOSCard = styled(Paper)(() => ({
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
    backgroundColor: '#fff',
}));

const IOSProgressBar = styled(Box)(() => ({
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
}));

const IOSProgressIndicator = styled(Box)<{ value: number }>(({ value }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${value}%`,
    backgroundColor: '#007AFF', // iOS blue
    borderRadius: 3,
    transition: 'width 0.3s ease'
}));

const IOSSwitch = styled(Switch)(() => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#34C759', // iOS green
        '&:hover': {
            backgroundColor: 'rgba(52, 199, 89, 0.08)',
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: '#34C759', // iOS green
    },
}));

const IOSSectionHeader = styled(Typography)(() => ({
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#8e8e93', // iOS gray
    marginTop: 24,
    marginBottom: 12,
    paddingLeft: 8,
}));

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#007AFF' }} /> {/* iOS blue */}
        </Box>
    );
    if (error) return (
        <Alert
            severity="error"
            sx={{
                my: 2,
                borderRadius: 10,
                boxShadow: 'none',
                border: '1px solid rgba(255, 59, 48, 0.1)', // iOS red with opacity
                bgcolor: 'rgba(255, 59, 48, 0.05)',
                color: '#FF3B30', // iOS red
                '& .MuiAlert-icon': {
                    color: '#FF3B30' // iOS red
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
            mb: 2,
            py: 1.5,
            px: 1,
            bgcolor: 'rgba(0, 122, 255, 0.06)', // iOS blue with opacity
            borderRadius: 3
        }}>
            <IconButton
                onClick={() => onNavigate(currentWeek - 1)}
                disabled={currentWeek <= 1}
                sx={{ color: '#007AFF' }} // iOS blue
            >
                <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Typography sx={{
                fontWeight: 600,
                color: '#007AFF', // iOS blue
                fontSize: { xs: '1rem', sm: '1.1rem' }
            }}>
                Week {currentWeek} of {maxWeeks}
            </Typography>
            <IconButton
                onClick={() => onNavigate(currentWeek + 1)}
                disabled={currentWeek >= maxWeeks}
                sx={{ color: '#007AFF' }} // iOS blue
            >
                <ArrowForwardIosIcon fontSize="small" />
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

    // Progress calculation
    const progressPercent = (setsDone / totalSets) * 100;

    return (
        <>
            <IOSCard>
                <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
                    {/* Header with name and selection checkbox */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                color: isExerciseComplete ? '#34C759' : '#000'  // iOS green if complete, black otherwise
                            }}>
                                {exercise.name || `Exercise: ${exercise._id}`}
                            </Typography>
                            {isExerciseComplete && (
                                <CheckCircleIcon sx={{ color: '#34C759', fontSize: 18 }} /> // iOS green
                            )}
                        </Box>

                        {showSelectionMode && (
                            <IOSSwitch
                                checked={selectedExercises.includes(exerciseId)}
                                onChange={() => handleExerciseSelect(exerciseId)}
                                size="small"
                            />
                        )}
                    </Box>

                    {/* Content with image and details */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Left: Image */}
                        <Box sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#F2F2F7', // iOS light gray
                        }}>
                            {exercise.definition?.imageUrl ? (
                                <Image
                                    src={exercise.definition.imageUrl}
                                    alt={exercise.name || 'Exercise'}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                />
                            ) : (
                                <Box sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8E8E93', // iOS gray
                                }}>
                                    <Typography variant="caption">No image</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Right: Details */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                <Typography sx={{
                                    color: '#8E8E93', // iOS gray
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}>
                                    Sets: {setsDone}/{totalSets} • {exercise.reps} reps
                                    {exercise.definition?.bodyWeight ? ' • Body weight' : ''}
                                    {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` • ${exercise.weight}kg`}
                                </Typography>

                                {/* Progress bar */}
                                <IOSProgressBar>
                                    <IOSProgressIndicator value={progressPercent} />
                                </IOSProgressBar>

                                {/* Muscle tags */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                    {exercise.definition?.primaryMuscle && (
                                        <Chip
                                            label={exercise.definition.primaryMuscle}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(0, 122, 255, 0.1)', // iOS blue with opacity
                                                color: '#007AFF', // iOS blue
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                borderRadius: 4
                                            }}
                                        />
                                    )}
                                    {exercise.definition?.secondaryMuscles?.map((muscle, index) => (
                                        <Chip
                                            key={index}
                                            label={muscle}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(142, 142, 147, 0.1)', // iOS gray with opacity
                                                color: '#8E8E93', // iOS gray
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                borderRadius: 4
                                            }}
                                        />
                                    ))}
                                    {exercise.definition?.hasComments && (
                                        <Chip
                                            label="Comments"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255, 149, 0, 0.1)', // iOS orange with opacity
                                                color: '#FF9500', // iOS orange
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 20,
                                                borderRadius: 4
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 2,
                        pt: 1.5,
                        borderTop: '1px solid #F2F2F7' // iOS light gray
                    }}>
                        <Button
                            startIcon={<InfoOutlinedIcon />}
                            onClick={handleOpenDetailModal}
                            sx={{
                                textTransform: 'none',
                                color: '#007AFF', // iOS blue
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    opacity: 0.8
                                }
                            }}
                        >
                            Details
                        </Button>

                        <Stack direction="row" spacing={1.5}>
                            <IconButton
                                onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                                size="small"
                                disabled={isUpdating || setsDone <= 0}
                                sx={{
                                    color: '#8E8E93', // iOS gray
                                    bgcolor: '#F2F2F7', // iOS light gray
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                        bgcolor: '#E5E5EA' // iOS light gray (darker)
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
                                    color: '#FFFFFF',
                                    bgcolor: '#007AFF', // iOS blue
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                        bgcolor: '#0062CC' // iOS blue (darker)
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'rgba(0, 122, 255, 0.5)' // iOS blue with opacity
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
                                    color: '#FFFFFF',
                                    bgcolor: '#34C759', // iOS green
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                        bgcolor: '#2EB251' // iOS green (darker)
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'rgba(52, 199, 89, 0.5)' // iOS green with opacity
                                    }
                                }}
                            >
                                <DoneAllIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>
                </Box>
            </IOSCard>

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
export const IOSStyleWorkoutView: React.FC<WorkoutViewProps> = ({
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
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 600, mb: 2, color: '#FF3B30' }}> {/* iOS red */}
                    No Training Plan Selected
                </Typography>
                <Typography sx={{ mb: 3, color: '#8E8E93' }}> {/* iOS gray */}
                    {error || "Please select a training plan to view."}
                </Typography>
                <IOSButton
                    variant="contained"
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIosNewIcon />}
                    sx={{ bgcolor: '#007AFF', color: 'white' }} // iOS blue
                >
                    Go to Training Plans
                </IOSButton>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 600, mb: 2, color: '#007AFF' }}> {/* iOS blue */}
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <IOSButton
                    variant="contained"
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIosNewIcon />}
                    sx={{ bgcolor: '#007AFF', color: 'white', mt: 2 }} // iOS blue
                >
                    Back to Plans
                </IOSButton>
            </Box>
        );
    }

    if (!planDetails) {
        return <Typography sx={{ p: 2 }}>Plan details could not be loaded.</Typography>;
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.4rem', sm: '1.6rem' },
                        fontWeight: 700,
                        color: '#000', // iOS black
                        mb: 0.5
                    }}
                >
                    {planDetails.name}
                </Typography>
                <Typography
                    sx={{
                        color: '#8E8E93', // iOS gray
                        fontWeight: 500
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
            <Box sx={{ mb: 3, mt: 2, px: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#8E8E93' }}> {/* iOS gray */}
                        Weekly Progress
                    </Typography>
                    <Typography sx={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: progressPercentage >= 100 ? '#34C759' : '#007AFF' // iOS green or blue
                    }}>
                        {completedExercisesCount}/{totalExercises} • {progressPercentage.toFixed(0)}%
                    </Typography>
                </Box>

                <IOSProgressBar>
                    <IOSProgressIndicator value={progressPercentage} />
                </IOSProgressBar>
            </Box>

            {/* Workout actions */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 4,
                backgroundColor: '#F2F2F7', // iOS light gray
                borderRadius: 12,
                p: 2
            }}>
                {!showSelectionMode ? (
                    <>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            Create New Workout
                        </Typography>
                        <IOSButton
                            onClick={handleStartSelectionMode}
                            variant="contained"
                            sx={{ bgcolor: '#007AFF', color: 'white' }} // iOS blue
                        >
                            Select Exercises
                        </IOSButton>
                    </>
                ) : (
                    <>
                        <IOSButton
                            onClick={handleCancelSelectionMode}
                            variant="outlined"
                            sx={{
                                color: '#8E8E93', // iOS gray
                                borderColor: '#8E8E93', // iOS gray
                                '&:hover': {
                                    borderColor: '#8E8E93' // iOS gray
                                }
                            }}
                        >
                            Cancel
                        </IOSButton>
                        <IOSButton
                            onClick={handleStartWorkout}
                            variant="contained"
                            disabled={selectedExercises.length === 0}
                            sx={{
                                bgcolor: '#34C759', // iOS green
                                color: 'white',
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(52, 199, 89, 0.5)' // iOS green with opacity
                                }
                            }}
                        >
                            Start Workout ({selectedExercises.length})
                        </IOSButton>
                    </>
                )}
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <Box sx={{
                    textAlign: 'center',
                    mt: 6,
                    p: 4,
                    borderRadius: 12,
                    border: '1px solid #F2F2F7', // iOS light gray
                    backgroundColor: '#FFFFFF'
                }}>
                    <Typography sx={{ color: '#8E8E93', fontWeight: 500 }}> {/* iOS gray */}
                        No exercises found for this plan
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    {activeExercises.length > 0 && (
                        <Box>
                            <IOSSectionHeader>
                                Active Exercises
                            </IOSSectionHeader>

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
                    )}

                    {/* Completed Exercises */}
                    {completedExercises.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <IOSButton
                                onClick={toggleShowCompleted}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    justifyContent: 'space-between',
                                    py: 1.5,
                                    mb: 1,
                                    backgroundColor: '#F2F2F7', // iOS light gray
                                    borderColor: '#F2F2F7', // iOS light gray
                                    color: '#000', // iOS black
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    '&:hover': {
                                        backgroundColor: '#E5E5EA', // iOS light gray (darker)
                                        borderColor: '#E5E5EA', // iOS light gray (darker)
                                    }
                                }}
                                endIcon={showCompleted ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            >
                                Completed Exercises ({completedExercises.length})
                            </IOSButton>

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

                    {/* Selection Summary */}
                    {showSelectionMode && selectedExercises.length > 0 && (
                        <Card sx={{
                            mt: 3,
                            p: 2,
                            borderRadius: 12,
                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                        }}>
                            <Typography sx={{ fontWeight: 600, mb: 1 }}>
                                Selected Exercises: {selectedExercises.length}
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
                                                borderRadius: 8,
                                                bgcolor: 'rgba(0, 122, 255, 0.1)', // iOS blue with opacity
                                                color: '#007AFF', // iOS blue
                                                border: 'none',
                                                fontWeight: 500,
                                                '& .MuiChip-deleteIcon': {
                                                    color: '#007AFF' // iOS blue
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Card>
                    )}
                </Box>
            )}
        </Box>
    );
}; 