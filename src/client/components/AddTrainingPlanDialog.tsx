import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useTrainingPlans } from '@/client/hooks/useTrainingData';
import { useRouter } from '@/client/router';

interface AddTrainingPlanDialogProps {
    open: boolean;
    onClose: () => void;
}

const AddTrainingPlanDialog: React.FC<AddTrainingPlanDialogProps> = ({ open, onClose }) => {
    const [planName, setPlanName] = useState('');
    const [planDescription, setPlanDescription] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { createTrainingPlan } = useTrainingPlans();
    const { navigate } = useRouter();

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        setPlanName('');
        setPlanDescription('');
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
            const createdPlan = await createTrainingPlan({ name: planName.trim(), durationWeeks: durationNum });
            navigate(`/training-plans/${createdPlan._id}/exercises`);
            handleClose();
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
                    inputProps={{ 'data-testid': 'plan-name-input' }}
                />
                <FormControl fullWidth variant="standard" margin="dense" required>
                    <InputLabel id="duration-weeks-label">Duration (Weeks)</InputLabel>
                    <Select
                        labelId="duration-weeks-label"
                        id="durationWeeks"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(e.target.value)}
                        disabled={isSubmitting}
                        data-testid="plan-duration-select"
                    >
                        <MenuItem value="4">4 Weeks</MenuItem>
                        <MenuItem value="6">6 Weeks</MenuItem>
                        <MenuItem value="8">8 Weeks</MenuItem>
                        <MenuItem value="12">12 Weeks</MenuItem>
                        <MenuItem value="16">16 Weeks</MenuItem>
                        <MenuItem value="20">20 Weeks</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting} data-testid="save-plan-button">
                    {isSubmitting ? <CircularProgress size={24} /> : 'Create Plan'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTrainingPlanDialog; 