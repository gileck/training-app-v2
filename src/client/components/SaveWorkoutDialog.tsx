import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';

interface SaveWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<boolean | void>;
}

export const SaveWorkoutDialog: React.FC<SaveWorkoutDialogProps> = ({
    open,
    onClose,
    onSave
}) => {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await onSave(name);
            handleClose();
        } catch (err) {
            console.error('Error saving workout:', err);
            setError(err instanceof Error ? err.message : 'Failed to save workout');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    p: 1
                }
            }}
        >
            <DialogTitle>Save Workout</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    margin="dense"
                    label="Workout Name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    variant="outlined"
                    disabled={isLoading}
                    sx={{ mb: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Box sx={{ position: 'relative' }}>
                    <Button
                        onClick={handleSave}
                        color="primary"
                        variant="contained"
                        disabled={isLoading || !name.trim()}
                    >
                        Save
                    </Button>
                    {isLoading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
}; 