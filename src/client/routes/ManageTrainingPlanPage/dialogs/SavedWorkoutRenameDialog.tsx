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
} from '@mui/material';
import type { ClientWorkoutDisplay } from '../types';

interface SavedWorkoutRenameDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    workoutToRename: ClientWorkoutDisplay | null;
    newWorkoutName: string;
    onNewWorkoutNameChange: (name: string) => void;
    isRenaming: boolean;
}

export const SavedWorkoutRenameDialog: React.FC<SavedWorkoutRenameDialogProps> = ({
    open,
    onClose,
    onConfirm,
    workoutToRename,
    newWorkoutName,
    onNewWorkoutNameChange,
    isRenaming,
}) => {
    const theme = useTheme();
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2, minWidth: '300px' } }}>
            <DialogTitle sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, fontWeight: 'bold' }}>Rename Workout</DialogTitle>
            <DialogContent sx={{ pt: '20px !important' }}>
                <TextField 
                    autoFocus 
                    margin="dense" 
                    label="Workout Name" 
                    type="text" 
                    fullWidth 
                    variant="outlined" 
                    value={newWorkoutName} 
                    onChange={(e) => onNewWorkoutNameChange(e.target.value)} 
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(); } }} 
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} 
                />
            </DialogContent>
            <MuiDialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ color: alpha('#000000', 0.7) }} disabled={isRenaming}>Cancel</Button>
                <Button 
                    onClick={onConfirm} 
                    sx={{ color: 'white', bgcolor: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.8) }, borderRadius: '8px' }} 
                    disabled={isRenaming || !newWorkoutName.trim() || newWorkoutName.trim() === workoutToRename?.name}
                >
                    {isRenaming ? <CircularProgress size={24} color="inherit" /> : 'Rename'}
                </Button>
            </MuiDialogActions>
        </Dialog>
    );
}; 