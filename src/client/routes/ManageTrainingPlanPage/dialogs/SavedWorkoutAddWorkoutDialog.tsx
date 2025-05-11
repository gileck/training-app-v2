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

interface SavedWorkoutAddWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    planName: string | undefined;
    newWorkoutName: string;
    onNewWorkoutNameChange: (name: string) => void;
    addWorkoutError: string | null;
    isProcessing: boolean;
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
}) => {
    const theme = useTheme();
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2, minWidth: '300px' } }}>
            <DialogTitle sx={{ bgcolor: alpha(theme.palette.success.light, 0.1), color: theme.palette.success.dark, fontWeight: 'bold' }}>
                Add New Workout to {planName || 'Current Plan'}
            </DialogTitle>
            <DialogContent sx={{ pt: '20px !important' }}>
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onConfirm();
                        }
                    }}
                />
            </DialogContent>
            <MuiDialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ color: alpha('#000000', 0.7) }} disabled={isProcessing}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    sx={{ color: 'white', bgcolor: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.8) }, borderRadius: '8px' }}
                    disabled={isProcessing || !newWorkoutName.trim()}
                >
                    {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Create Workout'}
                </Button>
            </MuiDialogActions>
        </Dialog>
    );
}; 