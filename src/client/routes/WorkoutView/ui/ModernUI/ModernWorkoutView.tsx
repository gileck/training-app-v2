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
    useTheme,
    LinearProgress,
    Card,
    Avatar,
    Fab,
    Divider,
    Fade,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress color="secondary" />
        </Box>
    );
    if (error) return (
        <Alert
            severity="error"
            sx={{
                my: 2,
                borderRadius: 3,
                boxShadow: 2
            }}
        >
            {error}
        </Alert>
    );
    return null;
};

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate }) => {
    const theme = useTheme();
    return (
        <Card sx={{
            mb: 3,
            p: 1.5,
            borderRadius: 3,
            boxShadow: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
            color: 'white'
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <IconButton
                    onClick={() => onNavigate(currentWeek - 1)}
                    disabled={currentWeek <= 1}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 'bold',
                        textShadow: '0px 2px 3px rgba(0,0,0,0.2)',
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                >
                    WEEK {currentWeek} / {maxWeeks}
                </Typography>
                <IconButton
                    onClick={() => onNavigate(currentWeek + 1)}
                    disabled={currentWeek >= maxWeeks}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                    <ArrowForwardIcon />
                </IconButton>
            </Stack>
        </Card>
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
    const theme = useTheme();

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
            <Card
                elevation={3}
                sx={{
                    mb: 2.5,
                    overflow: 'hidden',
                    opacity: isExerciseComplete ? 0.8 : 1,
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 6
                    },
                    position: 'relative',
                    border: isExerciseComplete ? `1px solid ${theme.palette.success.light}` : 'none'
                }}
            >
                {/* Exercise Header */}
                <Box sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isExerciseComplete ? 'success.light' : 'primary.main',
                    color: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {exercise.name || `Exercise: ${exercise._id}`}
                        </Typography>
                        {isExerciseComplete && (
                            <CheckCircleIcon fontSize="small" />
                        )}
                    </Box>
                    {showSelectionMode && (
                        <Checkbox
                            checked={selectedExercises.includes(exerciseId)}
                            onChange={() => handleExerciseSelect(exerciseId)}
                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                        />
                    )}
                </Box>

                {/* Progress indicator */}
                <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    color={isExerciseComplete ? "success" : "primary"}
                    sx={{ height: 4 }}
                />

                {/* Content */}
                <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                    {/* Left: Image */}
                    <Avatar
                        variant="rounded"
                        sx={{
                            width: 70,
                            height: 70,
                            bgcolor: 'grey.200',
                            borderRadius: 2
                        }}
                    >
                        {exercise.definition?.imageUrl ? (
                            <Image
                                src={exercise.definition.imageUrl}
                                alt={exercise.name || 'Exercise'}
                                width={70}
                                height={70}
                                style={{ objectFit: 'contain' }}
                            />
                        ) : (
                            <FitnessCenterIcon sx={{ fontSize: 30, color: 'grey.500' }} />
                        )}
                    </Avatar>

                    {/* Right: Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {exercise.reps} reps
                            {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` • ${exercise.weight}kg`}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography sx={{ fontWeight: 'medium' }}>
                                Sets: {setsDone}/{totalSets}
                            </Typography>
                            {exercise.definition?.hasComments && (
                                <Chip
                                    label="Comments"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: 'secondary.light',
                                        color: 'white'
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
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                            )}
                            {exercise.definition?.secondaryMuscles?.map((muscle, index) => (
                                <Chip
                                    key={index}
                                    label={muscle}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Action buttons */}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <IconButton
                        onClick={handleOpenDetailModal}
                        size="small"
                        color="primary"
                    >
                        <InfoIcon fontSize="small" />
                    </IconButton>

                    <Stack direction="row" spacing={1.5}>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                            size="small"
                            color="default"
                            disabled={isUpdating || setsDone <= 0}
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets)}
                            size="small"
                            color="primary"
                            disabled={isUpdating || setsDone >= totalSets}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleCompleteAllSets(exerciseId, setsDone, totalSets)}
                            size="small"
                            color="success"
                            disabled={isUpdating || setsDone >= totalSets}
                        >
                            <DoneAllIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Card>

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
export const ModernWorkoutView: React.FC<WorkoutViewProps> = ({
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
    const theme = useTheme();

    if (isLoading) {
        return <LoadingErrorDisplay isLoading={true} error={null} />;
    }

    if (!planId) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 'bold' }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{ borderRadius: 8 }}
                >
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{ borderRadius: 8, mt: 2 }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    if (!planDetails) {
        return <Typography sx={{ p: 2 }}>Plan details could not be loaded.</Typography>;
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: 10 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontSize: { xs: '1.75rem', md: '2.25rem' },
                        fontWeight: 'bold',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitBackgroundClip: 'text',
                        letterSpacing: '0.5px',
                        mb: 0.5
                    }}
                >
                    {planDetails.name}
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{
                        fontWeight: 'medium',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
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

            {/* Weekly Progress Card */}
            <Card
                elevation={3}
                sx={{
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: 2
                }}
            >
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Weekly Progress
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 'bold',
                                color: progressPercentage >= 100 ? 'success.main' : 'text.primary'
                            }}
                        >
                            {progressPercentage.toFixed(0)}%
                        </Typography>
                    </Box>

                    <Box sx={{ position: 'relative', height: 8, mb: 1.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            color="secondary"
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                }
                            }}
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" align="center">
                        {completedExercisesCount} of {totalExercises} exercises completed
                    </Typography>
                </Box>
            </Card>

            {/* Exercises section */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        fontWeight: 'bold',
                        position: 'relative',
                        '&:after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -5,
                            left: 0,
                            width: 40,
                            height: 3,
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 1
                        }
                    }}
                >
                    Exercises
                </Typography>

                {/* Actions */}
                {!showSelectionMode ? (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleStartSelectionMode}
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 8,
                            px: 2,
                            boxShadow: 2,
                            background: 'linear-gradient(45deg, #3f51b5, #2196f3)'
                        }}
                    >
                        Create Workout
                    </Button>
                ) : (
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={handleStartWorkout}
                            disabled={selectedExercises.length === 0}
                            startIcon={<PlayArrowIcon />}
                            sx={{
                                borderRadius: 8,
                                px: 2,
                                boxShadow: 2,
                                background: 'linear-gradient(45deg, #7cb342, #4caf50)'
                            }}
                        >
                            Start ({selectedExercises.length})
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelSelectionMode}
                            sx={{ borderRadius: 8 }}
                        >
                            Cancel
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <Box sx={{
                    textAlign: 'center',
                    mt: 6,
                    mb: 6,
                    p: 4,
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: 'divider'
                }}>
                    <FitnessCenterIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No exercises found for this plan
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box sx={{ mb: 4 }}>
                        {activeExercises.length > 0 && (
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 'medium',
                                    color: theme.palette.primary.main,
                                    display: activeExercises.length === 0 ? 'none' : 'block'
                                }}
                            >
                                Active Exercises
                            </Typography>
                        )}
                        {activeExercises.map((exercise) => (
                            <Fade in={true} key={exercise._id.toString()} timeout={500}>
                                <Box>
                                    <WorkoutExerciseItem
                                        exercise={exercise}
                                        planId={planId}
                                        weekNumber={weekNumber}
                                        onSetComplete={handleSetCompletionUpdate}
                                        showSelectionMode={showSelectionMode}
                                        selectedExercises={selectedExercises}
                                        handleExerciseSelect={handleExerciseSelect}
                                    />
                                </Box>
                            </Fade>
                        ))}
                    </Box>

                    {/* Completed Exercises */}
                    {completedExercises.length > 0 && (
                        <Box sx={{ mt: 2 }}>
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
                                    display: 'flex',
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                    '&:hover': {
                                        bgcolor: 'background.paper',
                                        borderColor: theme.palette.primary.main,
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
                                    <Fade in={showCompleted} key={exercise._id.toString()} timeout={500}>
                                        <Box>
                                            <WorkoutExerciseItem
                                                exercise={exercise}
                                                planId={planId}
                                                weekNumber={weekNumber}
                                                onSetComplete={handleSetCompletionUpdate}
                                                showSelectionMode={showSelectionMode}
                                                selectedExercises={selectedExercises}
                                                handleExerciseSelect={handleExerciseSelect}
                                            />
                                        </Box>
                                    </Fade>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            {/* Selected exercises summary */}
            {showSelectionMode && selectedExercises.length > 0 && (
                <Fade in={true}>
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
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Selected: {selectedExercises.length}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                            {selectedExercises.map((exerciseId) => {
                                const exercise = [...activeExercises, ...completedExercises].find(e =>
                                    e._id.toString() === exerciseId
                                );
                                return (
                                    <Chip
                                        key={exerciseId}
                                        label={exercise?.name || exerciseId}
                                        onDelete={() => handleExerciseSelect(exerciseId)}
                                        color="primary"
                                        size="small"
                                        sx={{ borderRadius: 4 }}
                                    />
                                );
                            })}
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleStartWorkout}
                            startIcon={<PlayArrowIcon />}
                            sx={{
                                borderRadius: 8,
                                py: 1,
                                alignSelf: 'center',
                                width: '100%',
                                boxShadow: 3,
                                background: 'linear-gradient(45deg, #7cb342, #4caf50)'
                            }}
                        >
                            Start Workout
                        </Button>
                    </Paper>
                </Fade>
            )}

            {/* Add FAB for quick action */}
            {!showSelectionMode && activeExercises.length > 0 && (
                <Fab
                    color="secondary"
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        boxShadow: 3
                    }}
                    onClick={handleStartSelectionMode}
                >
                    <PlayArrowIcon />
                </Fab>
            )}
        </Box>
    );
}; 