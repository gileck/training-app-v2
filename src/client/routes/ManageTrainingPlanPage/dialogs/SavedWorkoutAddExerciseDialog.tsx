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
    filteredDefinitionsForDialog: ApiExerciseDefinition[];
    planExercises: ExerciseWithDefinition[]; // New prop for exercises with their definitions
    onConfirmAddExercise: (exerciseId: string) => void;
    isAddingSingleExercise: boolean;
}

export const SavedWorkoutAddExerciseDialog: React.FC<SavedWorkoutAddExerciseDialogProps> = ({
    open,
    onClose,
    workoutToAddExerciseTo,
    searchTerm,
    onSearchTermChange,
    isLoadingDialogExercises,
    dialogPlanContextError,
    filteredDefinitionsForDialog,
    planExercises,
    onConfirmAddExercise,
    isAddingSingleExercise,
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { height: '80vh', borderRadius: '12px' } }}>
            <AppBar sx={{ position: 'relative', bgcolor: alpha(theme.palette.success.light, 0.1), boxShadow: 'none' }}>
                <Toolbar>
                    <Typography sx={{ ml: 2, flex: 1, color: theme.palette.success.dark, fontWeight: 'bold' }} variant="h6" component="div">Add Exercise to {workoutToAddExerciseTo?.name || 'Workout'}</Typography>
                    <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ color: theme.palette.success.dark }}><CloseIcon /></IconButton>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
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
                    <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#000000', 0.7) }}>No exercises found.</Typography>
                ) : (
                    <List dense sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        {filteredExercises.map((exercise) => (
                            <ListItemButton 
                                key={exercise.exerciseId} 
                                onClick={() => onConfirmAddExercise(exercise.exerciseId)} 
                                disabled={isAddingSingleExercise || Boolean(workoutToAddExerciseTo && workoutToAddExerciseTo.exercises?.some(ex => ex._id.toString() === exercise.exerciseId))} 
                                sx={{ mb: 0.5, borderRadius: '8px' }}
                            >
                                {isAddingSingleExercise && <CircularProgress size={20} sx={{ mr: 1 }} />}
                                <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                    {exercise.definition.imageUrl ? 
                                        <Avatar src={exercise.definition.imageUrl} variant="rounded" sx={{ width: 36, height: 36 }}><BrokenImageIcon /></Avatar> : 
                                        <Avatar variant="rounded" sx={{ width: 36, height: 36 }}><FitnessCenterIcon /></Avatar>}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={exercise.definition.name} 
                                    primaryTypographyProps={{ fontWeight: 500 }} 
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
}; 