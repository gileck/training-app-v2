import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

const NEON_PURPLE = '#9C27B0';

export const SavedWorkouts: React.FC = () => {
    const [workouts, setWorkouts] = useState([
        { id: 1, name: 'Push Day', description: 'Chest, shoulders, triceps', exercises: ['Push-ups', 'Bench Press'] },
        { id: 2, name: 'Pull Day', description: 'Back, biceps', exercises: ['Pull-ups', 'Rows'] }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<{ id: number; name: string; description: string; exercises: string[] } | null>(null);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [newWorkoutDescription, setNewWorkoutDescription] = useState('');

    const filteredWorkouts = workouts.filter(workout =>
        workout.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateWorkout = () => {
        const newWorkout = {
            id: Date.now(),
            name: newWorkoutName,
            description: newWorkoutDescription,
            exercises: []
        };
        setWorkouts([...workouts, newWorkout]);
        setNewWorkoutName('');
        setNewWorkoutDescription('');
        setIsCreateDialogOpen(false);
    };

    const handleEditWorkout = () => {
        if (!selectedWorkout) return;
        setWorkouts(workouts.map(w =>
            w.id === selectedWorkout.id
                ? { ...w, name: newWorkoutName }
                : w
        ));
        setIsEditDialogOpen(false);
    };

    const handleDeleteWorkout = () => {
        if (!selectedWorkout) return;
        setWorkouts(workouts.filter(w => w.id !== selectedWorkout.id));
        setIsDeleteDialogOpen(false);
    };

    const handleDuplicateWorkout = (workout: { id: number; name: string; description: string; exercises: string[] }) => {
        const duplicated = {
            ...workout,
            id: Date.now(),
            name: `${workout.name} (Copy)`
        };
        setWorkouts([...workouts, duplicated]);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: NEON_PURPLE }}>
                    Saved Workouts
                </Typography>
                <Button
                    data-testid="create-workout-button"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateDialogOpen(true)}
                    sx={{ bgcolor: NEON_PURPLE }}
                >
                    Create Workout
                </Button>
            </Box>

            <TextField
                fullWidth
                placeholder="Search workouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'workout-search-input' }}
            />

            {filteredWorkouts.length === 0 ? (
                <Box data-testid="empty-workouts-state" sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>No workouts found</Typography>
                    <Button
                        data-testid="create-first-workout-button"
                        variant="outlined"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        Create Your First Workout
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                    {filteredWorkouts.map((workout) => (
                        <Paper key={workout.id} data-testid="workout-card" elevation={2} sx={{ p: 2 }}>
                            <Typography data-testid="workout-name" variant="h6" sx={{ mb: 1 }}>
                                {workout.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                {workout.description}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <IconButton
                                    data-testid="start-workout-button"
                                    size="small"
                                    title="Start Workout"
                                >
                                    <PlayArrowIcon />
                                </IconButton>
                                <IconButton
                                    data-testid="view-workout-details-button"
                                    size="small"
                                    title="View Details"
                                    onClick={() => {
                                        setSelectedWorkout(workout);
                                        setIsDetailsOpen(true);
                                    }}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                    data-testid="edit-workout-name-button"
                                    size="small"
                                    title="Edit Name"
                                    onClick={() => {
                                        setSelectedWorkout(workout);
                                        setNewWorkoutName(workout.name);
                                        setIsEditDialogOpen(true);
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    data-testid="duplicate-workout-button"
                                    size="small"
                                    title="Duplicate"
                                    onClick={() => handleDuplicateWorkout(workout)}
                                >
                                    <FileCopyIcon />
                                </IconButton>
                                <IconButton
                                    data-testid="delete-workout-button"
                                    size="small"
                                    title="Delete"
                                    onClick={() => {
                                        setSelectedWorkout(workout);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            {/* Create Workout Dialog */}
            <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
                <DialogTitle>Create New Workout</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Workout Name"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                        inputProps={{ 'data-testid': 'workout-name-input' }}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={newWorkoutDescription}
                        onChange={(e) => setNewWorkoutDescription(e.target.value)}
                        multiline
                        rows={3}
                        inputProps={{ 'data-testid': 'workout-description-input' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        data-testid="save-workout-button"
                        variant="contained"
                        onClick={handleCreateWorkout}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Workout Name Dialog */}
            <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
                <DialogTitle>Edit Workout Name</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Workout Name"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                        sx={{ mt: 1 }}
                        inputProps={{ 'data-testid': 'workout-name-input' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        data-testid="save-workout-name-button"
                        variant="contained"
                        onClick={handleEditWorkout}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this workout?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        data-testid="confirm-delete-button"
                        variant="contained"
                        color="error"
                        onClick={handleDeleteWorkout}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Workout Details Dialog */}
            <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle data-testid="workout-details-header">
                    Workout Details - {selectedWorkout?.name}
                </DialogTitle>
                <DialogContent>
                    <Box data-testid="workout-exercises-list">
                        <Typography variant="h6" sx={{ mb: 2 }}>Exercises</Typography>
                        {selectedWorkout?.exercises.map((exercise: string, index: number) => (
                            <Paper key={index} data-testid="workout-exercise-card" sx={{ p: 2, mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>{exercise}</Typography>
                                    <IconButton
                                        data-testid="remove-exercise-from-workout-button"
                                        size="small"
                                        title="Remove Exercise"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Paper>
                        ))}
                        <Button
                            data-testid="add-exercise-to-workout-button"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => setIsAddExerciseOpen(true)}
                            sx={{ mt: 2 }}
                        >
                            Add Exercise
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add Exercise Dialog */}
            <Dialog open={isAddExerciseOpen} onClose={() => setIsAddExerciseOpen(false)}>
                <DialogTitle>Add Exercise</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Exercise</InputLabel>
                        <Select data-testid="exercise-select" label="Exercise">
                            <MenuItem value="Push-ups">Push-ups</MenuItem>
                            <MenuItem value="Squats">Squats</MenuItem>
                            <MenuItem value="Pull-ups">Pull-ups</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddExerciseOpen(false)}>Cancel</Button>
                    <Button
                        data-testid="confirm-add-exercise-button"
                        variant="contained"
                        onClick={() => setIsAddExerciseOpen(false)}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 