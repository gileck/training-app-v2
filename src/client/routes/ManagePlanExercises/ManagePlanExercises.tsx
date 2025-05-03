import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    Alert,
    Stack,
    useTheme,
    useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from '@/client/router';
import { getExercises, deleteExercise } from '@/apis/exercises/client';
import { getTrainingPlanById } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinitionOption } from '@/apis/exerciseDefinitions/types';
import { ExerciseFormDialog } from './ExerciseFormDialog';

// Helper function to create the map
const createDefinitionMap = (defs: ExerciseDefinitionOption[]): Record<string, string> => {
    return defs.reduce((acc: Record<string, string>, def: ExerciseDefinitionOption) => {
        acc[def._id] = def.name;
        return acc;
    }, {});
};

// Simple loading/error display using MUI components
const LoadingErrorDisplay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    return null;
};

interface ExerciseItemProps {
    exercise: ExerciseBase;
    exerciseName: string | undefined;
    onDelete: (exerciseId: string) => Promise<void>;
    onEdit: (exercise: ExerciseBase) => void;
    isDeleting: boolean;
}

// Exercise Item Display using MUI
const ExerciseItem = ({ exercise, exerciseName, onDelete, onEdit, isDeleting }: ExerciseItemProps) => {
    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete exercise ${exerciseName || exercise._id.toString()}?`)) {
            await onDelete(exercise._id.toString());
        }
    };

    const handleEdit = () => {
        onEdit(exercise);
    };

    return (
        <ListItem
            divider
            secondaryAction={
                <Stack direction="row" spacing={1}>
                    <IconButton edge="end" aria-label="edit" onClick={handleEdit} disabled={isDeleting}>
                        <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={handleDelete} disabled={isDeleting}>
                        <DeleteIcon />
                    </IconButton>
                </Stack>
            }
        >
            <ListItemText
                primary={exerciseName || `Exercise ID: ${exercise._id.toString()}`} // Display name or fallback to ID
                secondary={
                    <>
                        Sets: {exercise.sets}, Reps: {exercise.reps}
                        {exercise.weight !== undefined && `, Weight: ${exercise.weight}kg`}
                        {exercise.comments && ` | Comments: ${exercise.comments}`}
                        {` | Order: ${exercise.order}`}
                    </>
                }
            />
        </ListItem>
    );
};

export const ManagePlanExercises = () => {
    const { routeParams, navigate } = useRouter();
    const planId = routeParams.planId as string | undefined;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [exercises, setExercises] = useState<ExerciseBase[]>([]);
    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [definitions, setDefinitions] = useState<ExerciseDefinitionOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseBase | null>(null);

    const fetchData = useCallback(async () => {
        if (!planId) {
            setError("Training Plan ID not found in URL parameters.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [exercisesResponse, planResponse, definitionsResponse] = await Promise.all([
                getExercises({ trainingPlanId: planId }),
                getTrainingPlanById({ planId }),
                getAllExerciseDefinitionOptions()
            ]);

            // Process exercises
            if (exercisesResponse.data && Array.isArray(exercisesResponse.data)) {
                setExercises(exercisesResponse.data);
            } else {
                // Check for error structure
                const errorMessage = (typeof exercisesResponse.data === 'object' && exercisesResponse.data !== null && 'error' in exercisesResponse.data)
                    ? String((exercisesResponse.data as { error: string }).error)
                    : 'Invalid data format for exercises';
                throw new Error(errorMessage);
            }

            // Process plan details
            if (planResponse.data && 'name' in planResponse.data) {
                setPlanDetails(planResponse.data);
            } else {
                // Check for error structure
                const planError = (typeof planResponse.data === 'object' && planResponse.data !== null && 'error' in planResponse.data)
                    ? String((planResponse.data as { error: string }).error)
                    : null; // Set to null if no specific error found
                if (planError) throw new Error(`Failed to fetch plan details: ${planError}`);
                setPlanDetails(null);
                throw new Error('Training plan not found.');
            }

            // Process definitions
            if (definitionsResponse.data && Array.isArray(definitionsResponse.data)) {
                setDefinitions(definitionsResponse.data);
            } else {
                console.warn("Could not load exercise definitions, names may not be displayed.");
                setDefinitions([]);
            }

        } catch (err) {
            console.error("Failed to fetch page data:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setExercises([]);
            if (!planDetails) {
                setPlanDetails(null);
            }
            setDefinitions([]);
        } finally {
            setIsLoading(false);
        }
    }, [planId]);

    useEffect(() => {
        if (planId) {
            fetchData();
        } else if (routeParams && !planId) {
            setError("Training Plan ID missing from route parameters.");
            setIsLoading(false);
        }
    }, [planId, fetchData, routeParams]);

    const handleDeleteExercise = async (exerciseId: string) => {
        if (!planId) {
            setError("Cannot delete exercise without Plan ID.");
            return;
        }
        setDeletingId(exerciseId);
        setError(null);
        try {
            const response = await deleteExercise({ exerciseId, trainingPlanId: planId });
            if (response.data?.success) {
                setExercises(prev => prev.filter(ex => ex._id.toString() !== exerciseId));
            } else {
                throw new Error(response.data?.message || "Failed to delete exercise.");
            }
        } catch (err) {
            console.error("Failed to delete exercise:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion');
        } finally {
            setDeletingId(null);
        }
    };

    // --- Unified Dialog Handlers ---
    const handleOpenAddForm = () => {
        setExerciseToEdit(null);
        setIsFormDialogOpen(true);
    };

    const handleOpenEditForm = (exercise: ExerciseBase) => {
        setExerciseToEdit(exercise);
        setIsFormDialogOpen(true);
    };

    const handleFormDialogClose = () => {
        setIsFormDialogOpen(false);
        setExerciseToEdit(null);
    };

    const handleExerciseSave = (savedExercise: ExerciseBase) => {
        if (exerciseToEdit) {
            setExercises(prevExercises =>
                prevExercises.map(ex =>
                    ex._id.toString() === savedExercise._id.toString() ? savedExercise : ex
                )
            );
        } else {
            fetchData();
        }
    };

    // Memoize the definition map
    const definitionsMap = useMemo(() => createDefinitionMap(definitions), [definitions]);

    // Handle case where planId is missing (checked after useEffect sets error)
    if (!planId && !isLoading) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography variant="h5" gutterBottom>Manage Exercises</Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
            </Box>
        );
    }

    // Determine Title String
    const pageTitle = isLoading
        ? "Loading Exercises..."
        : planDetails?.name
            ? `Manage Exercises for Plan: ${planDetails.name}`
            : error === 'Training plan not found.'
                ? `Training Plan Not Found`
                : `Manage Exercises for Plan: ${planId}`;

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 2 }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ mb: 2 }}
            >
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                >
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        flexGrow: { sm: 1 },
                        textAlign: 'center',
                        order: { xs: 2, sm: 0 }
                    }}
                >
                    {pageTitle}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddForm}
                    disabled={isLoading || !planDetails || !!error}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                    Add Exercise
                </Button>
            </Stack>

            <LoadingErrorDisplay isLoading={isLoading} error={error && error !== 'Training plan not found.' ? error : null} />

            {!isLoading && planDetails && (!error || error === 'Training plan not found.') && (
                <>
                    {exercises.length === 0 ? (
                        <Typography sx={{ mt: 2, textAlign: 'center' }}>
                            No exercises found for this plan. Click &apos;Add Exercise&apos; to get started.
                        </Typography>
                    ) : (
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                            {exercises.map((exercise) => (
                                <ExerciseItem
                                    key={exercise._id.toString()}
                                    exercise={exercise}
                                    exerciseName={definitionsMap[exercise.exerciseDefinitionId.toString()]}
                                    onDelete={handleDeleteExercise}
                                    onEdit={handleOpenEditForm}
                                    isDeleting={deletingId === exercise._id.toString()}
                                />
                            ))}
                        </List>
                    )}
                </>
            )}

            {planId && (
                <ExerciseFormDialog
                    open={isFormDialogOpen}
                    onClose={handleFormDialogClose}
                    onSave={handleExerciseSave}
                    exerciseToEdit={exerciseToEdit}
                    planId={planId}
                />
            )}
        </Box>
    );
}; 