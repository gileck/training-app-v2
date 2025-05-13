import React from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions as MuiDialogActions,
    TextField,
    CircularProgress,
    useTheme,
    alpha,
    Typography,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Avatar,
    Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import type { ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';

interface ExerciseWithDefinition {
    exerciseId: string;
    definitionId: string;
    definition: ApiExerciseDefinition;
}

interface SavedWorkoutAddWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string | undefined;
    newWorkoutName: string;
    onNewWorkoutNameChange: (name: string) => void;
    addWorkoutError: string | null;
    isProcessing: boolean;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    planExercises: ExerciseWithDefinition[];
    isLoadingExercises: boolean;
    errorLoadingExercises: string | null;
    selectedExerciseIds: Set<string>;
    onToggleExerciseSelection: (exerciseId: string) => void;
}

export const SavedWorkoutAddWorkoutDialog: React.FC<SavedWorkoutAddWorkoutDialogProps> = ({
    open,
    onClose,
    onConfirm,
    planName,
    newWorkoutName,
    onNewWorkoutNameChange,
    addWorkoutError,
    isProcessing,
    searchTerm,
    onSearchTermChange,
    planExercises,
    isLoadingExercises,
    errorLoadingExercises,
    selectedExerciseIds,
    onToggleExerciseSelection,
}) => {
    const theme = useTheme();

    const filteredExercises = React.useMemo(() => {
        if (!searchTerm?.trim()) {
            return planExercises;
        }
        return planExercises.filter(exercise => 
            exercise.definition.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [planExercises, searchTerm]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { height: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' } }}>
            <DialogTitle sx={{ bgcolor: alpha(theme.palette.success.light, 0.1), color: theme.palette.success.dark, fontWeight: 'bold' }}>
                Add New Workout to {planName || 'Current Plan'}
            </DialogTitle>
            
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', p: 2 }}>
                <TextField
                    autoFocus
                    margin="dense"
                    id="newWorkoutName"
                    label="New Workout Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newWorkoutName}
                    onChange={(e) => onNewWorkoutNameChange(e.target.value)}
                    error={!!addWorkoutError}
                    helperText={addWorkoutError}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>Select Exercises (Optional):</Typography>

                <TextField 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Search exercises in plan..." 
                    value={searchTerm} 
                    onChange={(e) => onSearchTermChange(e.target.value)} 
                    sx={{ mb: 2 }} 
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: alpha(theme.palette.success.dark, 0.8) }} /></InputAdornment>),
                    }}
                    disabled={isLoadingExercises}
                />

                {isLoadingExercises ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress sx={{ color: theme.palette.success.main }} /></Box>
                ) : errorLoadingExercises ? (
                    <Typography sx={{ textAlign: 'center', mt: 2, color: alpha(theme.palette.error.main, 0.9) }}>{errorLoadingExercises}</Typography>
                ) : filteredExercises.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#000000', 0.7) }}>No exercises found in the plan.</Typography>
                ) : (
                    <List dense sx={{ overflowY: 'auto', flexGrow: 1, pr: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                        {filteredExercises.map((exercise) => {
                            const isSelected = selectedExerciseIds.has(exercise.exerciseId);
                            const isDisabledByProcessing = isProcessing;

                            return (
                                <ListItemButton 
                                    key={exercise.exerciseId} 
                                    onClick={() => onToggleExerciseSelection(exercise.exerciseId)} 
                                    disabled={isDisabledByProcessing} 
                                    selected={isSelected}
                                    sx={{
                                        mb: 0.5, 
                                        borderRadius: '8px',
                                        bgcolor: isSelected ? alpha(theme.palette.success.light, 0.2) : undefined,
                                        '&:hover': {
                                            bgcolor: !isSelected ? alpha(theme.palette.action.hover, 0.04) : undefined,
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={isSelected}
                                            disabled={isDisabledByProcessing}
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
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <MuiDialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose} sx={{ color: alpha('#000000', 0.7) }} disabled={isProcessing}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    sx={{ color: 'white', bgcolor: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.8) }, borderRadius: '8px' }}
                    disabled={isProcessing || !newWorkoutName.trim() || isLoadingExercises }
                >
                    {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Create Workout'}
                </Button>
            </MuiDialogActions>
        </Dialog>
    );
}; 