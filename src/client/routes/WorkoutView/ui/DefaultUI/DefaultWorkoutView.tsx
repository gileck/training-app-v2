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
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Image from 'next/image';

import { WorkoutViewProps, WorkoutExerciseItemProps, WeekNavigatorProps, LoadingErrorDisplayProps } from '../types';
import { ExerciseDetailModal } from '@/client/components/ExerciseDetailModal';
import { useExerciseSetCompletion } from '../../hooks/useExerciseSetCompletion';

// --- Sub Components --- //

const LoadingErrorDisplay = ({ isLoading, error }: LoadingErrorDisplayProps) => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    return null;
};

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate }) => {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={() => onNavigate(currentWeek - 1)} disabled={currentWeek <= 1}>
                <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">
                Week {currentWeek} / {maxWeeks}
            </Typography>
            <IconButton onClick={() => onNavigate(currentWeek + 1)} disabled={currentWeek >= maxWeeks}>
                <ArrowForwardIcon />
            </IconButton>
        </Stack>
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
            <Paper elevation={2} sx={{ p: 2, mb: 2, opacity: isExerciseComplete ? 0.7 : 1, position: 'relative' }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Left side: Exercise image */}
                    <Box sx={{
                        width: { xs: '100%', sm: 100 },
                        height: { xs: 120, sm: 100 },
                        position: 'relative',
                        flexShrink: 0,
                        mb: { xs: 1, sm: 0 }
                    }}>
                        {exercise.definition?.imageUrl ? (
                            <Image
                                src={exercise.definition.imageUrl}
                                alt={exercise.name || 'Exercise'}
                                fill
                                style={{ objectFit: 'contain', borderRadius: '8px' }}
                            />
                        ) : (
                            <Box sx={{
                                width: '100%',
                                height: '100%',
                                bgcolor: 'grey.200',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography variant="caption" color="text.secondary">No image</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Right side: Exercise details */}
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="h6"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                >
                                    {exercise.name || `Exercise: ${exercise._id}`}
                                </Typography>
                                {isExerciseComplete && (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                )}
                                {exercise.definition?.hasComments && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            px: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        Comments
                                    </Typography>
                                )}
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    onClick={() => handleSetCheckboxClick(exerciseId, setsDone, setsDone, totalSets)}
                                    color="success"
                                    size="small"
                                    disabled={isUpdating || setsDone >= totalSets}
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleSetCheckboxClick(exerciseId, setsDone - 2, setsDone, totalSets)}
                                    color="default"
                                    size="small"
                                    disabled={isUpdating || setsDone <= 0}
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleCompleteAllSets(exerciseId, setsDone, totalSets)}
                                    color="success"
                                    size="small"
                                    disabled={isUpdating || setsDone >= totalSets}
                                    title="Complete all sets"
                                    sx={{ padding: { xs: '4px', sm: '8px' } }}
                                >
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                            Sets: {setsDone} / {totalSets}
                        </Typography>

                        <Typography variant="body2" mt={0.5} sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                            {exercise.reps} reps
                            {exercise.definition?.bodyWeight ? ' (body weight)' : ''}
                            {exercise.weight !== undefined && !exercise.definition?.bodyWeight && ` ${exercise.weight}kg`}
                        </Typography>

                        {/* Muscle group tags */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {exercise.definition?.primaryMuscle && (
                                <Chip
                                    label={exercise.definition.primaryMuscle}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                        bgcolor: 'grey.300',
                                        '&:hover': { bgcolor: 'grey.400' },
                                        fontSize: '0.7rem',
                                        height: 24
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
                                        borderColor: 'grey.400',
                                        fontSize: '0.7rem',
                                        height: 24
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Info button */}
                <IconButton
                    color="primary"
                    onClick={handleOpenDetailModal}
                    size="small"
                    title="View exercise details"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'grey.100' }
                    }}
                >
                    <InfoIcon fontSize="small" />
                </IconButton>

                {showSelectionMode && (
                    <Checkbox
                        checked={selectedExercises.includes(exerciseId)}
                        onChange={() => handleExerciseSelect(exerciseId)}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                )}
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
export const DefaultWorkoutView: React.FC<WorkoutViewProps> = ({
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
                <Typography variant="h5" color="error" sx={{ mb: 2 }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />}>
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />}>
                    Back to Plans
                </Button>
            </Box>
        );
    }

    if (!planDetails) {
        return <Typography sx={{ p: 2 }}>Plan details could not be loaded.</Typography>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                align="center"
                sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
            >
                {planDetails.name}
            </Typography>

            <WeekNavigator
                currentWeek={weekNumber}
                maxWeeks={planDetails.durationWeeks}
                onNavigate={handleNavigateWeek}
            />

            {/* Weekly Progress Bar */}
            <Box sx={{ mb: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                        Weekly Progress: {completedExercisesCount}/{totalExercises} exercises
                    </Typography>
                    <Typography variant="body2">
                        {progressPercentage.toFixed(0)}%
                    </Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.300',
                            borderRadius: 4,
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${progressPercentage}%`,
                            height: 8,
                            bgcolor: 'success.main',
                            borderRadius: 4,
                            transition: 'width 0.3s ease-in-out',
                        }}
                    />
                </Box>
            </Box>

            {/* Workout actions */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Exercises
                </Typography>

                {!showSelectionMode ? (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleStartSelectionMode}
                        startIcon={<AddIcon />}
                    >
                        Create Workout
                    </Button>
                ) : (
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={handleStartWorkout}
                            disabled={selectedExercises.length === 0}
                        >
                            Start Workout ({selectedExercises.length})
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelSelectionMode}
                        >
                            Cancel
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Exercises list */}
            {activeExercises.length === 0 && completedExercises.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                    No exercises found for this plan.
                </Typography>
            ) : (
                <Box>
                    {/* Active Exercises */}
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                mt: 2,
                                mb: 1,
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                display: activeExercises.length === 0 ? 'none' : 'block'
                            }}
                        >
                            Active Exercises
                        </Typography>
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
                                    py: 1,
                                    mb: 1,
                                    display: 'flex',
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
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

            {/* Selected exercises summary */}
            {showSelectionMode && selectedExercises.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
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
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                />
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
}; 