import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    Card,
    Avatar,
    CircularProgress,
    Paper,
    Divider,
    Stack,
    useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { ClientWorkoutDisplay } from '../types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import { GENERIC_IMAGE_PLACEHOLDER } from '../utils/constants';

interface WorkoutItemProps {
    workout: ClientWorkoutDisplay;
    expandedWorkoutId: string | null;
    isRenamingWorkoutId: string | null;
    isRemovingExercise: string | null;
    exerciseDefinitionMap: Map<string, ExerciseDefinition>;
    onToggleExpand: (workoutId: string) => void;
    onOpenRenameDialog: (workout: ClientWorkoutDisplay) => void;
    onOpenDeleteDialog: (workoutId: string) => void;
    onOpenAddExerciseDialog: (workout: ClientWorkoutDisplay) => void;
    onRemoveExercise: (workoutId: string, exerciseId: string) => void;
}

export const WorkoutItem: React.FC<WorkoutItemProps> = ({
    workout,
    isRenamingWorkoutId,
    isRemovingExercise,
    exerciseDefinitionMap,
    onOpenRenameDialog,
    onOpenDeleteDialog,
    onOpenAddExerciseDialog,
    onRemoveExercise
}) => {
    const theme = useTheme();
    const totalSets = workout.exercises ? workout.exercises.reduce((total: number, exercise: ExerciseBase) => total + (exercise.sets || 0), 0) : 0;

    return (
        <Paper elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
            <Card sx={{ width: '100%' }}>
                <Box sx={{ backgroundColor: theme.palette.primary.main }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                    }}>
                        <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: theme.palette.primary.contrastText }}>
                            {workout.name}
                        </Typography>
                        <Box>
                            <IconButton
                                size="small"
                                onClick={() => onOpenRenameDialog(workout)}
                                disabled={!!isRenamingWorkoutId}
                                sx={{ color: '#ffffff', '&:hover': { color: '#f0f0f0' } }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => onOpenDeleteDialog(workout._id)}
                                disabled={!!isRemovingExercise}
                                sx={{ color: '#ff8a80', '&:hover': { color: '#ff5252' } }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 2 }}>
                    <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                            <FitnessCenterIcon fontSize="small" />
                            <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>Exercises:</Typography>
                            <Typography variant="body2" component="span">{workout.exercises ? workout.exercises.length : 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                            <TimerIcon fontSize="small" />
                            <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>Total Sets:</Typography>
                            <Typography variant="body2" component="span">{totalSets}</Typography>
                        </Box>
                    </Stack>
                </Box>

                <Divider />

                <Box sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
                    {workout.exercises?.length ? (
                        <>
                            {workout.exercises.map((exercise: ExerciseBase, index: number) => {
                                const defId = exercise.exerciseDefinitionId.toString();
                                const definition = exerciseDefinitionMap.get(defId);
                                return (
                                    <Box key={exercise._id.toString()} sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: index < workout.exercises.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                                        py: 1.5
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                alt={definition?.name || 'Exercise'}
                                                src={definition?.imageUrl || GENERIC_IMAGE_PLACEHOLDER}
                                                sx={{ width: 40, height: 40, mr: 1.5 }}
                                                variant="rounded"
                                            />
                                            <Box>
                                                <Typography variant="body1" fontWeight={500}>{definition?.name || 'Unknown Exercise'}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {exercise.sets} sets • {exercise.reps} reps {exercise.weight ? `• ${exercise.weight} kg` : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveExercise(workout._id, exercise._id.toString())}
                                            disabled={isRemovingExercise === `${workout._id}_${exercise._id}`}
                                            sx={{ color: '#f44336', '&:hover': { color: '#d32f2f' } }}
                                        >
                                            {isRemovingExercise === `${workout._id}_${exercise._id}` ? (
                                                <CircularProgress size={16} />
                                            ) : (
                                                <RemoveCircleOutlineIcon />
                                            )}
                                        </IconButton>
                                    </Box>
                                );
                            })}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => onOpenAddExerciseDialog(workout)}
                                    startIcon={<AddIcon />}
                                    disabled={!!isRemovingExercise}
                                >
                                    Add Exercises
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                No exercises added to this workout yet.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => onOpenAddExerciseDialog(workout)}
                                startIcon={<AddIcon />}
                                disabled={!!isRemovingExercise}
                            >
                                Add Exercises
                            </Button>
                        </Box>
                    )}
                </Box>
            </Card>
        </Paper>
    );
}; 