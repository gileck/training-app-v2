import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    CircularProgress
} from '@mui/material';

interface SaveWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    currentName?: string;
    isSaving?: boolean;
}

export const SaveWorkoutDialog: React.FC<SaveWorkoutDialogProps> = ({
    open,
    onClose,
    onSave,
    currentName = 'My Custom Workout',
    isSaving = false
}) => {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setName(currentName); // Reset name when dialog opens
            setError(''); // Clear previous errors
        }
    }, [open, currentName]);

    const handleSave = () => {
        if (!name.trim()) {
            setError('Workout name cannot be empty.');
            return;
        }
        setError('');
        onSave(name.trim());
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        if (event.target.value.trim()) {
            setError('');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form' }} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <DialogTitle>Save Workout</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Please enter a name for this workout session.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Workout Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={handleNameChange}
                    error={!!error}
                    helperText={error}
                    disabled={isSaving}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={isSaving}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={isSaving || !name.trim() || !!error}
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 