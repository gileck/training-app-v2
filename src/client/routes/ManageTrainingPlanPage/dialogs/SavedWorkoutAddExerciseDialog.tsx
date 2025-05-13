import React from 'react';
import {
    Dialog,
    DialogContent,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Box,
    Avatar,
    useTheme,
    alpha,
    Checkbox,
    Button,
    DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import type { ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { ClientWorkoutDisplay } from '../types';

// Exercise with definition for display
interface ExerciseWithDefinition {
    exerciseId: string;
    definitionId: string;
    definition: ApiExerciseDefinition;
}

interface SavedWorkoutAddExerciseDialogProps {
    open: boolean;
    onClose: () => void;
    workoutToAddExerciseTo: ClientWorkoutDisplay | null;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    isLoadingDialogExercises: boolean;
    dialogPlanContextError: string | null;
    planExercises: ExerciseWithDefinition[];

    // New props for multi-select
    selectedExerciseIds: Set<string>;
    onToggleExerciseSelection: (exerciseId: string) => void;
    onConfirmAddMultipleExercises: () => void;
    isAddingMultipleExercises: boolean;
}

export const SavedWorkoutAddExerciseDialog: React.FC<SavedWorkoutAddExerciseDialogProps> = ({
    open,
    onClose,
    workoutToAddExerciseTo,
    searchTerm,
    onSearchTermChange,
    isLoadingDialogExercises,
    dialogPlanContextError,
    planExercises,
    selectedExerciseIds,
    onToggleExerciseSelection,
    onConfirmAddMultipleExercises,
    isAddingMultipleExercises,
}) => {
    const theme = useTheme();
    
    // Filter exercises based on the search term
    const filteredExercises = React.useMemo(() => {
        if (!searchTerm.trim()) {
            return planExercises;
        }
        return planExercises.filter(exercise => 
            exercise.definition.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [planExercises, searchTerm]);
    
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' } }}>
            <AppBar sx={{ position: 'relative', bgcolor: alpha(theme.palette.success.light, 0.1), boxShadow: 'none' }}>
                <Toolbar>
                    <Typography sx={{ ml: 2, flex: 1, color: theme.palette.success.dark, fontWeight: 'bold' }} variant="h6" component="div">Add Exercise to {workoutToAddExerciseTo?.name || 'Workout'}</Typography>
                    <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ color: theme.palette.success.dark }}><CloseIcon /></IconButton>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Search exercises..." 
                    value={searchTerm} 
                    onChange={(e) => onSearchTermChange(e.target.value)} 
                    sx={{ mb: 2 }} 
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: alpha(theme.palette.success.dark, 0.8) }} /></InputAdornment>),
                    }}
                />
                {isLoadingDialogExercises ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress sx={{ color: theme.palette.success.main }} /></Box>
                ) : dialogPlanContextError ? (
                    <Typography sx={{ textAlign: 'center', mt: 2, color: alpha(theme.palette.error.main, 0.9) }}>{dialogPlanContextError}</Typography>
                ) : filteredExercises.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#000000', 0.7) }}>No exercises found or all exercises from the plan are already in this workout.</Typography>
                ) : (
                    <List dense sx={{ overflowY: 'auto', flexGrow: 1, pr: 1 }}>
                        {filteredExercises.map((exercise) => {
                            const isSelected = selectedExerciseIds.has(exercise.exerciseId);
                            const isAlreadyInWorkout = Boolean(workoutToAddExerciseTo && workoutToAddExerciseTo.exercises?.some(ex => ex._id.toString() === exercise.exerciseId));
                            const isDisabled = isAddingMultipleExercises || isAlreadyInWorkout;

                            return (
                                <ListItemButton 
                                    key={exercise.exerciseId} 
                                    disabled={isDisabled}
                                    selected={isSelected}
                                    sx={{
                                        mb: 0.5, 
                                        borderRadius: '8px',
                                        opacity: isAlreadyInWorkout ? 0.6 : 1,
                                        bgcolor: isSelected ? alpha(theme.palette.success.light, 0.2) : undefined,
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={isSelected || isAlreadyInWorkout}
                                            disabled={isDisabled}
                                            onChange={() => {
                                                if (!isAlreadyInWorkout) {
                                                    onToggleExerciseSelection(exercise.exerciseId);
                                                }
                                            }}
                                            inputProps={{ 'aria-labelledby': `checkbox-list-label-${exercise.exerciseId}` }}
                                            color="success"
                                        />
                                    </ListItemIcon>
                                    <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                        {exercise.definition.imageUrl ? 
                                            <Avatar src={exercise.definition.imageUrl} variant="rounded" sx={{ width: 36, height: 36 }}><BrokenImageIcon /></Avatar> : 
                                            <Avatar variant="rounded" sx={{ width: 36, height: 36 }}><FitnessCenterIcon /></Avatar>}
                                    </ListItemIcon>
                                    <ListItemText 
                                        id={`checkbox-list-label-${exercise.exerciseId}`}
                                        primary={exercise.definition.name} 
                                        primaryTypographyProps={{ fontWeight: 500, color: isAlreadyInWorkout ? theme.palette.text.disabled : theme.palette.text.primary }}
                                        secondary={isAlreadyInWorkout ? "Already in workout" : null}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    onClick={onConfirmAddMultipleExercises} 
                    variant="contained" 
                    color="success"
                    disabled={isAddingMultipleExercises || selectedExerciseIds.size === 0 || isLoadingDialogExercises}
                    startIcon={isAddingMultipleExercises ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    Add Selected ({selectedExerciseIds.size})
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 