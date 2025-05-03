import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useRouter } from '@/client/router';
import { getAllSavedWorkouts, deleteSavedWorkout, getSavedWorkoutDetails } from '@/apis/savedWorkouts/client';
import type { SavedWorkout } from '@/apis/savedWorkouts/types';
import { LoadingErrorDisplay } from '@/client/components/LoadingErrorDisplay';

export const SavedWorkouts: React.FC = () => {
    const { navigate } = useRouter();
    const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [workoutToRename, setWorkoutToRename] = useState<SavedWorkout | null>(null);
    const [newWorkoutName, setNewWorkoutName] = useState('');

    // Fetch all saved workouts
    const fetchWorkouts = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getAllSavedWorkouts();

            if (response.data) {
                setWorkouts(response.data);
            } else {
                setError('Failed to load saved workouts');
            }
        } catch (err) {
            console.error('Error fetching saved workouts:', err);
            setError('An error occurred while loading saved workouts');
        } finally {
            setIsLoading(false);
        }
    };

    // Load workouts on component mount
    useEffect(() => {
        fetchWorkouts();
    }, []);

    // Handle workout deletion
    const handleDeleteWorkout = async () => {
        if (!workoutToDelete) return;

        try {
            const response = await deleteSavedWorkout({ workoutId: workoutToDelete });

            if (response.data?.success) {
                // Remove the deleted workout from state
                setWorkouts(workouts.filter(w => w._id.toString() !== workoutToDelete));
            } else {
                setError('Failed to delete workout');
            }
        } catch (err) {
            console.error('Error deleting workout:', err);
            setError('An error occurred while deleting the workout');
        } finally {
            setWorkoutToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    // Handle opening delete confirmation dialog
    const openDeleteDialog = (workoutId: string) => {
        setWorkoutToDelete(workoutId);
        setDeleteDialogOpen(true);
    };

    // Handle opening rename dialog
    const openRenameDialog = (workout: SavedWorkout) => {
        setWorkoutToRename(workout);
        setNewWorkoutName(workout.name);
        setRenameDialogOpen(true);
    };

    // TODO: Add API endpoint for renaming saved workouts
    const handleRenameWorkout = async () => {
        if (!workoutToRename || !newWorkoutName.trim()) return;

        // This is a placeholder - you would need to add a rename endpoint to the API
        setError('Rename functionality not yet implemented');
        setRenameDialogOpen(false);
        setWorkoutToRename(null);
    };

    // Start a saved workout
    const handleStartWorkout = async (workoutId: string) => {
        try {
            // Get workout details including exercise IDs
            const response = await getSavedWorkoutDetails({ workoutId });

            if (response.data && response.data.exercises) {
                const exercises = response.data.exercises;
                const exerciseIds = exercises.map(ex => ex._id.toString());

                // Determine which plan and week to use
                // For now, we'll use the first exercise's plan and week number 1
                // You may want to enhance this to store plan/week with the saved workout
                if (exercises.length > 0) {
                    const planId = exercises[0].trainingPlanId.toString();
                    const weekNumber = 1; // Default to week 1

                    // Navigate to workout page with the exercises
                    navigate(`/workout-page?planId=${planId}&week=${weekNumber}&exercises=${exerciseIds.join(',')}`);
                }
            } else {
                setError('Failed to load workout details');
            }
        } catch (err) {
            console.error('Error starting workout:', err);
            setError('An error occurred while starting the workout');
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Saved Workouts
            </Typography>

            <Button
                variant="outlined"
                onClick={() => navigate('/training-plans')}
                sx={{ mb: 3 }}
            >
                Back to Training Plans
            </Button>

            {error && (
                <LoadingErrorDisplay isLoading={false} error={error} />
            )}

            {workouts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        No saved workouts found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create workouts from the weekly exercise view by selecting exercises and saving them.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/training-plans')}
                        sx={{ mt: 2 }}
                    >
                        View Training Plans
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {workouts.map((workout) => (
                        <Box
                            key={workout._id.toString()}
                            sx={{
                                width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' },
                                minWidth: '280px',
                                flexGrow: 1
                            }}
                        >
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" component="h2" gutterBottom>
                                        {workout.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {workout.description || 'No description'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Created: {new Date(workout.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Exercises: {workout.exerciseIds.length}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleStartWorkout(workout._id.toString())}
                                        title="Start Workout"
                                    >
                                        <PlayArrowIcon />
                                    </IconButton>
                                    <IconButton
                                        color="default"
                                        onClick={() => openRenameDialog(workout)}
                                        title="Rename"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => openDeleteDialog(workout._id.toString())}
                                        title="Delete"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Workout</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this workout? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteWorkout} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
            >
                <DialogTitle>Rename Workout</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Enter a new name for this workout.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Workout Name"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleRenameWorkout}
                        color="primary"
                        disabled={!newWorkoutName.trim() || newWorkoutName === workoutToRename?.name}
                    >
                        Rename
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 