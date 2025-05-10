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
    Tooltip,
    Tabs,
    Tab,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions as MuiDialogActions,
    TextField,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    alpha,
    ListItemButton,
    AppBar,
    Toolbar,
    InputAdornment,
    Avatar,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { useRouter } from '@/client/router';
import { getExercises, deleteExercise, addExercise } from '@/apis/exercises/client';
import { getTrainingPlanById } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types';
import { getAllSavedWorkouts, deleteSavedWorkout as deleteSavedWorkoutApi, getSavedWorkoutDetails, createSavedWorkout, addExerciseToSavedWorkout, removeExerciseFromSavedWorkout as removeExerciseFromSavedWorkoutApi, renameSavedWorkout } from '@/apis/savedWorkouts/client';
import type {
    SavedWorkout as ApiSavedWorkout,
    SavedWorkoutWithExercises as ApiSavedWorkoutWithExercises,
    AddExerciseToSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutRequest,
} from '@/apis/savedWorkouts/types';
import { getAllTrainingPlans } from '@/apis/trainingPlans/client';
import type { TrainingPlan as ApiTrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import { ExerciseFormDialog } from './ExerciseFormDialog';
import { ExerciseDetailsDialog } from './ExerciseDetailsDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

const GENERIC_IMAGE_PLACEHOLDER = "/images/exercises/placeholder-generic.png";

const createDefinitionMapMPE = (defs: ApiExerciseDefinitionMPE[]): Record<string, ApiExerciseDefinitionMPE> => {
    return defs.reduce((acc: Record<string, ApiExerciseDefinitionMPE>, def: ApiExerciseDefinitionMPE) => {
        acc[def._id.toString()] = def;
        return acc;
    }, {});
};

interface ClientWorkoutDisplay extends Omit<ApiSavedWorkoutWithExercises, '_id' | 'userId' | 'trainingPlanId' | 'createdAt' | 'updatedAt'> {
    _id: string;
    userId: string;
    trainingPlanId: string;
    createdAt: string;
    updatedAt: string;
    isExercisesLoading?: boolean;
    exercisesError?: string | null;
}

const LoadingErrorDisplay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    return null;
};

interface ExerciseItemProps {
    exercise: ExerciseBase;
    definition: ApiExerciseDefinitionMPE | undefined;
    onRequestDelete: (exercise: ExerciseBase) => void;
    onEdit: (exercise: ExerciseBase) => void;
    onDuplicate: (exercise: ExerciseBase) => Promise<void>;
    isDeleting: boolean;
    isDuplicating: boolean;
}

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
                            flexShrink: 0
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            (e.target as HTMLImageElement).src = GENERIC_IMAGE_PLACEHOLDER;
                        }}
                    />
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', cursor: 'default', mt: 'auto' }}>
                                    <NotesIcon fontSize="small" />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 150, sm: 250 } }}>
                                        {exercise.comments}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </Stack>

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

export const ManageTrainingPlanPage: React.FC = () => {
    const { routeParams, navigate } = useRouter();
    const planId = routeParams.planId as string | undefined;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [currentTab, setCurrentTab] = useState(0);

    const [exercises, setExercises] = useState<ExerciseBase[]>([]);
    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [definitions, setDefinitions] = useState<ApiExerciseDefinitionMPE[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
    const [duplicatingExerciseId, setDuplicatingExerciseId] = useState<string | null>(null);

    const [isExerciseBrowserOpen, setIsExerciseBrowserOpen] = useState(false);
    const [isExerciseDetailsDialogOpen, setIsExerciseDetailsDialogOpen] = useState(false);
    const [selectedDefinitionForDetails, setSelectedDefinitionForDetails] = useState<ApiExerciseDefinitionMPE | null>(null);
    const [exerciseBeingEdited, setExerciseBeingEdited] = useState<ExerciseBase | null>(null);

    const [isConfirmDeleteExerciseDialogOpen, setIsConfirmDeleteExerciseDialogOpen] = useState(false);
    const [exercisePendingDeletion, setExercisePendingDeletion] = useState<ExerciseBase | null>(null);

    const [savedWorkout_workouts, setSavedWorkout_workouts] = useState<ClientWorkoutDisplay[]>([]);
    const [savedWorkout_isLoading, setSavedWorkout_isLoading] = useState(true);
    const [savedWorkout_error, setSavedWorkout_error] = useState<string | null>(null);
    const [savedWorkout_successMessage, setSavedWorkout_successMessage] = useState<string | null>(null);
    const [savedWorkout_deleteDialogOpen, setSavedWorkout_deleteDialogOpen] = useState(false);
    const [savedWorkout_workoutToDeleteId, setSavedWorkout_workoutToDeleteId] = useState<string | null>(null);
    const [savedWorkout_renameDialogOpen, setSavedWorkout_renameDialogOpen] = useState(false);
    const [savedWorkout_workoutToRename, setSavedWorkout_workoutToRename] = useState<ClientWorkoutDisplay | null>(null);
    const [savedWorkout_newWorkoutName, setSavedWorkout_newWorkoutName] = useState('');
    const [savedWorkout_expandedWorkoutId, setSavedWorkout_expandedWorkoutId] = useState<string | null>(null);
    const [savedWorkout_allExerciseDefinitions, setSavedWorkout_allExerciseDefinitions] = useState<ApiExerciseDefinition[]>([]);
    const [savedWorkout_addExerciseDialogOpen, setSavedWorkout_addExerciseDialogOpen] = useState(false);
    const [savedWorkout_workoutToAddExerciseTo, setSavedWorkout_workoutToAddExerciseTo] = useState<ClientWorkoutDisplay | null>(null);
    const [savedWorkout_searchTerm, setSavedWorkout_searchTerm] = useState('');
    const [savedWorkout_dialogExerciseList, setSavedWorkout_dialogExerciseList] = useState<ApiExerciseDefinition[]>([]);
    const [savedWorkout_isLoadingDialogExercises, setSavedWorkout_isLoadingDialogExercises] = useState(false);
    const [savedWorkout_dialogPlanContextError, setSavedWorkout_dialogPlanContextError] = useState<string | null>(null);
    const [savedWorkout_isAddWorkoutDialogOpen, setSavedWorkout_isAddWorkoutDialogOpen] = useState(false);
    const [savedWorkout_newWorkoutNameForAdd, setSavedWorkout_newWorkoutNameForAdd] = useState('');
    const [savedWorkout_addWorkoutError, setSavedWorkout_addWorkoutError] = useState<string | null>(null);
    const [savedWorkout_isAddingSingleExercise, setSavedWorkout_isAddingSingleExercise] = useState(false);
    const [savedWorkout_isRemovingExercise, setSavedWorkout_isRemovingExercise] = useState<string | null>(null);
    const [savedWorkout_isRenamingWorkoutId, setSavedWorkout_isRenamingWorkoutId] = useState<string | null>(null);
    const [availableTrainingPlans, setAvailableTrainingPlans] = useState<ApiTrainingPlan[]>([]);
    const [isLoadingTrainingPlans, setIsLoadingTrainingPlans] = useState(false);

    const savedWorkout_exerciseDefinitionMap = useMemo(() => {
        const map = new Map<string, ApiExerciseDefinition>();
        (savedWorkout_allExerciseDefinitions.length > 0 ? savedWorkout_allExerciseDefinitions : definitions).forEach(def => {
            map.set(def._id.toString(), def);
        });
        return map;
    }, [savedWorkout_allExerciseDefinitions, definitions]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const clearMessages = useCallback(() => {
        setTimeout(() => {
            setError(null);
            setSavedWorkout_error(null);
            setSavedWorkout_successMessage(null);
        }, 5000);
    }, []);

    const fetchExercisesTabData = useCallback(async () => {
        if (!planId) {
            setError("Training Plan ID not found in URL parameters.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const planResponse = await getTrainingPlanById({ planId });
            if (planResponse.data && 'name' in planResponse.data) {
                setPlanDetails(planResponse.data);
            } else {
                throw new Error('Training plan not found.');
            }

            const [exercisesResponse, allDefinitionsResponse] = await Promise.all([
                getExercises({ trainingPlanId: planId }),
                getAllExerciseDefinitionOptions()
            ]);

            if (exercisesResponse.data && Array.isArray(exercisesResponse.data)) {
                setExercises(exercisesResponse.data);
            }
            if (allDefinitionsResponse.data && Array.isArray(allDefinitionsResponse.data)) {
                setDefinitions(allDefinitionsResponse.data as ApiExerciseDefinitionMPE[]);
                if (savedWorkout_allExerciseDefinitions.length === 0) {
                    setSavedWorkout_allExerciseDefinitions(allDefinitionsResponse.data as ApiExerciseDefinition[]);
                }
            } else {
                console.warn("Could not load exercise definitions.");
                setDefinitions([]);
                setSavedWorkout_allExerciseDefinitions([]);
            }
        } catch (err) {
            console.error("Failed to fetch page data (Exercises Tab):", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred for Exercises Tab');
            setExercises([]);
            if (!planDetails) setPlanDetails(null);
            setDefinitions([]);
        } finally {
            setIsLoading(false);
        }
    }, [planId]);

    const fetchSavedWorkoutsForPlan = useCallback(async () => {
        if (!planId) {
            setSavedWorkout_error("Training Plan ID not found.");
            setSavedWorkout_isLoading(false);
            return;
        }
        setSavedWorkout_isLoading(true);
        setSavedWorkout_error(null);
        setSavedWorkout_successMessage(null);
        try {
            if (savedWorkout_allExerciseDefinitions.length === 0 && definitions.length === 0) {
                const definitionsResponse = await getAllExerciseDefinitionOptions();
                if (definitionsResponse.data) {
                    setSavedWorkout_allExerciseDefinitions(definitionsResponse.data);
                    if (definitions.length === 0) setDefinitions(definitionsResponse.data);
                } else {
                    setSavedWorkout_error('Failed to load exercise definitions for workouts tab');
                }
            }

            const workoutsResponse = await getAllSavedWorkouts({ trainingPlanId: planId });
            if (workoutsResponse.data) {
                const mappedWorkouts = workoutsResponse.data.map((w: ApiSavedWorkout) => {
                    const formatDate = (dateValue: string | number | Date | null | undefined): string => {
                        if (!dateValue) return new Date().toISOString();
                        if (dateValue instanceof Date) return dateValue.toISOString();
                        if (typeof dateValue === 'string') { try { return new Date(dateValue).toISOString(); } catch { return new Date().toISOString(); } }
                        if (typeof dateValue === 'number') return new Date(dateValue).toISOString();
                        return new Date().toISOString();
                    };
                    if (!w || !w._id || !w.userId || !w.trainingPlanId) return null;
                    return {
                        ...w,
                        _id: w._id.toString(),
                        userId: w.userId.toString(),
                        trainingPlanId: w.trainingPlanId.toString(),
                        createdAt: formatDate(w.createdAt),
                        updatedAt: formatDate(w.updatedAt),
                        exercises: [],
                        isExercisesLoading: false,
                        exercisesError: null,
                    };
                }).filter(Boolean) as ClientWorkoutDisplay[];
                setSavedWorkout_workouts(mappedWorkouts);
            } else {
                setSavedWorkout_error('Failed to load saved workouts for this plan');
            }
        } catch (err) {
            console.error('Error fetching saved workouts for plan:', err);
            setSavedWorkout_error('An error occurred while loading workouts for this plan');
        } finally {
            setSavedWorkout_isLoading(false);
        }
    }, [planId, savedWorkout_allExerciseDefinitions.length, definitions.length]);

    const fetchAvailableTrainingPlans = useCallback(async () => {
        setIsLoadingTrainingPlans(true);
        try {
            const response = await getAllTrainingPlans();
            if (response.data && Array.isArray(response.data)) {
                setAvailableTrainingPlans(response.data);
            } else if (response.data && 'error' in response.data) {
                console.error('Error fetching training plans:', (response.data as { error: string }).error);
            }
        } catch (err) {
            console.error('Error fetching training plans:', err);
        } finally {
            setIsLoadingTrainingPlans(false);
        }
    }, []);

    useEffect(() => {
        if (planId) {
            if (currentTab === 0) {
                fetchExercisesTabData();
            } else if (currentTab === 1) {
                fetchSavedWorkoutsForPlan();
            }
        } else if (routeParams && !planId) {
            setError("Training Plan ID missing from route parameters.");
            setIsLoading(false);
            setSavedWorkout_isLoading(false);
        }
    }, [planId, currentTab, fetchExercisesTabData, fetchSavedWorkoutsForPlan, routeParams]);

    const handleRequestDeleteExercise = (exercise: ExerciseBase) => {
        setExercisePendingDeletion(exercise);
        setIsConfirmDeleteExerciseDialogOpen(true);
    };

    const handleConfirmDeleteExerciseDialogClose = () => {
        setIsConfirmDeleteExerciseDialogOpen(false);
        setExercisePendingDeletion(null);
    };

    const executeDeleteExercise = async () => {
        if (!exercisePendingDeletion || !planId) {
            setError("Cannot delete exercise: Missing exercise data or Plan ID.");
            setIsConfirmDeleteExerciseDialogOpen(false);
            setExercisePendingDeletion(null);
            return;
        }
        const exerciseIdToDelete = exercisePendingDeletion._id.toString();
        setDeletingExerciseId(exerciseIdToDelete);
        setError(null);
        setIsConfirmDeleteExerciseDialogOpen(false);

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
            setDeletingExerciseId(null);
            setExercisePendingDeletion(null);
        }
    };

    const handleDuplicateExercise = async (exerciseToDuplicate: ExerciseBase) => {
        if (!planId) { setError("Cannot duplicate exercise without Plan ID."); return; }
        setDuplicatingExerciseId(exerciseToDuplicate._id.toString());
        setError(null);
        try {
            const params = { trainingPlanId: planId, exerciseDefinitionId: exerciseToDuplicate.exerciseDefinitionId.toString(), sets: exerciseToDuplicate.sets, reps: exerciseToDuplicate.reps, weight: exerciseToDuplicate.weight, durationSeconds: exerciseToDuplicate.durationSeconds, comments: exerciseToDuplicate.comments, };
            const response = await addExercise(params);
            if (response.data && '_id' in response.data) { await fetchExercisesTabData(); }
            else if (response.data && 'error' in response.data && typeof (response.data as { error: string }).error === 'string') { throw new Error((response.data as { error: string }).error); }
            else { throw new Error("Failed to duplicate exercise due to an unexpected response format."); }
        } catch (err) {
            console.error("Failed to duplicate exercise:", err); setError(err instanceof Error ? err.message : 'An unknown error occurred during duplication');
        } finally { setDuplicatingExerciseId(null); }
    };

    const handleOpenExerciseBrowser = () => { setExerciseBeingEdited(null); setIsExerciseBrowserOpen(true); };

    const handleOpenEditForm = (exercise: ExerciseBase) => {
        const definition = definitions.find(def => def._id.toString() === exercise.exerciseDefinitionId.toString());
        if (definition) { setSelectedDefinitionForDetails(definition); setExerciseBeingEdited(exercise); setIsExerciseDetailsDialogOpen(true); }
        else { setError("Could not find the definition for the exercise to edit."); }
    };

    const handleBrowserDialogClose = () => { setIsExerciseBrowserOpen(false); };

    const handleExerciseSelectFromBrowser = (definition: ApiExerciseDefinitionMPE) => { setSelectedDefinitionForDetails(definition); setExerciseBeingEdited(null); setIsExerciseDetailsDialogOpen(true); setIsExerciseBrowserOpen(false); };

    const handleDetailsDialogSave = (savedExercise: ExerciseBase) => {
        if (exerciseBeingEdited) { setExercises(prevExercises => prevExercises.map(ex => ex._id.toString() === savedExercise._id.toString() ? savedExercise : ex)); }
        else { fetchExercisesTabData(); }
        setExerciseBeingEdited(null); setIsExerciseDetailsDialogOpen(false); setSelectedDefinitionForDetails(null);
    };

    const handleDetailsDialogClose = () => { setIsExerciseDetailsDialogOpen(false); setSelectedDefinitionForDetails(null); setExerciseBeingEdited(null); };

    const definitionsMapMPE = useMemo(() => createDefinitionMapMPE(definitions), [definitions]);

    const existingExerciseDefinitionIdsInPlan = useMemo(() => { return exercises.map(ex => ex.exerciseDefinitionId.toString()); }, [exercises]);

    const savedWorkout_handleToggleExpand = async (workoutId: string) => {
        const isCurrentlyExpanded = savedWorkout_expandedWorkoutId === workoutId;
        const newExpandedId = isCurrentlyExpanded ? null : workoutId;
        setSavedWorkout_expandedWorkoutId(newExpandedId);

        if (newExpandedId === workoutId) { // If we are expanding this workout
            const workout = savedWorkout_workouts.find(w => w._id === workoutId);
            // And if exercises are not loaded, and we are not currently loading them, and there's no prior error for them
            if (workout && (!workout.exercises || workout.exercises.length === 0) && !workout.isExercisesLoading && !workout.exercisesError) {
                setSavedWorkout_workouts(prev => prev.map(w =>
                    w._id === workoutId ? { ...w, isExercisesLoading: true, exercisesError: null } : w
                ));
                try {
                    const apiResponse = await getSavedWorkoutDetails({ workoutId });
                    const responseData = apiResponse.data;

                    if (responseData && typeof responseData === 'object' && 'exercises' in responseData && Array.isArray(responseData.exercises)) {
                        // Success: responseData is SavedWorkoutWithExercises
                        setSavedWorkout_workouts(prev => prev.map(w =>
                            w._id === workoutId
                                ? { ...w, exercises: responseData.exercises, isExercisesLoading: false, exercisesError: null }
                                : w
                        ));
                    } else if (responseData && typeof responseData === 'object' && 'error' in responseData) {
                        // API returned an error object like { error: "message" }
                        const apiError = (responseData as { error: string }).error || 'Failed to load exercises: API error';
                        setSavedWorkout_workouts(prev => prev.map(w =>
                            w._id === workoutId ? { ...w, isExercisesLoading: false, exercisesError: apiError } : w
                        ));
                    } else if (responseData === null) {
                        // Workout not found by API, or API returned null explicitly
                        setSavedWorkout_workouts(prev => prev.map(w =>
                            w._id === workoutId ? { ...w, isExercisesLoading: false, exercisesError: 'Workout details not found by API.' } : w
                        ));
                    } else {
                        // Unexpected response structure
                        setSavedWorkout_workouts(prev => prev.map(w =>
                            w._id === workoutId ? { ...w, isExercisesLoading: false, exercisesError: 'Failed to load exercises: Unexpected response format.' } : w
                        ));
                    }
                } catch (err) { // Network error or other client-side error during API call
                    console.error('Error fetching workout details on expand:', err);
                    setSavedWorkout_workouts(prev => prev.map(w =>
                        w._id === workoutId ? { ...w, isExercisesLoading: false, exercisesError: 'An error occurred while fetching exercises.' } : w
                    ));
                }
            }
        }
    };

    const savedWorkout_openDeleteDialog = (workoutId: string) => {
        setSavedWorkout_workoutToDeleteId(workoutId);
        setSavedWorkout_deleteDialogOpen(true);
    };

    const savedWorkout_handleDeleteWorkout = async () => {
        if (!savedWorkout_workoutToDeleteId) return;
        setSavedWorkout_isRemovingExercise(`${savedWorkout_workoutToDeleteId}_delete_action`);
        setError(null);
        setSavedWorkout_deleteDialogOpen(false);

        try {
            const response = await deleteSavedWorkoutApi({ workoutId: savedWorkout_workoutToDeleteId });
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to delete workout: ${(response.data as { error: string }).error}`);
            } else if (response.data?.success) {
                setSavedWorkout_workouts(prev => prev.filter(w => w._id !== savedWorkout_workoutToDeleteId));
                if (savedWorkout_expandedWorkoutId === savedWorkout_workoutToDeleteId) {
                    setSavedWorkout_expandedWorkoutId(null);
                }
                setSavedWorkout_successMessage('Workout deleted successfully!');
            } else {
                setSavedWorkout_error(response.data?.message || 'Failed to delete workout: No data returned or success false');
            }
        } catch (err) {
            console.error('Error deleting workout via API:', err);
            setSavedWorkout_error(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSavedWorkout_isRemovingExercise(null);
            setSavedWorkout_workoutToDeleteId(null);
            clearMessages();
        }
    };

    const savedWorkout_openRenameDialog = (workout: ClientWorkoutDisplay) => {
        setSavedWorkout_workoutToRename(workout);
        setSavedWorkout_renameDialogOpen(true);
    };

    const savedWorkout_handleRenameWorkout = async () => {
        if (!savedWorkout_workoutToRename || !savedWorkout_newWorkoutName.trim()) return;
        setSavedWorkout_isRenamingWorkoutId(savedWorkout_workoutToRename._id);
        setSavedWorkout_error(null);
        setSavedWorkout_successMessage(null);

        try {
            const response = await renameSavedWorkout({ workoutId: savedWorkout_workoutToRename._id, newName: savedWorkout_newWorkoutName.trim() });
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to rename workout: ${(response.data as { error: string }).error}`);
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data as ApiSavedWorkout;
                setSavedWorkout_workouts(prev => prev.map(w =>
                    w._id === updatedWorkoutFromServer._id.toString()
                        ? {
                            ...w,
                            name: updatedWorkoutFromServer.name,
                            updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(),
                        }
                        : w
                ));
                setSavedWorkout_successMessage('Workout renamed successfully!');
                setSavedWorkout_renameDialogOpen(false);
            } else {
                setSavedWorkout_error('Failed to rename workout: No data returned');
            }
        } catch (err) {
            console.error('Error renaming workout via API:', err);
            setSavedWorkout_error(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSavedWorkout_isRenamingWorkoutId(null);
            clearMessages();
        }
    };

    const savedWorkout_handleOpenAddExerciseDialog = async (targetWorkout: ClientWorkoutDisplay) => {
        setSavedWorkout_workoutToAddExerciseTo(targetWorkout);
        setSavedWorkout_searchTerm('');
        setSavedWorkout_dialogPlanContextError(null);
        setSavedWorkout_addExerciseDialogOpen(true);
        setSavedWorkout_isLoadingDialogExercises(true);
        setSavedWorkout_dialogExerciseList([]);

        const currentPlanId = planId;

        if (currentPlanId) {
            try {
                let definitionsToFilter = savedWorkout_allExerciseDefinitions.length > 0
                    ? savedWorkout_allExerciseDefinitions
                    : definitions.length > 0
                        ? definitions
                        : [];

                if (definitionsToFilter.length === 0) {
                    const defsResponse = await getAllExerciseDefinitionOptions();
                    if (defsResponse.data) {
                        setSavedWorkout_allExerciseDefinitions(defsResponse.data);
                        if (definitions.length === 0) setDefinitions(defsResponse.data);
                        definitionsToFilter = defsResponse.data;
                    } else {
                        setSavedWorkout_dialogPlanContextError('Could not load exercise definitions.');
                        setSavedWorkout_isLoadingDialogExercises(false);
                        return;
                    }
                }

                const planExerciseDefIds = new Set(existingExerciseDefinitionIdsInPlan);
                const filteredForPlanContext = definitionsToFilter.filter(def => planExerciseDefIds.has(def._id.toString()));

                if (filteredForPlanContext.length === 0) {
                    setSavedWorkout_dialogPlanContextError("No exercises from the current plan are available to add, or definitions mismatch.");
                } else {
                    setSavedWorkout_dialogExerciseList(filteredForPlanContext as ApiExerciseDefinition[]);
                }

            } catch (fetchErr) {
                console.error(`Error preparing exercise definitions for dialog:`, fetchErr);
                setSavedWorkout_dialogPlanContextError('Error loading exercise definitions for dialog.');
                const defsResponse = await getAllExerciseDefinitionOptions();
                if (defsResponse.data) setSavedWorkout_dialogExerciseList(defsResponse.data);
            }
        } else {
            console.warn('No planId context for adding exercise to workout. This should not happen here.');
            setSavedWorkout_dialogPlanContextError('Plan context is missing. Cannot determine available exercises.');
            const defsResponse = await getAllExerciseDefinitionOptions();
            if (defsResponse.data) setSavedWorkout_dialogExerciseList(defsResponse.data);
        }
        setSavedWorkout_isLoadingDialogExercises(false);
    };

    const savedWorkout_handleCloseAddExerciseDialog = () => {
        setSavedWorkout_addExerciseDialogOpen(false);
        setSavedWorkout_workoutToAddExerciseTo(null);
        setSavedWorkout_dialogExerciseList([]);
        setSavedWorkout_dialogPlanContextError(null);
    };

    const savedWorkout_handleConfirmAddExercise = async (definitionToAdd: ApiExerciseDefinition) => {
        if (!savedWorkout_workoutToAddExerciseTo) return;
        setSavedWorkout_isAddingSingleExercise(true);
        setSavedWorkout_error(null); setSavedWorkout_successMessage(null);
        try {
            const requestParams: AddExerciseToSavedWorkoutRequest = {
                workoutId: savedWorkout_workoutToAddExerciseTo._id.toString(),
                exerciseDefinitionId: definitionToAdd._id.toString(),
                sets: 3, reps: 10,
            };
            const response = await addExerciseToSavedWorkout(requestParams);
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to add exercise: ${(response.data as { error: string }).error}`);
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data as ApiSavedWorkoutWithExercises;
                setSavedWorkout_workouts(prev => prev.map(w => w._id === updatedWorkoutFromServer._id.toString() ? { ...w, name: updatedWorkoutFromServer.name, userId: updatedWorkoutFromServer.userId.toString(), trainingPlanId: updatedWorkoutFromServer.trainingPlanId.toString(), createdAt: new Date(updatedWorkoutFromServer.createdAt).toISOString(), updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(), exercises: updatedWorkoutFromServer.exercises.map((ex: ExerciseBase) => ex) } : w));
                setSavedWorkout_successMessage('Exercise added successfully!');
                savedWorkout_handleCloseAddExerciseDialog();
            } else {
                setSavedWorkout_error('Failed to add exercise: No data returned');
            }
        } catch (err) {
            console.error('Error adding exercise via API:', err);
            setSavedWorkout_error(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSavedWorkout_isAddingSingleExercise(false);
            clearMessages();
        }
    };

    const savedWorkout_handleRemoveExercise = async (workoutId: string, exerciseDefIdToRemove: string) => {
        const removingKey = `${workoutId}_${exerciseDefIdToRemove}`;
        setSavedWorkout_isRemovingExercise(removingKey);
        setSavedWorkout_error(null); setSavedWorkout_successMessage(null);
        try {
            const requestParams: RemoveExerciseFromSavedWorkoutRequest = { workoutId, exerciseDefinitionIdToRemove: exerciseDefIdToRemove };
            const response = await removeExerciseFromSavedWorkoutApi(requestParams);
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to remove exercise: ${(response.data as { error: string }).error}`);
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data as ApiSavedWorkoutWithExercises;
                setSavedWorkout_workouts(prev => prev.map(w => w._id === updatedWorkoutFromServer._id.toString() ? { ...w, name: updatedWorkoutFromServer.name, userId: updatedWorkoutFromServer.userId.toString(), trainingPlanId: updatedWorkoutFromServer.trainingPlanId.toString(), createdAt: new Date(updatedWorkoutFromServer.createdAt).toISOString(), updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(), exercises: updatedWorkoutFromServer.exercises.map((ex: ExerciseBase) => ex) } : w));
                setSavedWorkout_successMessage('Exercise removed successfully!');
            } else {
                setSavedWorkout_error('Failed to remove exercise: No data returned');
            }
        } catch (err) {
            console.error('Error removing exercise via API:', err);
            setSavedWorkout_error(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSavedWorkout_isRemovingExercise(null);
            clearMessages();
        }
    };

    const savedWorkout_filteredDefinitionsForDialog = useMemo(() => {
        if (savedWorkout_isLoadingDialogExercises) return [];
        return savedWorkout_dialogExerciseList.filter(def =>
            def.name.toLowerCase().includes(savedWorkout_searchTerm.toLowerCase())
        );
    }, [savedWorkout_dialogExerciseList, savedWorkout_searchTerm, savedWorkout_isLoadingDialogExercises]);

    const savedWorkout_handleStartWorkout = async (workoutId: string) => {
        try {
            const workout = savedWorkout_workouts.find(w => w._id === workoutId);
            if (!workout) {
                setSavedWorkout_error('Workout not found locally.');
                clearMessages();
                return;
            }

            const currentPlanId = workout.trainingPlanId; // This should be the planId from the route

            if (!workout.exercises || workout.exercises.length === 0) {
                // Fetch details if not already loaded (though they are loaded on expand)
                setSavedWorkout_workouts(prev => prev.map(w => w._id === workoutId ? { ...w, isExercisesLoading: true } : w));
                const response = await getSavedWorkoutDetails({ workoutId });
                setSavedWorkout_workouts(prev => prev.map(w => w._id === workoutId ? { ...w, isExercisesLoading: false } : w));

                if (response.data?.exercises && response.data.exercises.length > 0) {
                    const exercises = response.data.exercises;
                    const exerciseDefinitionIds = exercises.map((ex: ExerciseBase) => ex.exerciseDefinitionId.toString());

                    // Update local state with fetched exercises
                    setSavedWorkout_workouts(prev => prev.map(w =>
                        w._id === workoutId
                            ? { ...w, exercises: response.data?.exercises || [], exercisesError: null }
                            : w
                    ));

                    if (currentPlanId) {
                        const weekNumber = 1; // Default or derive if necessary
                        navigate(`/workout-page?planId=${currentPlanId}&week=${weekNumber}&exercises=${exerciseDefinitionIds.join(',')}`);
                    } else {
                        // Fallback if somehow planId is missing, though unlikely in this context
                        console.warn("Starting workout without trainingPlanId from current plan context. Navigating with exercise IDs only.")
                        navigate(`/workout-page?exercises=${exerciseDefinitionIds.join(',')}`);
                    }
                } else {
                    setSavedWorkout_error('Failed to load workout details or no exercises found to start.');
                    clearMessages();
                    return;
                }
            } else {
                // Exercises are already loaded (e.g., from expand)
                const exerciseDefinitionIds = workout.exercises.map((ex: ExerciseBase) => ex.exerciseDefinitionId.toString());
                if (currentPlanId) {
                    const weekNumber = 1; // Default or derive if necessary
                    navigate(`/workout-page?planId=${currentPlanId}&week=${weekNumber}&exercises=${exerciseDefinitionIds.join(',')}`);
                } else {
                    console.warn("Attempting to start workout without trainingPlanId on local workout. Navigating with exercise IDs only.")
                    navigate(`/workout-page?exercises=${exerciseDefinitionIds.join(',')}`);
                }
            }
        } catch (err) {
            console.error('Error starting workout:', err);
            setSavedWorkout_error('An error occurred while preparing the workout');
            clearMessages();
        }
    };

    const savedWorkout_handleOpenAddWorkoutDialog = () => {
        if (availableTrainingPlans.length === 0 && !isLoadingTrainingPlans) {
            fetchAvailableTrainingPlans();
        }
        setSavedWorkout_newWorkoutNameForAdd('');
        setSavedWorkout_addWorkoutError(null);
        setSavedWorkout_isAddWorkoutDialogOpen(true);
    };

    const savedWorkout_handleCloseAddWorkoutDialog = () => {
        setSavedWorkout_isAddWorkoutDialogOpen(false);
        setSavedWorkout_newWorkoutNameForAdd('');
        setSavedWorkout_addWorkoutError(null);
    };

    const savedWorkout_handleConfirmAddNewWorkout = async () => {
        if (!planId) {
            setSavedWorkout_addWorkoutError("Cannot create workout: Training Plan ID is missing.");
            return;
        }
        if (!savedWorkout_newWorkoutNameForAdd.trim()) {
            setSavedWorkout_addWorkoutError("Workout name cannot be empty.");
            return;
        }

        setSavedWorkout_isLoading(true);
        setSavedWorkout_addWorkoutError(null);
        setSavedWorkout_successMessage(null);

        try {
            const response = await createSavedWorkout({
                name: savedWorkout_newWorkoutNameForAdd.trim(),
                trainingPlanId: planId,
                exerciseIds: []
            });

            if (response.data && 'error' in response.data) {
                setSavedWorkout_addWorkoutError(`Failed to create workout: ${(response.data as { error: string }).error}`);
            } else if (response.data && '_id' in response.data) {
                setSavedWorkout_successMessage('Workout created successfully!');
                savedWorkout_handleCloseAddWorkoutDialog();
                await fetchSavedWorkoutsForPlan();
            } else {
                setSavedWorkout_addWorkoutError('Failed to create workout: No data returned or unexpected format');
            }
        } catch (err) {
            console.error('Error creating new workout:', err);
            setSavedWorkout_addWorkoutError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSavedWorkout_isLoading(false);
            clearMessages();
        }
    };

    if (!planId && !isLoading && currentTab === 0) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>
                <LoadingErrorDisplay isLoading={false} error={error} />
            </Box>
        );
    }
    if (!planId && !savedWorkout_isLoading && currentTab === 1) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Button onClick={() => navigate('/training-plans')} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                    {isMobile ? 'Back' : 'Back to Training Plans'}
                </Button>
                <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>
                <LoadingErrorDisplay isLoading={false} error={savedWorkout_error || "Training Plan ID is required to manage workouts."} />
            </Box>
        );
    }

    const pageTitle = (isLoading && currentTab === 0) || (savedWorkout_isLoading && currentTab === 1) || (!planDetails && isLoading)
        ? "Loading Plan Content..."
        : planDetails?.name
            ? `Manage: ${planDetails.name}`
            : error === 'Training plan not found.' || savedWorkout_error === 'Training Plan ID not found.'
                ? `Training Plan Not Found`
                : `Manage Plan: ${planId || 'Unknown'}`;

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
            </Stack>

            {savedWorkout_successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSavedWorkout_successMessage(null)}>
                    {savedWorkout_successMessage}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="Plan management tabs">
                    <Tab label="Exercises" />
                    <Tab label="Workouts" />
                </Tabs>
            </Box>

            {currentTab === 0 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenExerciseBrowser}
                            disabled={isLoading || !planDetails || !!error}
                        >
                            Add Exercise
                        </Button>
                    </Box>
                    <LoadingErrorDisplay isLoading={isLoading} error={error && error !== 'Training plan not found.' ? error : null} />
                    {!isLoading && planDetails && (!error || error === 'Training plan not found.') && (
                        <Box >
                            {exercises.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography sx={{ mb: 2 }}>
                                        No exercises found for this plan. Click &quot;Add Exercise&quot; above to get started.
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Stack spacing={2}>
                                        {exercises.map((exercise) => {
                                            const definition = definitionsMapMPE[exercise.exerciseDefinitionId.toString()];
                                            return (
                                                <ExerciseItemCard
                                                    key={exercise._id.toString()}
                                                    exercise={exercise}
                                                    definition={definition}
                                                    onRequestDelete={handleRequestDeleteExercise}
                                                    onEdit={handleOpenEditForm}
                                                    onDuplicate={handleDuplicateExercise}
                                                    isDeleting={deletingExerciseId === exercise._id.toString()}
                                                    isDuplicating={duplicatingExerciseId === exercise._id.toString()}
                                                />
                                            );
                                        })}
                                    </Stack>
                                </>
                            )}
                        </Box>
                    )}
                </>
            )}

            {currentTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={savedWorkout_handleOpenAddWorkoutDialog}
                            disabled={savedWorkout_isLoading || !planDetails || !!savedWorkout_error}
                            color="secondary"
                        >
                            Add Workout
                        </Button>
                    </Box>
                    <LoadingErrorDisplay isLoading={savedWorkout_isLoading} error={savedWorkout_error} />
                    {!savedWorkout_isLoading && !savedWorkout_error && savedWorkout_workouts.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ mb: 2 }}>
                                No saved workouts found for this plan. Click &quot;Add Workout&quot; above to get started.
                            </Typography>
                        </Box>
                    )}
                    {!savedWorkout_isLoading && !savedWorkout_error && savedWorkout_workouts.length > 0 && (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' }, gap: 2.5 }}>
                                {savedWorkout_workouts.map((workout) => (
                                    <Paper key={workout._id} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, display: 'flex', flexDirection: 'column' }}>
                                        <Box onClick={() => savedWorkout_handleToggleExpand(workout._id)}
                                            sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', bgcolor: alpha(theme.palette.primary.main, 0.08), borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                                            <Typography variant="h6" component="h2" sx={{ fontWeight: '600', color: theme.palette.primary.main, flexGrow: 1, fontSize: '1.1rem' }}>{workout.name}</Typography>
                                            <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
                                                {savedWorkout_expandedWorkoutId === workout._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ p: 2, flexGrow: 1 }}>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontSize: '0.75rem' }}>Created: {new Date(workout.createdAt).toLocaleDateString()}</Typography>
                                            {workout.exercises && workout.exercises.length > 0 && (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                                    {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Collapse in={savedWorkout_expandedWorkoutId === workout._id} timeout="auto" unmountOnExit sx={{ px: 0 }}>
                                            <Divider sx={{ mx: 0, bgcolor: alpha(theme.palette.primary.main, 0.15) }} />
                                            <Box sx={{ p: 2 }}>
                                                {workout.isExercisesLoading ? (<Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} sx={{ color: theme.palette.primary.main }} /></Box>
                                                ) : workout.exercisesError ? (<Typography color="error" sx={{ my: 1, fontSize: '0.875rem' }}>{workout.exercisesError}</Typography>
                                                ) : workout.exercises && workout.exercises.length > 0 ? (
                                                    <List dense disablePadding sx={{ mb: 1 }}>
                                                        {workout.exercises.map((exercise, index) => {
                                                            const definition = savedWorkout_exerciseDefinitionMap.get(exercise.exerciseDefinitionId.toString());
                                                            return (
                                                                <ListItem key={`${workout._id}-${exercise.exerciseDefinitionId.toString()}-${index}`} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.04), mb: 1, borderRadius: '8px', p: 1, border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`, minHeight: '50px' }}
                                                                    secondaryAction={
                                                                        <IconButton edge="end" aria-label="remove exercise" onClick={() => savedWorkout_handleRemoveExercise(workout._id, exercise.exerciseDefinitionId.toString())} size="small" sx={{ color: alpha(theme.palette.error.main, 0.7), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }} disabled={savedWorkout_isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}`}>
                                                                            {savedWorkout_isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}` ? <CircularProgress size={18} color="inherit" /> : <RemoveCircleOutlineIcon fontSize="small" />}
                                                                        </IconButton>
                                                                    }>
                                                                    <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                        {definition?.imageUrl ? <Avatar src={definition.imageUrl} variant="rounded" sx={{ width: 36, height: 36 }}><BrokenImageIcon /></Avatar> : <Avatar variant="rounded" sx={{ width: 36, height: 36 }}><FitnessCenterIcon /></Avatar>}
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={definition?.name || `Exercise ${index + 1}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} secondary={exercise.sets && exercise.reps && exercise.sets > 0 && exercise.reps > 0 ? `${exercise.sets} sets x ${exercise.reps} reps` : 'Sets/Reps not specified'} secondaryTypographyProps={{ variant: 'caption' }} />
                                                                </ListItem>
                                                            );
                                                        })}
                                                    </List>
                                                ) : (<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2, fontStyle: 'italic' }}>No exercises in this workout.</Typography>)}
                                            </Box>
                                        </Collapse>
                                        <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`, mt: 'auto' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                                <IconButton title="Start Workout" sx={{ color: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }} onClick={() => savedWorkout_handleStartWorkout(workout._id)}><PlayArrowIcon /></IconButton>
                                                <Box>
                                                    <IconButton title="Add Exercise to Workout" sx={{ color: theme.palette.secondary.main, '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) } }} onClick={() => savedWorkout_handleOpenAddExerciseDialog(workout)}><AddCircleOutlineIcon /></IconButton>
                                                    <IconButton title="Rename Workout" sx={{ color: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }} onClick={() => savedWorkout_openRenameDialog(workout)}><EditIcon /></IconButton>
                                                    <IconButton title="Delete Workout" sx={{ color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }} onClick={() => savedWorkout_openDeleteDialog(workout._id)}><DeleteIcon /></IconButton>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {planId && currentTab === 0 && (
                <>
                    <ExerciseFormDialog
                        open={isExerciseBrowserOpen}
                        onClose={handleBrowserDialogClose}
                        onExerciseSelect={handleExerciseSelectFromBrowser}
                        existingExerciseDefinitionIds={existingExerciseDefinitionIdsInPlan}
                    />
                    {(selectedDefinitionForDetails || exerciseBeingEdited) && (
                        <ExerciseDetailsDialog
                            open={isExerciseDetailsDialogOpen}
                            onClose={handleDetailsDialogClose}
                            onSave={handleDetailsDialogSave}
                            planId={planId}
                            exerciseDefinition={selectedDefinitionForDetails}
                            exerciseToEdit={exerciseBeingEdited}
                        />
                    )}
                    {exercisePendingDeletion && (
                        <ConfirmDeleteDialog
                            open={isConfirmDeleteExerciseDialogOpen}
                            onClose={handleConfirmDeleteExerciseDialogClose}
                            onConfirm={executeDeleteExercise}
                            itemName={definitionsMapMPE[exercisePendingDeletion.exerciseDefinitionId.toString()]?.name || `ID: ${exercisePendingDeletion._id.toString()}`}
                            itemType="exercise"
                        />
                    )}
                </>
            )}

            {currentTab === 1 && (
                <>
                    <Dialog open={savedWorkout_deleteDialogOpen} onClose={() => setSavedWorkout_deleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
                        <DialogTitle sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, fontWeight: 'bold' }}>Confirm Delete Workout</DialogTitle>
                        <DialogContent sx={{ pt: '20px !important' }}><DialogContentText>Are you sure you want to delete this workout? This action cannot be undone.</DialogContentText></DialogContent>
                        <MuiDialogActions sx={{ p: 2 }}><Button onClick={() => setSavedWorkout_deleteDialogOpen(false)} sx={{ color: alpha('#000000', 0.7) }}>Cancel</Button><Button onClick={savedWorkout_handleDeleteWorkout} sx={{ color: 'white', bgcolor: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.8) } }}>Delete</Button></MuiDialogActions>
                    </Dialog>
                    <Dialog open={savedWorkout_renameDialogOpen} onClose={() => setSavedWorkout_renameDialogOpen(false)} PaperProps={{ sx: { borderRadius: 2, minWidth: '300px' } }}>
                        <DialogTitle sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, fontWeight: 'bold' }}>Rename Workout</DialogTitle>
                        <DialogContent sx={{ pt: '20px !important' }}><TextField autoFocus margin="dense" label="Workout Name" type="text" fullWidth variant="outlined" value={savedWorkout_newWorkoutName} onChange={(e) => setSavedWorkout_newWorkoutName(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); savedWorkout_handleRenameWorkout(); } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} /></DialogContent>
                        <MuiDialogActions sx={{ p: 2 }}><Button onClick={() => setSavedWorkout_renameDialogOpen(false)} sx={{ color: alpha('#000000', 0.7) }} disabled={!!savedWorkout_isRenamingWorkoutId}>Cancel</Button><Button onClick={savedWorkout_handleRenameWorkout} sx={{ color: 'white', bgcolor: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.8) }, borderRadius: '8px' }} disabled={!!savedWorkout_isRenamingWorkoutId || !savedWorkout_newWorkoutName.trim() || savedWorkout_newWorkoutName.trim() === savedWorkout_workoutToRename?.name}>{savedWorkout_isRenamingWorkoutId === savedWorkout_workoutToRename?._id ? <CircularProgress size={24} color="inherit" /> : 'Rename'}</Button></MuiDialogActions>
                    </Dialog>

                    <Dialog open={savedWorkout_addExerciseDialogOpen} onClose={savedWorkout_handleCloseAddExerciseDialog} fullWidth maxWidth="sm" PaperProps={{ sx: { height: '80vh', borderRadius: '12px' } }}>
                        <AppBar sx={{ position: 'relative', bgcolor: alpha(theme.palette.success.light, 0.1), boxShadow: 'none' }}>
                            <Toolbar>
                                <Typography sx={{ ml: 2, flex: 1, color: theme.palette.success.dark, fontWeight: 'bold' }} variant="h6" component="div">Add Exercise to {savedWorkout_workoutToAddExerciseTo?.name || 'Workout'}</Typography>
                                <IconButton edge="end" color="inherit" onClick={savedWorkout_handleCloseAddExerciseDialog} aria-label="close" sx={{ color: theme.palette.success.dark }}><CloseIcon /></IconButton>
                            </Toolbar>
                        </AppBar>
                        <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <TextField fullWidth variant="outlined" placeholder="Search exercises..." value={savedWorkout_searchTerm} onChange={(e) => setSavedWorkout_searchTerm(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: alpha(theme.palette.success.dark, 0.8) }} /></InputAdornment>), }}
                            />
                            {savedWorkout_isLoadingDialogExercises ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress sx={{ color: theme.palette.success.main }} /></Box>
                            ) : savedWorkout_dialogPlanContextError ? (
                                <Typography sx={{ textAlign: 'center', mt: 2, color: alpha(theme.palette.error.main, 0.9) }}>{savedWorkout_dialogPlanContextError}</Typography>
                            ) : savedWorkout_filteredDefinitionsForDialog.length === 0 ? (
                                <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#000000', 0.7) }}>No exercises found.</Typography>
                            ) : (
                                <List dense sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                    {savedWorkout_filteredDefinitionsForDialog.map((def) => (
                                        <ListItemButton key={def._id.toString()} onClick={() => savedWorkout_handleConfirmAddExercise(def)} disabled={savedWorkout_isAddingSingleExercise || Boolean(savedWorkout_workoutToAddExerciseTo && savedWorkout_workoutToAddExerciseTo.exercises?.some(ex => ex.exerciseDefinitionId.toString() === def._id.toString()))} sx={{ mb: 0.5, borderRadius: '8px' }}>
                                            {savedWorkout_isAddingSingleExercise && <CircularProgress size={20} sx={{ mr: 1 }} />}
                                            <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                {def.imageUrl ? <Avatar src={def.imageUrl} variant="rounded" sx={{ width: 36, height: 36 }}><BrokenImageIcon /></Avatar> : <Avatar variant="rounded" sx={{ width: 36, height: 36 }}><FitnessCenterIcon /></Avatar>}
                                            </ListItemIcon>
                                            <ListItemText primary={def.name} primaryTypographyProps={{ fontWeight: 500 }} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={savedWorkout_isAddWorkoutDialogOpen} onClose={savedWorkout_handleCloseAddWorkoutDialog} PaperProps={{ sx: { borderRadius: 2, minWidth: '300px' } }}>
                        <DialogTitle sx={{ bgcolor: alpha(theme.palette.success.light, 0.1), color: theme.palette.success.dark, fontWeight: 'bold' }}>
                            Add New Workout to {planDetails?.name || 'Current Plan'}
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
                                value={savedWorkout_newWorkoutNameForAdd}
                                onChange={(e) => setSavedWorkout_newWorkoutNameForAdd(e.target.value)}
                                error={!!savedWorkout_addWorkoutError}
                                helperText={savedWorkout_addWorkoutError}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        savedWorkout_handleConfirmAddNewWorkout();
                                    }
                                }}
                            />
                        </DialogContent>
                        <MuiDialogActions sx={{ p: 2 }}>
                            <Button onClick={savedWorkout_handleCloseAddWorkoutDialog} sx={{ color: alpha('#000000', 0.7) }} disabled={savedWorkout_isLoading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={savedWorkout_handleConfirmAddNewWorkout}
                                sx={{ color: 'white', bgcolor: theme.palette.success.main, '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.8) }, borderRadius: '8px' }}
                                disabled={savedWorkout_isLoading || !savedWorkout_newWorkoutNameForAdd.trim()}
                            >
                                {savedWorkout_isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Workout'}
                            </Button>
                        </MuiDialogActions>
                    </Dialog>
                </>
            )}
        </Box>
    );
}; 