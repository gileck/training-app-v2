import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, Alert, Paper, Stack, Button, Tooltip, List, ListItem, CardContent, CardActions, Chip, Divider } from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useTrainingPlans } from '@/client/hooks/useTrainingData';
import { useRouter } from '@/client/router';
import AddTrainingPlanDialog from '@/client/components/AddTrainingPlanDialog';
import { ConfirmationDialog } from '@/client/components/ConfirmationDialog';
import { TrainingPlan } from '@/common/types/training';

const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

export const TrainingPlans: React.FC = () => {
    const {
        trainingPlans,
        isLoading,
        error,
        deleteTrainingPlan,
        duplicateTrainingPlan,
        setActiveTrainingPlan
    } = useTrainingPlans();

    const { navigate } = useRouter();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        open: boolean;
        planId: string;
        planName: string;
    }>({
        open: false,
        planId: '',
        planName: ''
    });

    const handleDelete = useCallback(async (planId: string, planName: string) => {
        setDeleteConfirmation({
            open: true,
            planId,
            planName
        });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        const { planId } = deleteConfirmation;
        setDeleteConfirmation({ open: false, planId: '', planName: '' });
        try {
            await deleteTrainingPlan(planId);
        } catch (err: unknown) {
            console.error("Failed to delete training plan:", err);
        }
    }, [deleteConfirmation, deleteTrainingPlan]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirmation({ open: false, planId: '', planName: '' });
    }, []);

    const handleDuplicate = useCallback(async (planId: string) => {
        try {
            await duplicateTrainingPlan(planId);
        } catch (err: unknown) {
            console.error("Failed to duplicate training plan:", err);
        }
    }, [duplicateTrainingPlan]);

    const handleSetActive = useCallback(async (planId: string) => {
        try {
            await setActiveTrainingPlan(planId);
        } catch (err: unknown) {
            console.error("Failed to set active plan:", err);
        }
    }, [setActiveTrainingPlan]);

    const handleAddPlanClick = () => {
        setIsAddDialogOpen(true);
    };

    const handleAddDialogClose = () => {
        setIsAddDialogOpen(false);
    };

    const handleManageExercisesClick = (planId: string) => {
        navigate(`/training-plans/${planId}/exercises`);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                    mb: 3,
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' }
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: { xs: 2, sm: 0 } }}>
                    Training Plans
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<ListAltIcon />}
                        onClick={() => navigate('/saved-workouts')}
                        size="small"
                    >
                        Saved Workouts
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPlanClick}
                        size="small"
                    >
                        Add Plan
                    </Button>
                </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {trainingPlans.length === 0 && !error && (
                <Paper elevation={1} sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        No Training Plans Yet
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Get started by creating your first training plan.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPlanClick}
                    >
                        Add Plan
                    </Button>
                </Paper>
            )}

            {trainingPlans.length > 0 && (
                <List disablePadding>
                    {trainingPlans.map((plan: TrainingPlan, index: number) => (
                        <React.Fragment key={plan._id.toString()}>
                            <ListItem sx={{ display: 'block', p: 0, mb: trainingPlans.length - 1 === index ? 0 : 2 }}>
                                <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" component="div">
                                                {plan.name}
                                            </Typography>
                                            {plan.isActive && (
                                                <Tooltip title="Active Plan">
                                                    <Chip
                                                        icon={<StarIcon fontSize="small" />}
                                                        label="Active"
                                                        color="primary"
                                                        size="small"
                                                        sx={{ ml: 1, height: '24px', '.MuiChip-icon': { fontSize: '1rem' } }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {`${plan.durationWeeks} Week${plan.durationWeeks !== 1 ? 's' : ''}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            Created: {formatDate(plan.createdAt)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 1, pr: 1 }}>
                                        <Tooltip title={plan.isActive ? "Already Active" : "Set as Active Plan"}>
                                            <span> {/* Span is needed for disabled IconButton tooltip */}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); handleSetActive(plan._id.toString()); }}
                                                    disabled={plan.isActive}
                                                >
                                                    {plan.isActive ? <StarIcon color="primary" /> : <StarBorderIcon />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Manage Exercises">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); handleManageExercisesClick(plan._id.toString()); }}
                                            >
                                                <ListAltIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Duplicate Plan">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicate(plan._id.toString()); }}>
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Plan">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(plan._id.toString(), plan.name); }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Paper>
                            </ListItem>
                            {index < trainingPlans.length - 1 && <Divider sx={{ mb: 2 }} component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            )}

            <AddTrainingPlanDialog
                open={isAddDialogOpen}
                onClose={handleAddDialogClose}
            />

            <ConfirmationDialog
                open={deleteConfirmation.open}
                title="Delete Training Plan"
                message={`Are you sure you want to delete the plan "${deleteConfirmation.planName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                severity="error"
            />
        </Box>
    );
}; 