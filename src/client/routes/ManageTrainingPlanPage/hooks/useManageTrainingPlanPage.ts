import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/client/router';
import { getExercises, deleteExercise, addExercise } from '@/apis/exercises/client';
import { getTrainingPlanById, getAllTrainingPlans } from '@/apis/trainingPlans/client';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { TrainingPlan } from '@/apis/trainingPlans/types';
import type { ExerciseDefinition as ApiExerciseDefinition, ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types'; // Combined imports
import {
    getAllSavedWorkouts,
    deleteSavedWorkout as deleteSavedWorkoutApi,
    getSavedWorkoutDetails,
    createSavedWorkout,
    addExerciseToSavedWorkout,
    removeExerciseFromSavedWorkout as removeExerciseFromSavedWorkoutApi,
    renameSavedWorkout,
} from '@/apis/savedWorkouts/client';
import type {
    SavedWorkout as ApiSavedWorkout,
    AddExerciseToSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutRequest,
} from '@/apis/savedWorkouts/types';
import type { TrainingPlan as ApiTrainingPlan } from '@/apis/trainingPlans/types';
import type { ClientWorkoutDisplay } from '../types';
import { createDefinitionMapMPE } from '../utils/definitions';
import type { UseManageTrainingPlanPageReturn } from './useManageTrainingPlanPage.types'; // Added import


export const useManageTrainingPlanPage = (): UseManageTrainingPlanPageReturn => { // Added return type
    const { routeParams, navigate, currentPath } = useRouter();
    const planId = routeParams.planId as string | undefined;

    // Determine initial tab from currentPath
    const getInitialTab = () => {
        if (currentPath.endsWith('/workouts')) {
            return 1; // Workouts tab
        }
        return 0; // Exercises tab (default)
    };

    const [currentTab, setCurrentTab] = useState(getInitialTab());
    const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to update tab if path changes (e.g., browser back/forward)
    useEffect(() => {
        setCurrentTab(getInitialTab());
    }, [currentPath]);

    // Exercises Tab State
    const [exercises, setExercises] = useState<ExerciseBase[]>([]);
    const [planDetails, setPlanDetails] = useState<TrainingPlan | null>(null);
    const [definitions, setDefinitions] = useState<ApiExerciseDefinitionMPE[]>([]);
    const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
    const [duplicatingExerciseId, setDuplicatingExerciseId] = useState<string | null>(null);
    const [isExerciseBrowserOpen, setIsExerciseBrowserOpen] = useState(false);
    const [isExerciseDetailsDialogOpen, setIsExerciseDetailsDialogOpen] = useState(false);
    const [selectedDefinitionForDetails, setSelectedDefinitionForDetails] = useState<ApiExerciseDefinitionMPE | null>(null);
    const [exerciseBeingEdited, setExerciseBeingEdited] = useState<ExerciseBase | null>(null);
    const [isConfirmDeleteExerciseDialogOpen, setIsConfirmDeleteExerciseDialogOpen] = useState(false);
    const [exercisePendingDeletion, setExercisePendingDeletion] = useState<ExerciseBase | null>(null);

    // Saved Workouts Tab State
    const [savedWorkout_workouts, setSavedWorkout_workouts] = useState<ClientWorkoutDisplay[]>([]);
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
    
    // Plan exercises for adding to workouts - combines exercise IDs with their definition data
    const [savedWorkout_planExercises, setSavedWorkout_planExercises] = useState<Array<{
        exerciseId: string;
        definitionId: string;
        definition: ApiExerciseDefinition;
    }>>([]);
    const [savedWorkout_isAddWorkoutDialogOpen, setSavedWorkout_isAddWorkoutDialogOpen] = useState(false);
    const [savedWorkout_newWorkoutNameForAdd, setSavedWorkout_newWorkoutNameForAdd] = useState('');
    const [savedWorkout_addWorkoutError, setSavedWorkout_addWorkoutError] = useState<string | null>(null);
    const [savedWorkout_isRemovingExercise, setSavedWorkout_isRemovingExercise] = useState<string | null>(null);
    const [savedWorkout_isRenamingWorkoutId, setSavedWorkout_isRenamingWorkoutId] = useState<string | null>(null);
    
    // New state for multi-select in AddExerciseDialog
    const [savedWorkout_selectedExerciseIds, setSavedWorkout_selectedExerciseIds] = useState<Set<string>>(new Set());
    const [savedWorkout_isAddingMultipleExercises, setSavedWorkout_isAddingMultipleExercises] = useState(false);
    
    // New state for exercise selection in AddNewWorkoutDialog
    const [newWorkoutDialog_selectedExerciseIds, setNewWorkoutDialog_selectedExerciseIds] = useState<Set<string>>(new Set());
    const [newWorkoutDialog_planExercises, setNewWorkoutDialog_planExercises] = useState<Array<{ exerciseId: string; definitionId: string; definition: ApiExerciseDefinition; }>>([]);
    const [newWorkoutDialog_isLoadingExercises, setNewWorkoutDialog_isLoadingExercises] = useState(false);
    const [newWorkoutDialog_errorLoadingExercises, setNewWorkoutDialog_errorLoadingExercises] = useState<string | null>(null);
    const [newWorkoutDialog_searchTerm, setNewWorkoutDialog_searchTerm] = useState('');
    
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
        if (!planId) return;
        const newSubPath = newValue === 0 ? 'exercises' : 'workouts';
        navigate(`/training-plans/${planId}/${newSubPath}`);
        // setCurrentTab(newValue); // No longer needed here, will be set by useEffect on currentPath change
    };

    const clearMessages = useCallback(() => {
        setTimeout(() => {
            setError(null);
            setSavedWorkout_error(null);
            setSavedWorkout_successMessage(null);
        }, 5000);
    }, []);

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
    
    const fetchExercisesTabData = useCallback(async () => {
        if (!planId) {
            setError("Training Plan ID not found in URL parameters.");
            return Promise.reject("Training Plan ID not found");
        }
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
                const defsData = allDefinitionsResponse.data as ApiExerciseDefinitionMPE[];
                setDefinitions(defsData);
                if (savedWorkout_allExerciseDefinitions.length === 0) {
                    setSavedWorkout_allExerciseDefinitions(defsData);
                }
            } else {
                console.warn("Could not load exercise definitions.");
                setDefinitions([]);
                setSavedWorkout_allExerciseDefinitions([]);
            }
            return Promise.resolve();
        } catch (err) {
            console.error("Failed to fetch page data (Exercises Tab):", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred for Exercises Tab';
            setError(errorMessage);
            setExercises([]);
            if (!planDetails) setPlanDetails(null);
            setDefinitions([]);
            return Promise.reject(errorMessage);
        }
    }, [planId, savedWorkout_allExerciseDefinitions.length, planDetails]);

    const fetchSavedWorkoutsForPlan = useCallback(async () => {
        if (!planId) {
            setSavedWorkout_error("Training Plan ID not found.");
            return Promise.reject("Training Plan ID not found for workouts");
        }
        setSavedWorkout_error(null);
        setSavedWorkout_successMessage(null);
        try {
            if (savedWorkout_allExerciseDefinitions.length === 0 && definitions.length === 0) {
                const definitionsResponse = await getAllExerciseDefinitionOptions();
                if (definitionsResponse.data) {
                    const defsData = definitionsResponse.data as ApiExerciseDefinition[];
                    setSavedWorkout_allExerciseDefinitions(defsData);
                    if (definitions.length === 0) setDefinitions(defsData);
                } else {
                    console.warn('Failed to load exercise definitions for workouts tab during workout fetch');
                }
            }

            const workoutsResponse = await getAllSavedWorkouts({ trainingPlanId: planId });
            if (workoutsResponse.data) {
                const rawWorkouts = workoutsResponse.data;
                
                const workoutsWithDetailsPromises = rawWorkouts.map(async (rawWorkout: ApiSavedWorkout) => {
                    if (!rawWorkout || !rawWorkout._id || !rawWorkout.userId || !rawWorkout.trainingPlanId) {
                        console.warn("Malformed raw workout data, skipping:", rawWorkout);
                        return null;
                    }
                    try {
                        const detailsResponse = await getSavedWorkoutDetails({ workoutId: rawWorkout._id.toString() });
                        const formatDate = (dateValue: string | number | Date | null | undefined): string => {
                            if (!dateValue) return new Date().toISOString();
                            if (dateValue instanceof Date) return dateValue.toISOString();
                            if (typeof dateValue === 'string') { try { return new Date(dateValue).toISOString(); } catch { return new Date().toISOString(); } }
                            if (typeof dateValue === 'number') return new Date(dateValue).toISOString();
                            return new Date().toISOString();
                        };

                        if (detailsResponse.data && 'exercises' in detailsResponse.data) {
                            return {
                                ...detailsResponse.data,
                                _id: detailsResponse.data._id.toString(),
                                userId: detailsResponse.data.userId.toString(),
                                trainingPlanId: detailsResponse.data.trainingPlanId.toString(),
                                createdAt: formatDate(detailsResponse.data.createdAt),
                                updatedAt: formatDate(detailsResponse.data.updatedAt),
                                exercises: detailsResponse.data.exercises,
                                isExercisesLoading: false,
                                exercisesError: null,
                            } as ClientWorkoutDisplay;
                        } else {
                            console.warn(`Failed to get details for workout ${rawWorkout._id.toString()}, using raw data.`);
                            return {
                                ...rawWorkout,
                                _id: rawWorkout._id.toString(),
                                userId: rawWorkout.userId.toString(),
                                trainingPlanId: rawWorkout.trainingPlanId.toString(),
                                createdAt: formatDate(rawWorkout.createdAt),
                                updatedAt: formatDate(rawWorkout.updatedAt),
                                exercises: [],
                                isExercisesLoading: false,
                                exercisesError: 'Failed to load exercises on initial fetch.',
                            } as ClientWorkoutDisplay;
                        }
                    } catch (detailErr) {
                        console.error(`Error fetching details for workout ${rawWorkout._id.toString()}:`, detailErr);
                        const formatDate = (dateValue: string | number | Date | null | undefined): string => {
                            if (!dateValue) return new Date().toISOString();
                            if (dateValue instanceof Date) return dateValue.toISOString();
                            if (typeof dateValue === 'string') { try { return new Date(dateValue).toISOString(); } catch { return new Date().toISOString(); } }
                            if (typeof dateValue === 'number') return new Date(dateValue).toISOString();
                            return new Date().toISOString();
                        };
                        return {
                            ...rawWorkout,
                            _id: rawWorkout._id.toString(),
                            userId: rawWorkout.userId.toString(),
                            trainingPlanId: rawWorkout.trainingPlanId.toString(),
                            createdAt: formatDate(rawWorkout.createdAt),
                            updatedAt: formatDate(rawWorkout.updatedAt),
                            exercises: [],
                            isExercisesLoading: false,
                            exercisesError: `Error fetching details: ${detailErr instanceof Error ? detailErr.message : 'Unknown error'}.`,
                        } as ClientWorkoutDisplay;
                    }
                });

                const settledWorkouts = await Promise.all(workoutsWithDetailsPromises);
                const validWorkouts = settledWorkouts.filter(Boolean) as ClientWorkoutDisplay[];
                setSavedWorkout_workouts(validWorkouts);
            } else {
                setSavedWorkout_error('Failed to load saved workouts for this plan');
            }
            return Promise.resolve();
        } catch (err) {
            console.error('Error fetching saved workouts for plan:', err);
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading workouts for this plan';
            setSavedWorkout_error(errorMessage);
            return Promise.reject(errorMessage);
        }
    }, [planId, definitions, savedWorkout_allExerciseDefinitions.length]);
    
    const loadInitialPageData = useCallback(async () => {
        if (!planId) {
            setError("Training Plan ID missing from route parameters.");
            setIsPageLoading(false);
            return;
        }
        setIsPageLoading(true);
        setError(null);
        setSavedWorkout_error(null);

        try {
            // Fetch common data first or in parallel if independent
            if (availableTrainingPlans.length === 0 && !isLoadingTrainingPlans) {
                 fetchAvailableTrainingPlans(); // Fire and forget or await if critical path
            }

            // Fetch data specific to the current view (tab or combined)
            await Promise.all([
                fetchExercisesTabData(),
                fetchSavedWorkoutsForPlan()
            ]);

        } catch (pageLoadError) {
            console.error("Critical error during initial page data load:", pageLoadError);
            // Error state might already be set by individual fetch functions
            if (!error && !savedWorkout_error) { // Only set general error if specific ones aren't set
                setError(pageLoadError instanceof Error ? pageLoadError.message : "Failed to load all page data.");
            }
        } finally {
            setIsPageLoading(false);
        }
    }, [planId, fetchExercisesTabData, fetchSavedWorkoutsForPlan, error, savedWorkout_error, availableTrainingPlans.length, isLoadingTrainingPlans, fetchAvailableTrainingPlans]);

    useEffect(() => {
        if (planId) {
            loadInitialPageData();
        } else if (routeParams && !planId) {
            setError("Training Plan ID missing from route parameters.");
            setIsPageLoading(false);
        }
    }, [planId, routeParams]); // loadInitialPageData is memoized and contains other dependencies

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
                await loadInitialPageData(); // Reload all data
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
            if (response.data && '_id' in response.data) { 
                await loadInitialPageData(); // Reload all data
            }
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
    
    const handleDetailsDialogSave = async () => {
        await loadInitialPageData(); // Reload all data
        setExerciseBeingEdited(null); setIsExerciseDetailsDialogOpen(false); setSelectedDefinitionForDetails(null);
    };

    const handleDetailsDialogClose = () => { setIsExerciseDetailsDialogOpen(false); setSelectedDefinitionForDetails(null); setExerciseBeingEdited(null); };

    const definitionsMapMPE = useMemo(() => createDefinitionMapMPE(definitions), [definitions]);

    const existingExerciseDefinitionIdsInPlan = useMemo(() => { return exercises.map(ex => ex.exerciseDefinitionId.toString()); }, [exercises]);
    
    // Saved Workouts Logic
    const savedWorkout_handleToggleExpand = async (workoutId: string) => {
        const isCurrentlyExpanded = savedWorkout_expandedWorkoutId === workoutId;
        const newExpandedId = isCurrentlyExpanded ? null : workoutId;
        setSavedWorkout_expandedWorkoutId(newExpandedId);
    };

    const savedWorkout_openDeleteDialog = (workoutId: string) => {
        setSavedWorkout_workoutToDeleteId(workoutId);
        setSavedWorkout_deleteDialogOpen(true);
    };

    const savedWorkout_handleDeleteWorkout = async () => {
        if (!savedWorkout_workoutToDeleteId) return;
        setSavedWorkout_isRemovingExercise(`${savedWorkout_workoutToDeleteId}_delete_action`);
        setSavedWorkout_error(null); // Clear specific error for workouts
        setSavedWorkout_deleteDialogOpen(false);

        try {
            const response = await deleteSavedWorkoutApi({ workoutId: savedWorkout_workoutToDeleteId });
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to delete workout: ${response.data.error}`);
            } else if (response.data?.success) {
                await loadInitialPageData(); // Reload all data
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
        setSavedWorkout_newWorkoutName(workout.name); // Pre-fill with current name
        setSavedWorkout_renameDialogOpen(true);
    };

    const savedWorkout_handleRenameWorkout = async () => {
        if (!savedWorkout_workoutToRename || !savedWorkout_newWorkoutName.trim()) return;
        setSavedWorkout_isRenamingWorkoutId(savedWorkout_workoutToRename._id);
        setSavedWorkout_error(null); // Clear specific error
        setSavedWorkout_successMessage(null);

        try {
            const response = await renameSavedWorkout({ workoutId: savedWorkout_workoutToRename._id, newName: savedWorkout_newWorkoutName.trim() });
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to rename workout: ${response.data.error}`);
            } else if (response.data) { // Assuming response.data implies success if no error
                await loadInitialPageData(); // Reload all data
                setSavedWorkout_successMessage('Workout renamed successfully!');
                setSavedWorkout_renameDialogOpen(false);
                setSavedWorkout_workoutToRename(null); // Clear after success
                setSavedWorkout_newWorkoutName('');      // Clear after success
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
        setSavedWorkout_searchTerm(''); // Clear search term for this dialog
        setSavedWorkout_dialogPlanContextError(null);
        setSavedWorkout_addExerciseDialogOpen(true);
        setSavedWorkout_isLoadingDialogExercises(true);
        setSavedWorkout_dialogExerciseList([]); // Old list, potentially remove if not used elsewhere
        setSavedWorkout_planExercises([]); // Clear specific list for this dialog

        const currentPlanId = planId;

        if (currentPlanId) {
            try {
                let definitionsToFilter: ApiExerciseDefinition[] = savedWorkout_allExerciseDefinitions.length > 0
                    ? savedWorkout_allExerciseDefinitions
                    : definitions.length > 0
                        ? definitions
                        : [];

                if (definitionsToFilter.length === 0) {
                    const defsResponse = await getAllExerciseDefinitionOptions();
                    if (defsResponse.data && Array.isArray(defsResponse.data)) {
                        const freshDefs = defsResponse.data as ApiExerciseDefinition[];
                        setSavedWorkout_allExerciseDefinitions(freshDefs);
                        if (definitions.length === 0) setDefinitions(freshDefs);
                        definitionsToFilter = freshDefs;
                    } else {
                        setSavedWorkout_dialogPlanContextError('Could not load exercise definitions.');
                        setSavedWorkout_isLoadingDialogExercises(false);
                        return;
                    }
                }
                
                let planExercisesToUse = exercises.length > 0 ? exercises : [];
                if (planExercisesToUse.length === 0 && currentPlanId) {
                    const exercisesResponse = await getExercises({ trainingPlanId: currentPlanId });
                    if (exercisesResponse.data && Array.isArray(exercisesResponse.data)) {
                        planExercisesToUse = exercisesResponse.data;
                    } else {
                        setSavedWorkout_dialogPlanContextError('Could not load plan exercises.');
                        setSavedWorkout_isLoadingDialogExercises(false);
                        return;
                    }
                }
                
                const exercisesWithDefinitions = planExercisesToUse.map(exercise => {
                    const definitionId = exercise.exerciseDefinitionId.toString();
                    const definitionDetail = definitionsToFilter.find(def => def._id.toString() === definitionId);
                    const fallbackDefinition: ApiExerciseDefinition = definitionDetail || {
                        _id: exercise.exerciseDefinitionId, name: 'Unknown Exercise', imageUrl: '', primaryMuscle: '', secondaryMuscles: [], bodyWeight: false, type: '', static: false
                    };
                    return { exerciseId: exercise._id.toString(), definitionId, definition: fallbackDefinition };
                });
                
                setSavedWorkout_planExercises(exercisesWithDefinitions); // For AddExerciseToWorkoutDialog

                if (exercisesWithDefinitions.length === 0) {
                    setSavedWorkout_dialogPlanContextError("No exercises available from the current plan to add.");
                }

            } catch (fetchErr) {
                console.error(`Error preparing exercises for AddExerciseToWorkoutDialog:`, fetchErr);
                setSavedWorkout_dialogPlanContextError('Error loading exercise details. Please try again.');
            }
        } else {
            setSavedWorkout_dialogPlanContextError('Plan context is missing. Cannot load exercises.');
        }
        setSavedWorkout_isLoadingDialogExercises(false);
    };

    const savedWorkout_handleCloseAddExerciseDialog = () => {
        setSavedWorkout_addExerciseDialogOpen(false);
        setSavedWorkout_workoutToAddExerciseTo(null);
        setSavedWorkout_selectedExerciseIds(new Set()); // Clear selections on close
        setSavedWorkout_searchTerm(''); // Clear search on close
        setSavedWorkout_dialogPlanContextError(null); // Clear any specific errors
    };

    // Handler for toggling exercise selection in AddExerciseDialog (for existing workouts)
    const savedWorkout_handleToggleExerciseSelection = (exerciseId: string) => {
        setSavedWorkout_selectedExerciseIds(prevSelectedIds => {
            const newSelectedIds = new Set(prevSelectedIds);
            if (newSelectedIds.has(exerciseId)) {
                newSelectedIds.delete(exerciseId);
            } else {
                newSelectedIds.add(exerciseId);
            }
            return newSelectedIds;
        });
    };

    // Handler for toggling exercise selection in AddNewWorkoutDialog
    const newWorkoutDialog_handleToggleExerciseSelection = (exerciseId: string) => {
        setNewWorkoutDialog_selectedExerciseIds(prevSelectedIds => {
            const newSelectedIds = new Set(prevSelectedIds);
            if (newSelectedIds.has(exerciseId)) {
                newSelectedIds.delete(exerciseId);
            } else {
                newSelectedIds.add(exerciseId);
            }
            return newSelectedIds;
        });
    };

    // New handler for confirming addition of multiple selected exercises
    const savedWorkout_handleConfirmAddMultipleExercises = async () => {
        if (!savedWorkout_workoutToAddExerciseTo || savedWorkout_selectedExerciseIds.size === 0) return;

        setSavedWorkout_isAddingMultipleExercises(true);
        setSavedWorkout_error(null);
        setSavedWorkout_successMessage(null);

        const workoutId = savedWorkout_workoutToAddExerciseTo._id.toString();
        const exerciseIdsToAdd = Array.from(savedWorkout_selectedExerciseIds);
        let successes = 0;
        const errors: string[] = [];

        for (const exerciseId of exerciseIdsToAdd) {
            try {
                const requestParams: AddExerciseToSavedWorkoutRequest = { workoutId, exerciseId };
                const response = await addExerciseToSavedWorkout(requestParams);
                if (response.data && 'error' in response.data) {
                    errors.push(`Failed to add ${exerciseId}: ${response.data.error}`);
                } else if (response.data?.success) {
                    successes++;
                } else {
                    errors.push(response.data?.message || `Failed to add ${exerciseId}: Unknown issue`);
                }
            } catch (err) {
                errors.push(`Error adding ${exerciseId}: ${err instanceof Error ? err.message : String(err)}`);
                console.error(`Error adding exercise ${exerciseId} via API:`, err);
            }
        }

        setSavedWorkout_isAddingMultipleExercises(false);

        if (errors.length === 0 && successes > 0) {
            setSavedWorkout_successMessage(`${successes} exercise${successes > 1 ? 's' : ''} added successfully to ${savedWorkout_workoutToAddExerciseTo.name}!`);
            await loadInitialPageData(); // Reload data
            savedWorkout_handleCloseAddExerciseDialog(); // Close dialog
        } else {
            const errorMsg = errors.join('; ');
            setSavedWorkout_error(errorMsg || 'An unknown error occurred while adding exercises.');
            if (successes > 0) { // Partial success
                setSavedWorkout_successMessage(`Successfully added ${successes} exercise${successes > 1 ? 's' : ''}. Some exercises failed.`);
                await loadInitialPageData(); // Reload data as some might have been added
                 // Do not close dialog on partial success, let user see errors and remaining selections.
                 // Consider clearing only successfully added exercises from selection.
                 // For simplicity now, we keep dialog open and selections as is.
            }
        }
        clearMessages();
    };

    const savedWorkout_handleRemoveExercise = async (workoutIdToRemoveFrom: string, exerciseIdToRemove: string) => {
        const removingKey = `${workoutIdToRemoveFrom}_${exerciseIdToRemove}`;
        setSavedWorkout_isRemovingExercise(removingKey);
        setSavedWorkout_error(null); setSavedWorkout_successMessage(null);
        try {
            const requestParams: RemoveExerciseFromSavedWorkoutRequest = { workoutId: workoutIdToRemoveFrom, exerciseIdToRemove: exerciseIdToRemove };
            const response = await removeExerciseFromSavedWorkoutApi(requestParams);
            if (response.data && 'error' in response.data) {
                setSavedWorkout_error(`Failed to remove exercise: ${response.data.error}`);
            } else if (response.data) { // Assuming response.data implies success
                await loadInitialPageData(); // Reload all data
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

    const savedWorkout_handleOpenAddWorkoutDialog = async () => { // Made async
        if (availableTrainingPlans.length === 0 && !isLoadingTrainingPlans) {
            fetchAvailableTrainingPlans();
        }
        setSavedWorkout_newWorkoutNameForAdd('');
        setSavedWorkout_addWorkoutError(null);
        // Reset and load exercises for this dialog
        setNewWorkoutDialog_selectedExerciseIds(new Set());
        setNewWorkoutDialog_planExercises([]);
        setNewWorkoutDialog_isLoadingExercises(true);
        setNewWorkoutDialog_errorLoadingExercises(null);

        const currentPlanId = planId;
        if (currentPlanId) {
            try {
                // Copied/adapted logic from savedWorkout_handleOpenAddExerciseDialog
                let definitionsToFilter: ApiExerciseDefinition[] = savedWorkout_allExerciseDefinitions.length > 0
                    ? savedWorkout_allExerciseDefinitions
                    : definitions.length > 0
                        ? definitions
                        : [];

                if (definitionsToFilter.length === 0) {
                    const defsResponse = await getAllExerciseDefinitionOptions();
                    if (defsResponse.data && Array.isArray(defsResponse.data)) {
                        const freshDefs = defsResponse.data as ApiExerciseDefinition[];
                        setSavedWorkout_allExerciseDefinitions(freshDefs); // Keep this shared cache up-to-date
                        if (definitions.length === 0) setDefinitions(freshDefs); // Keep main definitions in sync
                        definitionsToFilter = freshDefs;
                    } else {
                        setNewWorkoutDialog_errorLoadingExercises('Could not load exercise definitions.');
                        setNewWorkoutDialog_isLoadingExercises(false);
                        setSavedWorkout_isAddWorkoutDialogOpen(true); // Still open dialog to show error
                        return;
                    }
                }
                
                let planExercisesToUse = exercises.length > 0 ? exercises : [];
                if (planExercisesToUse.length === 0 && currentPlanId) {
                    const exercisesResponse = await getExercises({ trainingPlanId: currentPlanId });
                    if (exercisesResponse.data && Array.isArray(exercisesResponse.data)) {
                        planExercisesToUse = exercisesResponse.data;
                    } else {
                        setNewWorkoutDialog_errorLoadingExercises('Could not load plan exercises.');
                        setNewWorkoutDialog_isLoadingExercises(false);
                        setSavedWorkout_isAddWorkoutDialogOpen(true);
                        return;
                    }
                }
                
                const exercisesWithDefinitions = planExercisesToUse.map(exercise => {
                    const definitionId = exercise.exerciseDefinitionId.toString();
                    const definitionDetail = definitionsToFilter.find(def => def._id.toString() === definitionId);
                    const fallbackDefinition: ApiExerciseDefinition = definitionDetail || {
                        _id: exercise.exerciseDefinitionId, name: 'Unknown Exercise', imageUrl: '', primaryMuscle: '', secondaryMuscles: [], bodyWeight: false, type: '', static: false
                    };
                    return { exerciseId: exercise._id.toString(), definitionId, definition: fallbackDefinition };
                });
                
                setNewWorkoutDialog_planExercises(exercisesWithDefinitions);
                if (exercisesWithDefinitions.length === 0) {
                    setNewWorkoutDialog_errorLoadingExercises("No exercises available in the current plan to add to a new workout.");
                }

            } catch (fetchErr) {
                console.error(`Error preparing exercises for AddNewWorkoutDialog:`, fetchErr);
                setNewWorkoutDialog_errorLoadingExercises('Error loading exercise details. Please try again.');
            }
        } else {
            setNewWorkoutDialog_errorLoadingExercises('Plan context is missing. Cannot load exercises for new workout.');
        }
        
        setNewWorkoutDialog_isLoadingExercises(false);
        setSavedWorkout_isAddWorkoutDialogOpen(true); // Open the dialog
    };
    
    const savedWorkout_handleCloseAddWorkoutDialog = () => {
        setSavedWorkout_isAddWorkoutDialogOpen(false);
        setSavedWorkout_newWorkoutNameForAdd('');
        setSavedWorkout_addWorkoutError(null);
        setNewWorkoutDialog_selectedExerciseIds(new Set()); // Clear selections for this dialog
        setNewWorkoutDialog_planExercises([]); // Clear exercises for this dialog
        setNewWorkoutDialog_errorLoadingExercises(null); // Clear error for this dialog
        setNewWorkoutDialog_searchTerm(''); // Clear search term for this dialog
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

        setSavedWorkout_addWorkoutError(null);
        setSavedWorkout_successMessage(null);
        // Consider adding a loading state for this operation if it's not covered by isPageLoading
        // For example: setIsCreatingWorkout(true);

        try {
            const selectedExerciseIdsArray = Array.from(newWorkoutDialog_selectedExerciseIds);
            const response = await createSavedWorkout({
                name: savedWorkout_newWorkoutNameForAdd.trim(),
                trainingPlanId: planId,
                exerciseIds: selectedExerciseIdsArray, // Pass selected exercise IDs
            });

            if (response.data && 'error' in response.data) {
                setSavedWorkout_addWorkoutError(`Failed to create workout: ${response.data.error}`);
            } else if (response.data && '_id' in response.data) {
                setSavedWorkout_successMessage('Workout created successfully!');
                savedWorkout_handleCloseAddWorkoutDialog();
                await loadInitialPageData(); // Reload all data
            } else {
                setSavedWorkout_addWorkoutError('Failed to create workout: No data returned or unexpected format');
            }
        } catch (err) {
            console.error('Error creating new workout:', err);
            setSavedWorkout_addWorkoutError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            // setIsCreatingWorkout(false);
            clearMessages();
        }
    };
    
    return {
        planId,
        navigate,
        currentTab,
        setCurrentTab,
        handleTabChange,
        isPageLoading,
        error,
        setError, // Expose setError if needed by UI for specific cases
        
        // Exercises Tab Data & Handlers
        exercises,
        planDetails,
        definitions, // These are ApiExerciseDefinitionMPE
        definitionsMapMPE,
        existingExerciseDefinitionIdsInPlan,
        deletingExerciseId,
        duplicatingExerciseId,
        isExerciseBrowserOpen,
        handleOpenExerciseBrowser,
        handleBrowserDialogClose,
        isExerciseDetailsDialogOpen,
        selectedDefinitionForDetails,
        exerciseBeingEdited,
        handleOpenEditForm,
        handleExerciseSelectFromBrowser,
        handleDetailsDialogSave,
        handleDetailsDialogClose,
        isConfirmDeleteExerciseDialogOpen,
        exercisePendingDeletion,
        handleRequestDeleteExercise,
        handleConfirmDeleteExerciseDialogClose,
        executeDeleteExercise,
        handleDuplicateExercise,

        // Saved Workouts Tab Data & Handlers
        savedWorkout_workouts,
        savedWorkout_error,
        savedWorkout_successMessage,
        savedWorkout_setSuccessMessage: setSavedWorkout_successMessage, // allow UI to set success message
        savedWorkout_setError: setSavedWorkout_error, // allow UI to set error message
        savedWorkout_deleteDialogOpen,
        savedWorkout_openDeleteDialog,
        savedWorkout_handleDeleteWorkout,
        savedWorkout_setDeleteDialogOpen: setSavedWorkout_deleteDialogOpen, // Allow direct control if needed
        savedWorkout_workoutToDeleteId,
        savedWorkout_renameDialogOpen,
        savedWorkout_openRenameDialog,
        savedWorkout_handleRenameWorkout,
        savedWorkout_setRenameDialogOpen: setSavedWorkout_renameDialogOpen,
        savedWorkout_workoutToRename,
        savedWorkout_newWorkoutName,
        savedWorkout_setNewWorkoutName: setSavedWorkout_newWorkoutName,
        savedWorkout_isRenamingWorkoutId,
        savedWorkout_expandedWorkoutId,
        savedWorkout_handleToggleExpand,
        savedWorkout_allExerciseDefinitions, // These are ApiExerciseDefinition
        savedWorkout_exerciseDefinitionMap,
        savedWorkout_addExerciseDialogOpen,
        savedWorkout_handleOpenAddExerciseDialog,
        savedWorkout_handleCloseAddExerciseDialog,
        savedWorkout_workoutToAddExerciseTo,
        savedWorkout_searchTerm,
        savedWorkout_setSearchTerm: setSavedWorkout_searchTerm,
        savedWorkout_dialogExerciseList,
        savedWorkout_isLoadingDialogExercises,
        savedWorkout_dialogPlanContextError,
        savedWorkout_planExercises,
        savedWorkout_handleRemoveExercise,
        savedWorkout_isRemovingExercise,
        savedWorkout_selectedExerciseIds,
        savedWorkout_handleToggleExerciseSelection,
        savedWorkout_handleConfirmAddMultipleExercises,
        savedWorkout_isAddingMultipleExercises,
        savedWorkout_isAddWorkoutDialogOpen,
        savedWorkout_handleOpenAddWorkoutDialog,
        savedWorkout_handleCloseAddWorkoutDialog,
        savedWorkout_newWorkoutNameForAdd,
        savedWorkout_setNewWorkoutNameForAdd: setSavedWorkout_newWorkoutNameForAdd,
        savedWorkout_addWorkoutError,
        savedWorkout_handleConfirmAddNewWorkout,
        
        // For New Workout Dialog exercise selection
        newWorkoutDialog_selectedExerciseIds,
        newWorkoutDialog_planExercises,
        newWorkoutDialog_isLoadingExercises,
        newWorkoutDialog_errorLoadingExercises,
        newWorkoutDialog_handleToggleExerciseSelection,
        newWorkoutDialog_searchTerm,
        setNewWorkoutDialog_searchTerm,
        
        // Shared/General
        loadInitialPageData, // Expose if manual refresh is needed from UI
        clearMessages,
        availableTrainingPlans, // For UI elements that might need this
        isLoadingTrainingPlans,
    };
}; 