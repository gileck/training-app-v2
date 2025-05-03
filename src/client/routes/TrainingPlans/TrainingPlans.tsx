import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Alert, Divider, Paper, Stack, Button, Tooltip } from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { getAllTrainingPlans, deleteTrainingPlan, duplicateTrainingPlan, setActiveTrainingPlan } from '@/apis/trainingPlans/client';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import { useAuth } from '@/client/context/AuthContext';
import { useRouter } from '@/client/router';
import AddTrainingPlanDialog from '@/client/components/AddTrainingPlanDialog';

export const TrainingPlans: React.FC = () => {
    const [plans, setPlans] = useState<TrainingPlan[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const { navigate } = useRouter();

    const fetchPlans = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await getAllTrainingPlans();
            if (Array.isArray(response.data)) {
                setPlans(response.data);
            } else if (response.data?.error) {
                setError(response.data.error);
                setPlans([]);
            } else {
                setError("Received unexpected data format.");
                setPlans([]);
            }
        } catch (err: unknown) {
            console.error("Failed to fetch training plans:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while fetching plans.");
            setPlans([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleDelete = useCallback(async (planId: string, planName: string) => {
        if (!window.confirm(`Are you sure you want to delete the plan "${planName}"? This cannot be undone.`)) {
            return;
        }
        setError(null);
        try {
            const response = await deleteTrainingPlan({ planId });
            if (response.data?.success) {
                setPlans(prevPlans => prevPlans.filter(p => p._id.toString() !== planId));
                const deletedPlan = plans.find(p => p._id.toString() === planId);
                if (deletedPlan?.isActive) {
                    fetchPlans();
                }
            } else {
                setError(response.data?.message || "Failed to delete plan.");
            }
        } catch (err: unknown) {
            console.error("Failed to delete training plan:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during deletion.");
        }
    }, [fetchPlans, plans]);

    const handleDuplicate = useCallback(async (planId: string) => {
        setError(null);
        try {
            const response = await duplicateTrainingPlan({ planId });
            if ('_id' in response.data) {
                await fetchPlans();
            } else {
                setError(response.data?.error || "Failed to duplicate plan.");
            }
        } catch (err: unknown) {
            console.error("Failed to duplicate training plan:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during duplication.");
        }
    }, [fetchPlans]);

    const handleSetActive = useCallback(async (planId: string) => {
        setError(null);
        try {
            const response = await setActiveTrainingPlan({ planId });
            if (response.data?.success) {
                await fetchPlans();
            } else {
                setError(response.data?.message || "Failed to set plan active.");
            }
        } catch (err: unknown) {
            console.error("Failed to set active plan:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while setting active plan.");
        }
    }, [fetchPlans]);

    const handleAddPlanClick = () => {
        setIsAddDialogOpen(true);
    };

    const handleAddDialogClose = () => {
        setIsAddDialogOpen(false);
    };

    const handlePlanCreated = () => {
        fetchPlans();
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
        <Paper elevation={1} sx={{ margin: 2, padding: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" component="h1">
                    Training Plans
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ListAltIcon />}
                        onClick={() => navigate('/saved-workouts')}
                        sx={{ mr: 1 }}
                    >
                        Saved Workouts
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPlanClick}
                    >
                        Add Plan
                    </Button>
                </Box>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {plans.length === 0 && !error && (
                <Typography sx={{ textAlign: 'center', p: 2 }}>
                    You haven&apos;t created any training plans yet.
                </Typography>
            )}

            {plans.length > 0 && (
                <List disablePadding>
                    {plans.map((plan, index) => (
                        <React.Fragment key={plan._id.toString()}>
                            <ListItem
                                secondaryAction={
                                    <Stack direction="row" spacing={0.5}>
                                        {!plan.isActive && (
                                            <Tooltip title="Set as Active Plan">
                                                <IconButton edge="end" aria-label="set active" onClick={(e) => { e.stopPropagation(); handleSetActive(plan._id.toString()); }}>
                                                    <StarBorderIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Manage Exercises">
                                            <IconButton
                                                edge="end"
                                                aria-label="manage exercises"
                                                onClick={(e) => { e.stopPropagation(); handleManageExercisesClick(plan._id.toString()); }}
                                            >
                                                <ListAltIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Duplicate Plan">
                                            <IconButton edge="end" aria-label="duplicate" onClick={(e) => { e.stopPropagation(); handleDuplicate(plan._id.toString()); }}>
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Plan">
                                            <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleDelete(plan._id.toString(), plan.name); }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                }
                            >
                                {plan.isActive && (
                                    <StarIcon color="primary" sx={{ mr: 1.5, verticalAlign: 'middle' }} />
                                )}
                                <ListItemText
                                    primary={plan.name}
                                    secondary={`${plan.durationWeeks} Week${plan.durationWeeks !== 1 ? 's' : ''}`}
                                    sx={{ pl: plan.isActive ? 0 : 4.5 }}
                                />
                            </ListItem>
                            {index < plans.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            )}

            <AddTrainingPlanDialog
                open={isAddDialogOpen}
                onClose={handleAddDialogClose}
                onPlanCreated={handlePlanCreated}
            />
        </Paper>
    );
}; 