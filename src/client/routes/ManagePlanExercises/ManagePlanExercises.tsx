import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Stack,
    useTheme,
    useMediaQuery,
    Card,
    CardMedia,
    CardActions,
    Chip,
    Paper,
    Divider,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotesIcon from '@mui/icons-material/Notes';
import TimerIcon from '@mui/icons-material/Timer';
import ScaleIcon from '@mui/icons-material/Scale';
import RepeatIcon from '@mui/icons-material/Repeat';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { useRouter } from '@/client/router';
import { getExercises, deleteExercise, addExercise } from '@/apis/exercises/client';
import { getTrainingPlanById } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import { ExerciseFormDialog } from './ExerciseFormDialog';
import { ExerciseDetailsDialog } from './ExerciseDetailsDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

// GENERIC_IMAGE_PLACEHOLDER for fallback
const GENERIC_IMAGE_PLACEHOLDER = "/images/exercises/placeholder-generic.png";

// Helper function to create the definition map (maps ID to full ExerciseDefinition object)
const createDefinitionMap = (defs: ExerciseDefinition[]): Record<string, ExerciseDefinition> => {
    return defs.reduce((acc: Record<string, ExerciseDefinition>, def: ExerciseDefinition) => {
        acc[def._id.toString()] = def; // Store the full definition object
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
    definition: ExerciseDefinition | undefined;
    onRequestDelete: (exercise: ExerciseBase) => void;
    onEdit: (exercise: ExerciseBase) => void;
    onDuplicate: (exercise: ExerciseBase) => Promise<void>;
    isDeleting: boolean;
    isDuplicating: boolean;
}

// Redesigned Exercise Item as a Card
const ExerciseItemCard: React.FC<ExerciseItemProps> = ({ exercise, definition, onRequestDelete, onEdit, onDuplicate, isDeleting, isDuplicating }) => {
    const theme = useTheme();
    const exerciseName = definition?.name || `Exercise ID: ${exercise._id.toString()}`;
    const imageUrl = definition?.imageUrl || GENERIC_IMAGE_PLACEHOLDER;

    const handleDeleteClick = () => {
        onRequestDelete(exercise);
    };

    const handleEdit = () => {
        onEdit(exercise);
    };

    const handleDuplicate = async () => {
        await onDuplicate(exercise);
    };

    const renderDetail = (icon: React.ReactNode, label: string, value?: string | number | null) => {
        if (value === undefined || value === null || String(value).trim() === '') return null;
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                {icon}
                <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>{label}:</Typography>
                <Typography variant="body2" component="span">{String(value)}</Typography>
            </Box>
        );
    };

    return (
        <Paper elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
            <Card>
                {/* Top section: Image + Details */}
                <Stack direction="row" spacing={0}>
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={exerciseName}
                        sx={{
                            width: { xs: 100, sm: 150 },
                            height: { xs: 120, sm: 'auto' },
                            minHeight: { sm: 150 },
                            objectFit: 'cover',
                            // No borderRight here, the content box will handle separation if needed or rely on padding
                            flexShrink: 0
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            (e.target as HTMLImageElement).src = GENERIC_IMAGE_PLACEHOLDER;
                        }}
                    />
                    {/* Content Box for details, to the right of the image */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', p: { xs: 1.5, sm: 2 } }}>
                        <Typography variant="h6" component="div" gutterBottom noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {exerciseName}
                        </Typography>

                        <Stack spacing={0.5} mb={1.5}>
                            {renderDetail(<RepeatIcon fontSize="small" />, "Sets", exercise.sets)}
                            {renderDetail(<RepeatIcon fontSize="small" />, "Reps", exercise.reps)}
                            {renderDetail(<ScaleIcon fontSize="small" />, "Weight", exercise.weight ? `${exercise.weight}kg` : null)}
                            {renderDetail(<TimerIcon fontSize="small" />, "Duration", exercise.durationSeconds ? `${exercise.durationSeconds}s` : null)}
                        </Stack>

                        {definition && (definition.primaryMuscle || definition.secondaryMuscles?.length > 0) && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5} sx={{ fontSize: '0.7rem' }}>
                                    Muscle Groups:
                                </Typography>
                                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                                    {definition.primaryMuscle && <Chip label={definition.primaryMuscle} size="small" color="primary" variant="filled" sx={{ fontSize: '0.65rem', height: '20px' }} />}
                                    {definition.secondaryMuscles?.slice(0, 2).map(muscle => (
                                        <Chip key={muscle} label={muscle} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: '20px' }} />
                                    ))}
                                    {(definition.secondaryMuscles?.length || 0) > 2 &&
                                        <Tooltip title={definition.secondaryMuscles?.slice(2).join(', ')}>
                                            <Chip label={`+${(definition.secondaryMuscles?.length || 0) - 2}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: '20px' }} />
                                        </Tooltip>
                                    }
                                </Stack>
                            </Box>
                        )}

                        {exercise.comments && (
                            <Tooltip title={exercise.comments} placement="top-start">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', cursor: 'default', mt: 'auto' /* Push to bottom if space */ }}>
                                    <NotesIcon fontSize="small" />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 150, sm: 250 } }}>
                                        {exercise.comments}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </Stack>

                {/* Actions: Full width below the image and details */}
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 1, backgroundColor: theme.palette.action.hover, width: '100%' }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={handleEdit} disabled={isDeleting || isDuplicating} color="primary">
                        Edit
                    </Button>
                    <Button size="small" startIcon={<FileCopyIcon />} onClick={handleDuplicate} disabled={isDeleting || isDuplicating}>
                        Duplicate
                    </Button>
                    <Button size="small" startIcon={<DeleteIcon />} onClick={handleDeleteClick} disabled={isDeleting || isDuplicating} color="error">
                        Delete
                    </Button>
                </CardActions>
            </Card>
        </Paper>
    );
};

export const ManagePlanExercises = () => {
    const { routeParams, navigate } = useRouter();
    const planId = routeParams.planId as string | undefined;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [exercises, setExercises] = useState<ExerciseBase[]>([]);
    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [definitions, setDefinitions] = useState<ExerciseDefinition[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

    const [isExerciseBrowserOpen, setIsExerciseBrowserOpen] = useState(false);
    const [isExerciseDetailsDialogOpen, setIsExerciseDetailsDialogOpen] = useState(false);
    const [selectedDefinitionForDetails, setSelectedDefinitionForDetails] = useState<ExerciseDefinition | null>(null);
    const [exerciseBeingEdited, setExerciseBeingEdited] = useState<ExerciseBase | null>(null);

    // State for the delete confirmation dialog
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [exercisePendingDeletion, setExercisePendingDeletion] = useState<ExerciseBase | null>(null);

    const fetchData = useCallback(async () => {
        if (!planId) {
            setError("Training Plan ID not found in URL parameters.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [exercisesResponse, planResponse, allDefinitionsResponse] = await Promise.all([
                getExercises({ trainingPlanId: planId }),
                getTrainingPlanById({ planId }),
                getAllExerciseDefinitionOptions()
            ]);

            if (exercisesResponse.data && Array.isArray(exercisesResponse.data)) {
                setExercises(exercisesResponse.data);
            } else {
                throw new Error('Invalid data format for exercises');
            }

            if (planResponse.data && 'name' in planResponse.data) {
                setPlanDetails(planResponse.data);
            } else {
                throw new Error('Training plan not found.');
            }

            if (allDefinitionsResponse.data && Array.isArray(allDefinitionsResponse.data)) {
                setDefinitions(allDefinitionsResponse.data);
            } else {
                console.warn("Could not load exercise definitions.");
                setDefinitions([]);
            }

        } catch (err) {
            console.error("Failed to fetch page data:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setExercises([]);
            if (!planDetails) setPlanDetails(null);
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

    // This function now sets state to open the confirm dialog
    const handleRequestDelete = (exercise: ExerciseBase) => {
        setExercisePendingDeletion(exercise);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDialogClose = () => {
        setIsConfirmDeleteDialogOpen(false);
        setExercisePendingDeletion(null); // Clear pending exercise on close
    };

    // This function contains the actual delete logic, called upon confirmation
    const executeDeleteExercise = async () => {
        if (!exercisePendingDeletion || !planId) {
            setError("Cannot delete exercise: Missing exercise data or Plan ID.");
            setIsConfirmDeleteDialogOpen(false);
            setExercisePendingDeletion(null);
            return;
        }
        const exerciseIdToDelete = exercisePendingDeletion._id.toString();
        setDeletingId(exerciseIdToDelete); // Indicate API call is in progress for this specific exercise
        setError(null);
        setIsConfirmDeleteDialogOpen(false); // Close the dialog before making the API call

        try {
            const response = await deleteExercise({ exerciseId: exerciseIdToDelete, trainingPlanId: planId });
            if (response.data?.success) {
                setExercises(prev => prev.filter(ex => ex._id.toString() !== exerciseIdToDelete));
            } else {
                throw new Error(response.data?.message || "Failed to delete exercise.");
            }
        } catch (err) {
            console.error("Failed to delete exercise:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion');
        } finally {
            setDeletingId(null); // Reset deleting indicator
            setExercisePendingDeletion(null); // Clear pending exercise
        }
    };

    const handleDuplicateExercise = async (exerciseToDuplicate: ExerciseBase) => {
        if (!planId) {
            setError("Cannot duplicate exercise without Plan ID.");
            return;
        }
        setDuplicatingId(exerciseToDuplicate._id.toString());
        setError(null);
        try {
            const params = {
                trainingPlanId: planId,
                exerciseDefinitionId: exerciseToDuplicate.exerciseDefinitionId.toString(),
                sets: exerciseToDuplicate.sets,
                reps: exerciseToDuplicate.reps,
                weight: exerciseToDuplicate.weight,
                durationSeconds: exerciseToDuplicate.durationSeconds,
                comments: exerciseToDuplicate.comments,
            };
            const response = await addExercise(params);
            if (response.data && '_id' in response.data) {
                await fetchData();
            } else if (response.data && 'error' in response.data && typeof (response.data as { error: string }).error === 'string') {
                throw new Error((response.data as { error: string }).error);
            } else {
                throw new Error("Failed to duplicate exercise due to an unexpected response format.");
            }
        } catch (err) {
            console.error("Failed to duplicate exercise:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during duplication');
        } finally {
            setDuplicatingId(null);
        }
    };

    const handleOpenExerciseBrowser = () => {
        setExerciseBeingEdited(null);
        setIsExerciseBrowserOpen(true);
    };

    const handleOpenEditForm = (exercise: ExerciseBase) => {
        const definition = definitions.find(def => def._id.toString() === exercise.exerciseDefinitionId.toString());
        if (definition) {
            setSelectedDefinitionForDetails(definition);
            setExerciseBeingEdited(exercise);
            setIsExerciseDetailsDialogOpen(true);
        } else {
            setError("Could not find the definition for the exercise to edit.");
        }
    };

    const handleBrowserDialogClose = () => {
        setIsExerciseBrowserOpen(false);
    };

    const handleExerciseSelectFromBrowser = (definition: ExerciseDefinition) => {
        setSelectedDefinitionForDetails(definition);
        setExerciseBeingEdited(null);
        setIsExerciseDetailsDialogOpen(true);
        setIsExerciseBrowserOpen(false);
    };

    const handleDetailsDialogSave = (savedExercise: ExerciseBase) => {
        if (exerciseBeingEdited) {
            setExercises(prevExercises =>
                prevExercises.map(ex =>
                    ex._id.toString() === savedExercise._id.toString() ? savedExercise : ex
                )
            );
        } else {
            fetchData();
        }
        setExerciseBeingEdited(null);
        setIsExerciseDetailsDialogOpen(false);
        setSelectedDefinitionForDetails(null);
    };

    const handleDetailsDialogClose = () => {
        setIsExerciseDetailsDialogOpen(false);
        setSelectedDefinitionForDetails(null);
        setExerciseBeingEdited(null);
    };

    const definitionsMap = useMemo(() => createDefinitionMap(definitions), [definitions]);

    const existingExerciseDefinitionIdsInPlan = useMemo(() => {
        return exercises.map(ex => ex.exerciseDefinitionId.toString());
    }, [exercises]);

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
                    onClick={handleOpenExerciseBrowser}
                    disabled={isLoading || !planDetails || !!error}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                    Add Exercise
                </Button>
            </Stack>

            <LoadingErrorDisplay isLoading={isLoading} error={error && error !== 'Training plan not found.' ? error : null} />

            {!isLoading && planDetails && (!error || error === 'Training plan not found.') && (
                <Box mt={2}>
                    {exercises.length === 0 ? (
                        <Typography sx={{ mt: 2, textAlign: 'center' }}>
                            No exercises found for this plan. Click &apos;Add Exercise&apos; to get started.
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            {exercises.map((exercise) => {
                                const definition = definitionsMap[exercise.exerciseDefinitionId.toString()];
                                return (
                                    <ExerciseItemCard
                                        key={exercise._id.toString()}
                                        exercise={exercise}
                                        definition={definition}
                                        onRequestDelete={handleRequestDelete}
                                        onEdit={handleOpenEditForm}
                                        onDuplicate={handleDuplicateExercise}
                                        isDeleting={deletingId === exercise._id.toString()}
                                        isDuplicating={duplicatingId === exercise._id.toString()}
                                    />
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            )}

            {planId && (
                <ExerciseFormDialog
                    open={isExerciseBrowserOpen}
                    onClose={handleBrowserDialogClose}
                    onExerciseSelect={handleExerciseSelectFromBrowser}
                    existingExerciseDefinitionIds={existingExerciseDefinitionIdsInPlan}
                />
            )}

            {planId && (selectedDefinitionForDetails || exerciseBeingEdited) && (
                <ExerciseDetailsDialog
                    open={isExerciseDetailsDialogOpen}
                    onClose={handleDetailsDialogClose}
                    onSave={handleDetailsDialogSave}
                    planId={planId}
                    exerciseDefinition={selectedDefinitionForDetails}
                    exerciseToEdit={exerciseBeingEdited}
                />
            )}

            {/* Render the ConfirmDeleteDialog */}
            {exercisePendingDeletion && planId && ( // ensure planId is also available
                <ConfirmDeleteDialog
                    open={isConfirmDeleteDialogOpen}
                    onClose={handleConfirmDialogClose}
                    onConfirm={executeDeleteExercise}
                    itemName={definitionsMap[exercisePendingDeletion.exerciseDefinitionId.toString()]?.name || `ID: ${exercisePendingDeletion._id.toString()}`}
                    itemType="exercise"
                />
            )}
        </Box>
    );
}; 