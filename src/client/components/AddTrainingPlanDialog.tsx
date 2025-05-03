import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { createTrainingPlan } from '@/apis/trainingPlans/client';

interface AddTrainingPlanDialogProps {
    open: boolean;
    onClose: () => void;
    onPlanCreated: () => void; // Callback to refresh the list
}

const AddTrainingPlanDialog: React.FC<AddTrainingPlanDialogProps> = ({ open, onClose, onPlanCreated }) => {
    const [planName, setPlanName] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        setPlanName('');
        setDurationWeeks('');
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        setError(null);
        const durationNum = parseInt(durationWeeks, 10);

        // Basic Validation
        if (!planName.trim()) {
            setError('Plan name is required.');
            return;
        }
        if (isNaN(durationNum) || durationNum <= 0) {
            setError('Duration must be a positive number of weeks.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createTrainingPlan({ name: planName.trim(), durationWeeks: durationNum });
            if ('_id' in response.data) { // Check if creation was successful (returned a plan)
                onPlanCreated(); // Refresh the list in the parent component
                handleClose(); // Close the dialog
            } else {
                setError(response.data?.error || 'Failed to create plan.');
            }
        } catch (err: unknown) {
            console.error("Create plan error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="add-plan-dialog-title">
            <DialogTitle id="add-plan-dialog-title">Create New Training Plan</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="planName"
                    label="Plan Name"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    disabled={isSubmitting}
                />
                <TextField
                    required
                    margin="dense"
                    id="durationWeeks"
                    label="Duration (Weeks)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(e.target.value)}
                    disabled={isSubmitting}
                    inputProps={{ min: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : 'Create Plan'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTrainingPlanDialog; 