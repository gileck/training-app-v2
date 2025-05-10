import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Collapse,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    alpha,
    Divider,
    ListItemButton,
    AppBar,
    Toolbar,
    InputAdornment,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemAvatar,
    FormHelperText,
    SelectChangeEvent,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
import {
    getAllSavedWorkouts,
    deleteSavedWorkout,
    getSavedWorkoutDetails,
    createSavedWorkout,
    addExerciseToSavedWorkout,
    removeExerciseFromSavedWorkout,
    renameSavedWorkout
} from '@/apis/savedWorkouts/client';
import type {
    SavedWorkout as ApiSavedWorkout,
    SavedWorkoutWithExercises as ApiSavedWorkoutWithExercises,
    AddExerciseToSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutRequest,
    RenameSavedWorkoutRequest
} from '@/apis/savedWorkouts/types';
import type { ExerciseBase } from '@/apis/exercises/types';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import { getExercises } from '@/apis/exercises/client';
import type { ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import { getAllTrainingPlans } from '@/apis/trainingPlans/client';
import type { TrainingPlan as ApiTrainingPlan } from '@/apis/trainingPlans/types';
import AddIcon from '@mui/icons-material/Add';

// --- Color constants for the light theme (inspired by NeonLightWorkoutView) --- //
const LIGHT_BG = '#FFFFFF'; // Or a very light gray like '#F5F5F7';
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
// const NEON_PINK = '#D500F9';

// Updated local interface to reflect API changes
// No longer needs derivedTrainingPlanId, will use trainingPlanId from ApiSavedWorkoutWithExercises
interface ClientWorkoutDisplay extends Omit<ApiSavedWorkoutWithExercises, '_id' | 'userId' | 'trainingPlanId' | 'createdAt' | 'updatedAt'> {
    _id: string; // Keep as string for client-side keying if needed
    userId: string;
    trainingPlanId: string; // Now directly from API
    createdAt: string; // Dates as strings for easier state management
    updatedAt: string;
    // exercises?: ExerciseBase[]; // This comes from ApiSavedWorkoutWithExercises
    isExercisesLoading?: boolean;
    exercisesError?: string | null;
}

export const ManageWorkouts: React.FC = () => {
    const { navigate } = useRouter();
    const [workouts, setWorkouts] = useState<ClientWorkoutDisplay[]>([]); // Use updated type
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // New state for success messages
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [workoutToRename, setWorkoutToRename] = useState<ClientWorkoutDisplay | null>(null); // Use updated type
    const [newWorkoutName, setNewWorkoutName] = useState('');
    // const [originalName, setOriginalName] = useState(''); // Commented out due to lint error
    const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

    const [allExerciseDefinitions, setAllExerciseDefinitions] = useState<ApiExerciseDefinition[]>([]);
    const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(true);

    const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
    const [workoutToAddExerciseTo, setWorkoutToAddExerciseTo] = useState<ClientWorkoutDisplay | null>(null); // Use updated type
    const [searchTerm, setSearchTerm] = useState('');
    const [dialogExerciseList, setDialogExerciseList] = useState<ApiExerciseDefinition[]>([]);
    const [isLoadingDialogExercises, setIsLoadingDialogExercises] = useState(false);
    const [dialogPlanContextError, setDialogPlanContextError] = useState<string | null>(null);

    // New state variables for Add Workout dialog
    const [isAddWorkoutDialogOpen, setIsAddWorkoutDialogOpen] = useState(false);
    const [newWorkoutNameForAdd, setNewWorkoutNameForAdd] = useState('');
    const [availableTrainingPlans, setAvailableTrainingPlans] = useState<ApiTrainingPlan[]>([]);
    const [selectedTrainingPlanIdForNewWorkout, setSelectedTrainingPlanIdForNewWorkout] = useState<string>('');
    const [exercisesForNewWorkoutDialog, setExercisesForNewWorkoutDialog] = useState<ExerciseBase[]>([]);
    const [selectedExerciseIdsForNewWorkout, setSelectedExerciseIdsForNewWorkout] = useState<string[]>([]);
    const [isLoadingTrainingPlans, setIsLoadingTrainingPlans] = useState(false);
    const [isLoadingExercisesForNewWorkout, setIsLoadingExercisesForNewWorkout] = useState(false);
    const [addWorkoutError, setAddWorkoutError] = useState<string | null>(null);
    const [isAddingSingleExercise, setIsAddingSingleExercise] = useState(false);
    const [isRemovingExercise, setIsRemovingExercise] = useState<string | null>(null); // workoutId_exerciseDefId
    const [isRenamingWorkoutId, setIsRenamingWorkoutId] = useState<string | null>(null);

    const exerciseDefinitionMap = useMemo(() => {
        const map = new Map<string, ApiExerciseDefinition>();
        allExerciseDefinitions.forEach(def => {
            map.set(def._id.toString(), def);
        });
        return map;
    }, [allExerciseDefinitions]);

    // Function to clear messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setError(null);
            setSuccessMessage(null);
        }, 5000); // Clear after 5 seconds
    };

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setIsLoadingDefinitions(true);
        setError(null);
        setSuccessMessage(null); // Clear success message on new data load
        try {
            const [workoutsResponse, definitionsResponse] = await Promise.all([
                getAllSavedWorkouts({}),
                getAllExerciseDefinitionOptions()
            ]);

            if (workoutsResponse.data) {
                // Map API response to client state type
                const mappedWorkouts = workoutsResponse.data.map((w: ApiSavedWorkout) => {
                    // Handle date conversion safely - dates might be strings, Date objects, or timestamps
                    const formatDate = (dateValue: string | number | Date | null | undefined): string => {
                        if (!dateValue) return new Date().toISOString();

                        if (dateValue instanceof Date) {
                            return dateValue.toISOString();
                        }

                        if (typeof dateValue === 'string') {
                            try {
                                return new Date(dateValue).toISOString();
                            } catch {
                                console.warn('Invalid date string:', dateValue);
                                return new Date().toISOString();
                            }
                        }

                        if (typeof dateValue === 'number') {
                            return new Date(dateValue).toISOString();
                        }
                        return new Date().toISOString();
                    };

                    if (!w || !w._id || !w.userId || !w.trainingPlanId) {
                        console.warn('Received malformed workout data from API, skipping:', w);
                        return null; // Mark for filtering
                    }

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
                }).filter(Boolean) as ClientWorkoutDisplay[]; // Filter out nulls
                setWorkouts(mappedWorkouts);
            } else {
                setError('Failed to load saved workouts');
            }

            if (definitionsResponse.data) {
                setAllExerciseDefinitions(definitionsResponse.data);
            } else {
                setError(prevError => prevError ? `${prevError}, Failed to load exercise definitions` : 'Failed to load exercise definitions');
            }

        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('An error occurred while loading page data');
        } finally {
            setIsLoading(false);
            setIsLoadingDefinitions(false);
        }
    }, []);

    // Function to fetch available training plans
    const fetchTrainingPlans = async () => {
        setIsLoadingTrainingPlans(true);
        try {
            const response = await getAllTrainingPlans();
            if (response.data && Array.isArray(response.data)) {
                setAvailableTrainingPlans(response.data);
            } else if (response.data && 'error' in response.data) {
                console.error('Error fetching training plans:', response.data.error);
                setAddWorkoutError(`Failed to load training plans: ${response.data.error}`);
            }
        } catch (err) {
            console.error('Error fetching training plans:', err);
            setAddWorkoutError('An error occurred while loading training plans');
        } finally {
            setIsLoadingTrainingPlans(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        fetchTrainingPlans(); // Fetch training plans when component mounts
    }, [fetchInitialData, fetchTrainingPlans]);

    const handleToggleExpand = async (workoutId: string) => {
        const isExpanding = expandedWorkoutId !== workoutId;
        setExpandedWorkoutId(isExpanding ? workoutId : null);

        if (isExpanding) {
            const workoutIndex = workouts.findIndex(w => w._id === workoutId);
            if (workoutIndex === -1) return;

            const currentWorkout = workouts[workoutIndex];
            // No need to derive trainingPlanId here, it's already on currentWorkout.trainingPlanId

            if (!currentWorkout.exercises?.length && !currentWorkout.isExercisesLoading) {
                setWorkouts(prev => prev.map(w => w._id === workoutId ? { ...w, isExercisesLoading: true, exercisesError: null } : w));
                try {
                    const response = await getSavedWorkoutDetails({ workoutId }); // API returns SavedWorkoutWithExercises
                    if (response.data && Array.isArray(response.data.exercises)) {
                        const fetchedExercises = response.data.exercises;
                        // trainingPlanId on response.data should match currentWorkout.trainingPlanId
                        setWorkouts(prev => prev.map(w => w._id === workoutId ? {
                            ...w,
                            exercises: fetchedExercises,
                            isExercisesLoading: false,
                            // trainingPlanId is already set from initial load
                        } : w));
                    } else {
                        setWorkouts(prev => prev.map(w => w._id === workoutId ? { ...w, exercisesError: 'Failed to load exercises', isExercisesLoading: false } : w));
                    }
                } catch (err) {
                    console.error(`Error fetching exercises for workout ${workoutId}:`, err);
                    setWorkouts(prev => prev.map(w => w._id === workoutId ? { ...w, exercisesError: 'Error loading exercises', isExercisesLoading: false } : w));
                }
            }
        }
    };

    const handleDeleteWorkout = async () => {
        if (!workoutToDelete) return;
        try {
            const response = await deleteSavedWorkout({ workoutId: workoutToDelete });
            if (response.data?.success) {
                setWorkouts(prevWorkouts => prevWorkouts.filter(w => w._id !== workoutToDelete));
                if (expandedWorkoutId === workoutToDelete) {
                    setExpandedWorkoutId(null);
                }
            } else {
                setError(response.data?.message || 'Failed to delete workout');
            }
        } catch (err) {
            console.error('Error deleting workout:', err);
            setError('An error occurred while deleting the workout');
        } finally {
            setWorkoutToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    const openDeleteDialog = (workoutId: string) => {
        setWorkoutToDelete(workoutId);
        setDeleteDialogOpen(true);
    };

    const openRenameDialog = (workout: ClientWorkoutDisplay) => {
        setWorkoutToRename(workout);
        setNewWorkoutName(workout.name);
        // setOriginalName(workout.name); // Commented out as originalName state is commented
        setRenameDialogOpen(true);
    };

    const handleRenameWorkout = async () => {
        if (!workoutToRename || !newWorkoutName.trim()) return;

        setIsRenamingWorkoutId(workoutToRename._id);
        setError(null);
        setSuccessMessage(null);

        try {
            const requestParams: RenameSavedWorkoutRequest = {
                workoutId: workoutToRename._id,
                newName: newWorkoutName.trim(),
            };
            const response = await renameSavedWorkout(requestParams);

            if (response.data && 'error' in response.data) {
                setError(`Failed to rename workout: ${response.data.error}`);
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data;
                setWorkouts(prevWorkouts =>
                    prevWorkouts.map(w =>
                        w._id === updatedWorkoutFromServer._id.toString()
                            ? {
                                ...w,
                                name: updatedWorkoutFromServer.name,
                                updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(),
                                trainingPlanId: updatedWorkoutFromServer.trainingPlanId.toString(),
                                userId: updatedWorkoutFromServer.userId.toString(),
                                createdAt: new Date(updatedWorkoutFromServer.createdAt).toISOString(),
                            }
                            : w
                    )
                );
                setSuccessMessage('Workout renamed successfully!');
                setRenameDialogOpen(false);
            } else {
                setError('Failed to rename workout: No data returned');
            }
        } catch (err) {
            console.error('Error renaming workout via API:', err);
            setError(`An error occurred while renaming workout: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsRenamingWorkoutId(null);
            clearMessages();
        }
    };

    const handleOpenAddExerciseDialog = async (targetWorkout: ClientWorkoutDisplay) => {
        setWorkoutToAddExerciseTo(targetWorkout);
        setSearchTerm('');
        setDialogPlanContextError(null);
        setAddExerciseDialogOpen(true);
        setIsLoadingDialogExercises(true);
        setDialogExerciseList([]);

        const planIdToFilterBy = targetWorkout.trainingPlanId; // Use direct trainingPlanId

        if (planIdToFilterBy) {
            try {
                console.log(`Fetching exercises for plan context: ${planIdToFilterBy}`);
                const response = await getExercises({ trainingPlanId: planIdToFilterBy });

                if (response.data && response.data.length > 0) {
                    const exercisesFromPlan = response.data;
                    const definitionsForDialog: ApiExerciseDefinition[] = [];
                    exercisesFromPlan.forEach(exBase => {
                        const def = exerciseDefinitionMap.get(exBase.exerciseDefinitionId.toString());
                        if (def && !definitionsForDialog.some(d => d._id.toString() === def._id.toString())) {
                            definitionsForDialog.push(def);
                        }
                    });
                    if (definitionsForDialog.length > 0) {
                        setDialogExerciseList(definitionsForDialog);
                    } else {
                        setDialogPlanContextError('No relevant exercise definitions found for this workout\'s plan. Showing all.');
                        setDialogExerciseList(allExerciseDefinitions);
                    }
                } else {
                    setDialogPlanContextError('No exercises found for this plan. Showing all available exercises.');
                    setDialogExerciseList(allExerciseDefinitions);
                }
            } catch (fetchErr) {
                console.error(`Error fetching exercises for plan context ${planIdToFilterBy}:`, fetchErr);
                setDialogPlanContextError('Error loading plan exercises. Showing all available exercises.');
                setDialogExerciseList(allExerciseDefinitions);
            }
        } else {
            console.log('No trainingPlanId for workout. Showing all definitions.');
            setDialogExerciseList(allExerciseDefinitions);
        }
        setIsLoadingDialogExercises(false);
    };

    const handleCloseAddExerciseDialog = () => {
        setAddExerciseDialogOpen(false);
        setWorkoutToAddExerciseTo(null);
        setDialogExerciseList([]); // Clear list
        setDialogPlanContextError(null);
    };

    const handleConfirmAddExercise = async (definitionToAdd: ApiExerciseDefinition) => {
        if (!workoutToAddExerciseTo) return;
        setIsAddingSingleExercise(true); // Start loader
        setError(null); // Clear previous main errors
        setSuccessMessage(null);

        try {
            const requestParams: AddExerciseToSavedWorkoutRequest = {
                workoutId: workoutToAddExerciseTo._id.toString(),
                exerciseDefinitionId: definitionToAdd._id.toString(),
                sets: 3,
                reps: 10,
            };
            const response = await addExerciseToSavedWorkout(requestParams);
            if (response.data && 'error' in response.data) {
                setError(`Failed to add exercise: ${response.data.error}`);
                clearMessages();
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data as ApiSavedWorkoutWithExercises; // Ensure type
                setWorkouts(prevWorkouts =>
                    prevWorkouts.map(w =>
                        w._id === updatedWorkoutFromServer._id.toString()
                            ? {
                                ...w, // Keep existing client-side computed fields
                                name: updatedWorkoutFromServer.name,
                                userId: updatedWorkoutFromServer.userId.toString(),
                                trainingPlanId: updatedWorkoutFromServer.trainingPlanId.toString(),
                                createdAt: new Date(updatedWorkoutFromServer.createdAt).toISOString(),
                                updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(),
                                exercises: updatedWorkoutFromServer.exercises.map((ex: ExerciseBase) => ex) // Direct map
                            }
                            : w
                    )
                );
                setSuccessMessage('Exercise added successfully!');
                clearMessages();
                handleCloseAddExerciseDialog();
            } else {
                setError('Failed to add exercise: No data returned');
                clearMessages();
            }
        } catch (err) {
            console.error('Error adding exercise via API:', err);
            setError(`An error occurred while adding the exercise: ${err instanceof Error ? err.message : String(err)}`);
            clearMessages();
        } finally {
            setIsAddingSingleExercise(false); // Stop loader
        }
    };

    const handleRemoveExercise = async (workoutId: string, exerciseDefIdToRemove: string) => {
        const removingKey = `${workoutId}_${exerciseDefIdToRemove}`;
        setIsRemovingExercise(removingKey);
        setError(null);
        setSuccessMessage(null);

        try {
            const requestParams: RemoveExerciseFromSavedWorkoutRequest = {
                workoutId,
                exerciseDefinitionIdToRemove: exerciseDefIdToRemove,
            };
            const response = await removeExerciseFromSavedWorkout(requestParams);

            if (response.data && 'error' in response.data) {
                setError(`Failed to remove exercise: ${response.data.error}`);
            } else if (response.data) {
                const updatedWorkoutFromServer = response.data as ApiSavedWorkoutWithExercises; // Ensure type
                setWorkouts(prevWorkouts =>
                    prevWorkouts.map(w =>
                        w._id === updatedWorkoutFromServer._id.toString()
                            ? {
                                ...w, // Keep existing client-side computed fields like isExercisesLoading
                                name: updatedWorkoutFromServer.name,
                                userId: updatedWorkoutFromServer.userId.toString(),
                                trainingPlanId: updatedWorkoutFromServer.trainingPlanId.toString(),
                                createdAt: new Date(updatedWorkoutFromServer.createdAt).toISOString(),
                                updatedAt: new Date(updatedWorkoutFromServer.updatedAt).toISOString(),
                                exercises: updatedWorkoutFromServer.exercises.map((ex: ExerciseBase) => ex) // Direct map if types match
                            }
                            : w
                    )
                );
                setSuccessMessage('Exercise removed successfully!');
            } else {
                setError('Failed to remove exercise: No data returned');
            }
        } catch (err) {
            console.error('Error removing exercise via API:', err);
            setError(`An error occurred while removing the exercise: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsRemovingExercise(null);
            clearMessages(); // Clear messages after action
        }
    };

    const handleStartWorkout = async (workoutId: string) => {
        try {
            const workout = workouts.find(w => w._id === workoutId);
            if (!workout) {
                setError('Workout not found locally.');
                return;
            }

            const planId = workout.trainingPlanId; // Use direct trainingPlanId

            if (!workout.exercises || workout.exercises.length === 0) {
                const response = await getSavedWorkoutDetails({ workoutId });
                if (response.data && response.data.exercises && response.data.exercises.length > 0) {
                    const exercises = response.data.exercises;
                    const exerciseIds = exercises.map((ex: ExerciseBase) => ex.exerciseDefinitionId.toString());
                    // Assuming response.data.trainingPlanId is the correct planId from server
                    const serverPlanId = response.data.trainingPlanId.toString();
                    if (serverPlanId) {
                        const weekNumber = 1;
                        navigate(`/workout-page?planId=${serverPlanId}&week=${weekNumber}&exercises=${exerciseIds.join(',')}`);
                    } else {
                        console.warn("Starting workout without trainingPlanId from details. Navigating with exercise IDs only.")
                        navigate(`/workout-page?exercises=${exerciseIds.join(',')}`);
                    }
                } else {
                    setError('Failed to load workout details or no exercises found.');
                    return;
                }
            } else {
                const exercises = workout.exercises;
                const exerciseIds = exercises.map((ex: ExerciseBase) => ex.exerciseDefinitionId.toString());
                if (planId) {
                    const weekNumber = 1;
                    navigate(`/workout-page?planId=${planId}&week=${weekNumber}&exercises=${exerciseIds.join(',')}`);
                } else {
                    console.warn("Attempting to start workout without trainingPlanId on local workout. Navigating with exercise IDs only.")
                    navigate(`/workout-page?exercises=${exerciseIds.join(',')}`);
                }
            }
        } catch (err) {
            console.error('Error starting workout:', err);
            setError('An error occurred while starting the workout');
        }
    };

    const filteredDefinitionsForDialog = useMemo(() => {
        if (isLoadingDialogExercises) return []; // Show loading state in dialog
        return dialogExerciseList.filter(def =>
            def.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [dialogExerciseList, searchTerm, isLoadingDialogExercises]);

    // Handler functions for Add Workout dialog
    const handleOpenAddWorkoutDialog = () => {
        setIsAddWorkoutDialogOpen(true);
        setNewWorkoutNameForAdd('');
        setSelectedTrainingPlanIdForNewWorkout('');
        setExercisesForNewWorkoutDialog([]);
        setSelectedExerciseIdsForNewWorkout([]);
        setAddWorkoutError(null);

        // If we don't have training plans yet, fetch them
        if (availableTrainingPlans.length === 0 && !isLoadingTrainingPlans) {
            fetchTrainingPlans();
        }
    };

    const handleCloseAddWorkoutDialog = () => {
        setIsAddWorkoutDialogOpen(false);
    };

    const handleTrainingPlanChange = async (event: SelectChangeEvent<string>) => {
        const planId = event.target.value;
        setSelectedTrainingPlanIdForNewWorkout(planId);
        setSelectedExerciseIdsForNewWorkout([]); // Reset selection when plan changes

        if (!planId) {
            setExercisesForNewWorkoutDialog([]);
            return;
        }

        setIsLoadingExercisesForNewWorkout(true);
        try {
            const response = await getExercises({ trainingPlanId: planId });
            if (response.data && Array.isArray(response.data)) {
                setExercisesForNewWorkoutDialog(response.data);
            } else {
                setAddWorkoutError('Failed to load exercises for this training plan');
                setExercisesForNewWorkoutDialog([]);
            }
        } catch (err) {
            console.error('Error fetching exercises for plan:', err);
            setAddWorkoutError('An error occurred while loading exercises');
            setExercisesForNewWorkoutDialog([]);
        } finally {
            setIsLoadingExercisesForNewWorkout(false);
        }
    };

    const handleToggleExerciseForNewWorkout = (exerciseId: string) => {
        setSelectedExerciseIdsForNewWorkout(prev => {
            if (prev.includes(exerciseId)) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    };

    const handleConfirmAddNewWorkout = async () => {
        // Validate
        if (!newWorkoutNameForAdd.trim()) {
            setAddWorkoutError('Please enter a workout name');
            return;
        }
        if (!selectedTrainingPlanIdForNewWorkout) {
            setAddWorkoutError('Please select a training plan');
            return;
        }
        if (selectedExerciseIdsForNewWorkout.length === 0) {
            setAddWorkoutError('Please select at least one exercise');
            return;
        }
        setAddWorkoutError(null); // Clear previous dialog error

        try {
            const response = await createSavedWorkout({
                name: newWorkoutNameForAdd.trim(),
                exerciseIds: selectedExerciseIdsForNewWorkout,
                trainingPlanId: selectedTrainingPlanIdForNewWorkout
            });

            if (response.data && 'error' in response.data) {
                setAddWorkoutError(response.data.error);
                return;
            }

            // Success - close dialog, refresh workouts list
            handleCloseAddWorkoutDialog();
            fetchInitialData(); // Refresh the workouts list
            setSuccessMessage('Workout created successfully'); // Use main success message state
            clearMessages();
        } catch (err) {
            console.error('Error creating workout:', err);
            setAddWorkoutError(`Failed to create workout: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    if (isLoading || isLoadingDefinitions) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, bgcolor: LIGHT_BG, minHeight: '100vh' }}>
                <CircularProgress sx={{ color: NEON_PURPLE }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: LIGHT_BG, minHeight: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: NEON_PURPLE, fontWeight: 'bold', textAlign: 'center', m: 0 }}>
                    Manage Workouts
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddWorkoutDialog}
                    sx={{
                        bgcolor: NEON_GREEN,
                        '&:hover': { bgcolor: alpha(NEON_GREEN, 0.85) },
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                    }}
                >
                    Add Workout
                </Button>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
            )}
            {successMessage && (
                <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>{successMessage}</Alert>
            )}
            {workouts.length === 0 && !isLoading ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(NEON_PURPLE, 0.05), borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: NEON_PURPLE }}>
                        No saved workouts found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Create workouts from the weekly exercise view by selecting exercises and saving them.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/training-plans')}
                        sx={{
                            mt: 2,
                            bgcolor: NEON_GREEN,
                            '&:hover': { bgcolor: alpha(NEON_GREEN, 0.85) },
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        View Training Plans
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' }, gap: 2.5 }}>
                    {workouts.map((workout) => {
                        // Error: 'definitionForDisplay' is assigned a value but never used. - REMOVED
                        // const definitionForDisplay = exerciseDefinitionMap.get(workout.exerciseIds?.[0]?.toString() || ''); // For card level if needed
                        return (
                            <Paper
                                key={workout._id}
                                elevation={3}
                                sx={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: `1px solid ${alpha(NEON_BLUE, 0.25)}`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: `0 2px 8px ${alpha(NEON_BLUE, 0.1)}`,
                                    '&:hover': {
                                        boxShadow: `0 6px 16px ${alpha(NEON_BLUE, 0.15)}`,
                                        transform: 'translateY(-4px)'
                                    },
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <Box
                                    onClick={() => handleToggleExpand(workout._id)}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        bgcolor: alpha(NEON_BLUE, 0.08),
                                        borderBottom: `1px solid ${alpha(NEON_BLUE, 0.15)}`
                                    }}
                                >
                                    <Typography variant="h6" component="h2" sx={{ fontWeight: '600', color: NEON_BLUE, flexGrow: 1, fontSize: '1.1rem' }}>
                                        {workout.name}
                                    </Typography>
                                    <IconButton size="small" sx={{ color: NEON_BLUE }}>
                                        {expandedWorkoutId === workout._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>
                                <Box sx={{ p: 2, flexGrow: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                                        Created: {new Date(workout.createdAt).toLocaleDateString()}
                                    </Typography>
                                    {workout.exercises && workout.exercises.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                            {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                                        </Typography>
                                    )}
                                    {workout.trainingPlanId && (
                                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(NEON_BLUE, 0.7), display: 'block', mt: 0.5 }}>
                                            Plan ID: {workout.trainingPlanId.substring(0, 8)}...
                                        </Typography>
                                    )}
                                </Box>

                                <Collapse in={expandedWorkoutId === workout._id} timeout="auto" unmountOnExit sx={{ px: 0 }}>
                                    <Divider sx={{ mx: 0, bgcolor: alpha(NEON_BLUE, 0.15) }} />
                                    <Box sx={{ p: 2 }}>
                                        {workout.isExercisesLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                                <CircularProgress size={24} sx={{ color: NEON_PURPLE }} />
                                            </Box>
                                        ) : workout.exercisesError ? (
                                            <Typography color="error" sx={{ my: 1, fontSize: '0.875rem' }}>{workout.exercisesError}</Typography>
                                        ) : workout.exercises && workout.exercises.length > 0 ? (
                                            <List dense disablePadding sx={{ mb: 1 }}>
                                                {workout.exercises.map((exercise, index) => {
                                                    const definition = exerciseDefinitionMap.get(exercise.exerciseDefinitionId.toString());
                                                    return (
                                                        <ListItem
                                                            key={`${workout._id}-${exercise.exerciseDefinitionId.toString()}-${index}`}
                                                            sx={{
                                                                bgcolor: alpha(NEON_PURPLE, 0.04),
                                                                mb: 1,
                                                                borderRadius: '8px',
                                                                p: 1,
                                                                border: `1px solid ${alpha(NEON_PURPLE, 0.1)}`,
                                                                minHeight: '50px'
                                                            }}
                                                            secondaryAction={
                                                                <IconButton
                                                                    edge="end"
                                                                    aria-label="remove exercise"
                                                                    onClick={() => handleRemoveExercise(workout._id, exercise.exerciseDefinitionId.toString())}
                                                                    size="small"
                                                                    sx={{ color: alpha(NEON_PURPLE, 0.7), '&:hover': { bgcolor: alpha(NEON_PURPLE, 0.1) } }}
                                                                    disabled={isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}`}
                                                                >
                                                                    {isRemovingExercise === `${workout._id}_${exercise.exerciseDefinitionId.toString()}` ? <CircularProgress size={18} color="inherit" /> : <RemoveCircleOutlineIcon fontSize="small" />}
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                {definition?.imageUrl ? (
                                                                    <Avatar src={definition.imageUrl} variant="rounded" sx={{ width: 36, height: 36, bgcolor: alpha(NEON_PURPLE, 0.1) }}>
                                                                        <BrokenImageIcon sx={{ color: alpha(NEON_PURPLE, 0.5) }} />
                                                                    </Avatar>
                                                                ) : (
                                                                    <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: alpha(NEON_PURPLE, 0.1) }}>
                                                                        <FitnessCenterIcon sx={{ color: NEON_PURPLE }} />
                                                                    </Avatar>
                                                                )}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={definition?.name || `Exercise ${index + 1}`}
                                                                primaryTypographyProps={{ variant: 'body2', sx: { color: alpha('#000000', 0.85), fontWeight: 500 } }}
                                                                secondary={exercise.sets && exercise.reps && exercise.sets > 0 && exercise.reps > 0
                                                                    ? `${exercise.sets} sets x ${exercise.reps} reps`
                                                                    : 'Sets/Reps not specified'}
                                                                secondaryTypographyProps={{ variant: 'caption', sx: { color: alpha('#000000', 0.65) } }}
                                                            />
                                                        </ListItem>
                                                    )
                                                })}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2, fontStyle: 'italic' }}>No exercises in this workout.</Typography>
                                        )}
                                        <Button
                                            fullWidth
                                            startIcon={<AddCircleOutlineIcon />}
                                            onClick={() => handleOpenAddExerciseDialog(workout)}
                                            sx={{
                                                mt: 1,
                                                color: NEON_GREEN,
                                                borderColor: alpha(NEON_GREEN, 0.6),
                                                bgcolor: alpha(NEON_GREEN, 0.05),
                                                fontWeight: 500,
                                                py: 0.8,
                                                textTransform: 'none',
                                                borderRadius: '8px',
                                                '&:hover': { borderColor: NEON_GREEN, bgcolor: alpha(NEON_GREEN, 0.1) }
                                            }}
                                            variant="outlined"
                                        >
                                            Add Exercise
                                        </Button>
                                    </Box>
                                </Collapse>
                                <Box sx={{ borderTop: `1px solid ${alpha(NEON_BLUE, 0.15)}`, mt: 'auto' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: alpha(NEON_BLUE, 0.03) }}>
                                        <IconButton
                                            aria-label="Start workout"
                                            onClick={() => handleStartWorkout(workout._id)}
                                            title="Start Workout"
                                            sx={{ color: NEON_GREEN, '&:hover': { bgcolor: alpha(NEON_GREEN, 0.1) } }}
                                        >
                                            <PlayArrowIcon />
                                        </IconButton>
                                        <Box>
                                            <IconButton
                                                aria-label="Edit workout name"
                                                onClick={() => openRenameDialog(workout)}
                                                title="Rename Workout"
                                                sx={{ color: NEON_PURPLE, '&:hover': { bgcolor: alpha(NEON_PURPLE, 0.1) } }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                aria-label="Delete workout"
                                                onClick={() => openDeleteDialog(workout._id)}
                                                title="Delete Workout"
                                                sx={{ color: alpha('#D32F2F', 0.8), '&:hover': { bgcolor: alpha('#D32F2F', 0.1) } }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        )
                    })}
                </Box>
            )}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '12px', border: `1px solid ${alpha(NEON_PURPLE, 0.3)}` } }}
            >
                <DialogTitle sx={{ bgcolor: alpha(NEON_PURPLE, 0.1), color: NEON_PURPLE, fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <DialogContentText>
                        Are you sure you want to delete this workout? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: alpha('#000000', 0.7) }}>Cancel</Button>
                    <Button onClick={handleDeleteWorkout} sx={{ color: 'white', bgcolor: '#D32F2F', '&:hover': { bgcolor: alpha('#D32F2F', 0.8) } }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 2, border: `1px solid ${alpha(NEON_PURPLE, 0.3)}`, minWidth: '300px' } }}
            >
                <DialogTitle sx={{ bgcolor: alpha(NEON_PURPLE, 0.1), color: NEON_PURPLE, fontWeight: 'bold' }}>Rename Workout</DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Workout Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRenameWorkout();
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '& fieldset': { borderColor: alpha(NEON_PURPLE, 0.5) },
                                '&:hover fieldset': { borderColor: NEON_PURPLE },
                                '&.Mui-focused fieldset': { borderColor: NEON_PURPLE },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: NEON_PURPLE },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: alpha('#000000', 0.7) }} disabled={!!isRenamingWorkoutId}>Cancel</Button>
                    <Button
                        onClick={handleRenameWorkout}
                        sx={{ color: 'white', bgcolor: NEON_PURPLE, '&:hover': { bgcolor: alpha(NEON_PURPLE, 0.8) }, borderRadius: '8px' }}
                        disabled={!!isRenamingWorkoutId || !newWorkoutName.trim() || newWorkoutName.trim() === workoutToRename?.name}
                    >
                        {isRenamingWorkoutId === workoutToRename?._id ? <CircularProgress size={24} color="inherit" /> : 'Rename'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={addExerciseDialogOpen}
                onClose={handleCloseAddExerciseDialog}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { height: '80vh', borderRadius: '12px' } }}
            >
                <AppBar sx={{ position: 'relative', bgcolor: alpha(NEON_GREEN, 0.1), boxShadow: 'none' }}>
                    <Toolbar>
                        <Typography sx={{ ml: 2, flex: 1, color: NEON_GREEN, fontWeight: 'bold' }} variant="h6" component="div">
                            Add Exercise to {workoutToAddExerciseTo?.name || 'Workout'}
                        </Typography>
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={handleCloseAddExerciseDialog}
                            aria-label="close"
                            sx={{ color: NEON_GREEN }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '& fieldset': { borderColor: alpha(NEON_GREEN, 0.5) },
                                '&:hover fieldset': { borderColor: NEON_GREEN },
                                '&.Mui-focused fieldset': { borderColor: NEON_GREEN },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: NEON_GREEN },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: alpha(NEON_GREEN, 0.8) }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {isLoadingDialogExercises ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress sx={{ color: NEON_GREEN }} /></Box>
                    ) : dialogPlanContextError ? (
                        <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#D32F2F', 0.9) }}>{dialogPlanContextError}</Typography>
                    ) : filteredDefinitionsForDialog.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', mt: 2, color: alpha('#000000', 0.7) }}>No exercises found matching your criteria.</Typography>
                    ) : (
                        <List dense sx={{ overflowY: 'auto', flexGrow: 1 }}>
                            {filteredDefinitionsForDialog.map((def) => (
                                <ListItemButton
                                    key={def._id.toString()}
                                    onClick={() => handleConfirmAddExercise(def)}
                                    disabled={isAddingSingleExercise || Boolean(workoutToAddExerciseTo && workoutToAddExerciseTo.exercises?.some(ex => ex.exerciseDefinitionId.toString() === def._id.toString()))}
                                    sx={{
                                        mb: 0.5,
                                        borderRadius: '8px',
                                        border: `1px solid ${alpha(NEON_GREEN, 0.2)}`,
                                        '&:hover': { bgcolor: isAddingSingleExercise ? alpha(NEON_GREEN, 0.05) : alpha(NEON_GREEN, 0.05) },
                                    }}
                                >
                                    {isAddingSingleExercise && workoutToAddExerciseTo && <CircularProgress size={20} sx={{ mr: 1 }} />}
                                    <ListItemIcon sx={{ minWidth: 48, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                        {def.imageUrl ? (
                                            <Avatar src={def.imageUrl} variant="rounded" sx={{ width: 36, height: 36, bgcolor: alpha(NEON_GREEN, 0.1) }}>
                                                <BrokenImageIcon sx={{ color: alpha(NEON_GREEN, 0.5) }} />
                                            </Avatar>
                                        ) : (
                                            <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: alpha(NEON_GREEN, 0.1) }}>
                                                <FitnessCenterIcon sx={{ color: NEON_GREEN }} />
                                            </Avatar>
                                        )}
                                    </ListItemIcon>
                                    <ListItemText primary={def.name} primaryTypographyProps={{ fontWeight: 500 }} />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Workout Dialog */}
            <Dialog
                open={isAddWorkoutDialogOpen}
                onClose={handleCloseAddWorkoutDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { borderRadius: '12px', maxHeight: '90vh' } }}
            >
                <DialogTitle sx={{ bgcolor: alpha(NEON_GREEN, 0.1), color: NEON_GREEN, fontWeight: 'bold' }}>
                    Create New Workout
                </DialogTitle>
                <DialogContent sx={{ pt: '20px !important', pb: 3 }}>
                    {addWorkoutError && (
                        <Box sx={{ mb: 2, p: 1, bgcolor: alpha('#f44336', 0.1), borderRadius: 1 }}>
                            <Typography color="error">{addWorkoutError}</Typography>
                        </Box>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Workout Name"
                        fullWidth
                        value={newWorkoutNameForAdd}
                        onChange={(e) => setNewWorkoutNameForAdd(e.target.value)}
                        sx={{ mb: 3 }}
                        InputProps={{
                            sx: { borderRadius: '8px' }
                        }}
                    />

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="training-plan-select-label">Training Plan</InputLabel>
                        <Select
                            labelId="training-plan-select-label"
                            value={selectedTrainingPlanIdForNewWorkout}
                            onChange={handleTrainingPlanChange}
                            label="Training Plan"
                            disabled={isLoadingTrainingPlans}
                            sx={{ borderRadius: '8px' }}
                        >
                            {isLoadingTrainingPlans ? (
                                <MenuItem value="" disabled>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Loading training plans...
                                    </Box>
                                </MenuItem>
                            ) : availableTrainingPlans.length === 0 ? (
                                <MenuItem value="" disabled>No training plans available</MenuItem>
                            ) : (
                                <>
                                    <MenuItem value="" disabled>
                                        <em>Select a training plan</em>
                                    </MenuItem>
                                    {availableTrainingPlans.map((plan) => (
                                        <MenuItem key={plan._id.toString()} value={plan._id.toString()}>
                                            {plan.name}
                                        </MenuItem>
                                    ))}
                                </>
                            )}
                        </Select>
                        <FormHelperText>
                            Select a training plan to see available exercises
                        </FormHelperText>
                    </FormControl>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2, color: NEON_PURPLE }}>
                        Select Exercises
                    </Typography>

                    {isLoadingExercisesForNewWorkout ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress size={30} sx={{ color: NEON_PURPLE }} />
                        </Box>
                    ) : !selectedTrainingPlanIdForNewWorkout ? (
                        <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                            Please select a training plan first
                        </Typography>
                    ) : exercisesForNewWorkoutDialog.length === 0 ? (
                        <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                            No exercises found for this training plan
                        </Typography>
                    ) : (
                        <List sx={{
                            maxHeight: '40vh',
                            overflow: 'auto',
                            border: `1px solid ${alpha(NEON_PURPLE, 0.2)}`,
                            borderRadius: '8px',
                            bgcolor: alpha(NEON_PURPLE, 0.03)
                        }}>
                            {exercisesForNewWorkoutDialog.map((exercise) => {
                                const exerciseDefinition = exerciseDefinitionMap.get(exercise.exerciseDefinitionId.toString());
                                const isSelected = selectedExerciseIdsForNewWorkout.includes(exercise._id.toString());

                                return (
                                    <ListItem
                                        key={exercise._id.toString()}
                                        dense
                                        onClick={() => handleToggleExerciseForNewWorkout(exercise._id.toString())}
                                        sx={{
                                            cursor: 'pointer',
                                            bgcolor: isSelected ? alpha(NEON_PURPLE, 0.1) : 'transparent',
                                            '&:hover': { bgcolor: isSelected ? alpha(NEON_PURPLE, 0.15) : alpha(NEON_PURPLE, 0.05) },
                                            borderBottom: `1px solid ${alpha(NEON_PURPLE, 0.1)}`,
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={isSelected}
                                                tabIndex={-1}
                                                disableRipple
                                                sx={{
                                                    color: alpha(NEON_PURPLE, 0.7),
                                                    '&.Mui-checked': { color: NEON_PURPLE }
                                                }}
                                            />
                                        </ListItemIcon>
                                        <ListItemAvatar>
                                            {exerciseDefinition?.imageUrl ? (
                                                <Avatar src={exerciseDefinition.imageUrl} variant="rounded" sx={{ width: 40, height: 40, bgcolor: alpha(NEON_PURPLE, 0.1) }}>
                                                    <BrokenImageIcon sx={{ color: alpha(NEON_PURPLE, 0.5) }} />
                                                </Avatar>
                                            ) : (
                                                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: alpha(NEON_PURPLE, 0.1) }}>
                                                    <FitnessCenterIcon sx={{ color: NEON_PURPLE }} />
                                                </Avatar>
                                            )}
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={exerciseDefinition?.name || `Exercise ${exercise.exerciseDefinitionId.toString().substring(0, 6)}...`}
                                            secondary={exercise.sets && exercise.reps ? `${exercise.sets} sets × ${exercise.reps} reps` : 'No sets/reps defined'}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}

                    {selectedExerciseIdsForNewWorkout.length > 0 && (
                        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
                            {selectedExerciseIdsForNewWorkout.length} exercise{selectedExerciseIdsForNewWorkout.length !== 1 ? 's' : ''} selected
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleCloseAddWorkoutDialog}
                        sx={{ color: alpha('#000000', 0.7) }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAddNewWorkout}
                        disabled={
                            !newWorkoutNameForAdd.trim() ||
                            !selectedTrainingPlanIdForNewWorkout ||
                            selectedExerciseIdsForNewWorkout.length === 0 ||
                            isLoadingExercisesForNewWorkout
                        }
                        sx={{
                            bgcolor: NEON_GREEN,
                            color: 'white',
                            '&:hover': { bgcolor: alpha(NEON_GREEN, 0.8) },
                            '&.Mui-disabled': { bgcolor: alpha(NEON_GREEN, 0.3), color: 'white' }
                        }}
                        variant="contained"
                    >
                        Create Workout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 