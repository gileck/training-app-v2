import React from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions as MuiDialogActions,
    useTheme,
    alpha,
} from '@mui/material';

interface SavedWorkoutDeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const SavedWorkoutDeleteDialog: React.FC<SavedWorkoutDeleteDialogProps> = ({ open, onClose, onConfirm }) => {
    const theme = useTheme();
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, fontWeight: 'bold' }}>Confirm Delete Workout</DialogTitle>
            <DialogContent sx={{ pt: '20px !important' }}><DialogContentText>Are you sure you want to delete this workout? This action cannot be undone.</DialogContentText></DialogContent>
            <MuiDialogActions sx={{ p: 2 }}><Button onClick={onClose} sx={{ color: alpha('#000000', 0.7) }}>Cancel</Button><Button onClick={onConfirm} sx={{ color: 'white', bgcolor: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.8) } }}>Delete</Button></MuiDialogActions>
        </Dialog>
    );
}; 