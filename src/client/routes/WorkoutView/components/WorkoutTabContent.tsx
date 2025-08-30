import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    alpha,
    IconButton,
    LinearProgress,
    Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRouter } from '@/client/router';

import { WorkoutTabContentProps, EnhancedWorkout } from './types';
import { WeeklyProgressBase } from '../../../../apis/weeklyProgress/types';
import { WorkoutExercise } from '../../../types/workout';

import { WorkoutExerciseItem } from './WorkoutExerciseItem';
import { WorkoutItemSkeleton } from './WorkoutItemSkeleton';

// --- Color constants ---
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';

interface WorkoutItemProps {
    workout: EnhancedWorkout;
    planId: string;
    weekNumber: number;
    onSavedWorkoutExerciseSetComplete: (workoutId: string, exerciseId: string, updatedProgress: WeeklyProgressBase) => void;
    onToggleExpand: (workoutId: string) => void;
    startActiveWorkout: (exercises: WorkoutExercise[], name?: string) => void;
}

const WorkoutItem: React.FC<WorkoutItemProps> = ({ workout, planId, weekNumber, onSavedWorkoutExerciseSetComplete, onToggleExpand, startActiveWorkout }) => {
    const workoutId = typeof workout._id === 'string' ? workout._id : workout._id.toString();
    const exercises = workout.enhancedExercises || [];
    const totalSetsInWorkout = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const completedSetsInWorkout = exercises.reduce((sum, ex) => sum + (ex.progress?.setsCompleted || 0), 0);
    const progressPercent = totalSetsInWorkout > 0 ? (completedSetsInWorkout / totalSetsInWorkout) * 100 : 0;

    const getStatusText = () => {
        if (exercises.length === 0 && !workout.error) return "No exercises";
        if (totalSetsInWorkout === 0) return "No sets defined";
        return `${completedSetsInWorkout} / ${totalSetsInWorkout} sets completed`;
    };

    const theme = useTheme();

    return (
        <Paper
            elevation={2}
            sx={{
                mb: 2,
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.text.primary, 0.08)}`,
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: `0 6px 14px ${alpha(theme.palette.text.primary, 0.15)}` }
            }}
        >
            <Box onClick={() => onToggleExpand(workoutId)} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <Box flexGrow={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: alpha(theme.palette.text.primary, 0.85) }}>
                        {workout.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.6), fontSize: '0.8rem' }}>
                            {getStatusText()}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (workout.enhancedExercises && workout.enhancedExercises.length > 0) {
                            startActiveWorkout(workout.enhancedExercises, workout.name);
                        } else {
                            console.warn('Cannot start workout: no exercises found or workout has an error.');
                        }
                    }}
                    sx={{
                        bgcolor: NEON_GREEN,
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        px: 2,
                        ml: 1,
                        '&:hover': { bgcolor: alpha(NEON_GREEN, 0.85) }
                    }}
                    disabled={!!workout.error || !workout.enhancedExercises || workout.enhancedExercises.length === 0}
                >
                    Start
                </Button>
                <IconButton size="small" sx={{ color: alpha(theme.palette.text.primary, 0.6) }} onClick={(e) => { e.stopPropagation(); onToggleExpand(workoutId); }}>
                    {workout.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                    height: 4,
                    bgcolor: alpha(NEON_BLUE, 0.15),
                    '& .MuiLinearProgress-bar': { bgcolor: progressPercent >= 100 ? NEON_GREEN : NEON_BLUE }
                }}
            />
            {workout.isExpanded && (
                <Box sx={{ p: 2, pt: 1, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` }}>
                    {workout.error ? (
                        <Alert severity="error" sx={{ py: 0, bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, '& .MuiAlert-icon': { color: theme.palette.error.main } }}>
                            {workout.error}
                        </Alert>
                    ) : exercises.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.6) }}>No exercises in this workout</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ pt: 1 }}>
                            {exercises.map((exercise) => (
                                <WorkoutExerciseItem
                                    key={exercise._id.toString()}
                                    exercise={exercise}
                                    planId={planId}
                                    weekNumber={weekNumber}
                                    onSetComplete={(exerciseIdFromItem, updatedProgress) =>
                                        onSavedWorkoutExerciseSetComplete(workoutId, exerciseIdFromItem, updatedProgress)
                                    }
                                    selectedExercises={[]}
                                    showSelectionMode={false}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export const WorkoutTabContent: React.FC<WorkoutTabContentProps> = ({
    planId,
    weekNumber,
    savedWorkouts,
    isWorkoutsLoading,
    toggleWorkoutExpanded,
    handleSavedWorkoutExerciseSetCompletionUpdate,
    startActiveWorkout
}) => {
    const { navigate } = useRouter();

    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => navigate(`/training-plans/${planId}/workouts`)}
                    startIcon={<SettingsIcon />}
                    disabled={!planId}
                    sx={{
                        bgcolor: NEON_BLUE,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': {
                            bgcolor: alpha(NEON_BLUE, 0.9)
                        }
                    }}
                >
                    Manage Workouts
                </Button>
            </Box>

            {/* Workouts list */}
            {isWorkoutsLoading ? (
                <Box sx={{ mt: 0, mb: 2 }}>
                    <WorkoutItemSkeleton />
                    <WorkoutItemSkeleton />
                    <WorkoutItemSkeleton />
                </Box>
            ) : savedWorkouts.length === 0 ? (
                <Paper
                    elevation={2}
                    sx={{
                        textAlign: 'center',
                        mt: 6,
                        p: 4,
                        borderRadius: 3,
                        bgcolor: 'transparent',
                        border: `1px dashed ${alpha('#000000', 0.2)}`
                    }}
                >
                    <Typography variant="h6" color={alpha('#000000', 0.5)}>
                        No saved workouts found
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{
                            mt: 2,
                            bgcolor: NEON_BLUE,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderRadius: 8,
                            px: 3,
                            '&:hover': {
                                bgcolor: alpha(NEON_BLUE, 0.9)
                            }
                        }}
                    // onClick={() => navigate('/create-workout')} // Or handle via callback
                    >
                        Create Your First Workout
                    </Button>
                </Paper>
            ) : (
                <Box>
                    {savedWorkouts.map((workout) => (
                        <WorkoutItem
                            key={typeof workout._id === 'string' ? workout._id : workout._id.toString()}
                            workout={workout}
                            planId={planId}
                            weekNumber={weekNumber}
                            onSavedWorkoutExerciseSetComplete={handleSavedWorkoutExerciseSetCompletionUpdate}
                            onToggleExpand={toggleWorkoutExpanded}
                            startActiveWorkout={startActiveWorkout}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}; 