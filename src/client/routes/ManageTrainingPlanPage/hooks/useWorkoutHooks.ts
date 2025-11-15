import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSavedWorkouts, useExercises } from '@/client/hooks/useTrainingData';
import {
    addExerciseToSavedWorkout,
    removeExerciseFromSavedWorkout as removeExerciseFromSavedWorkoutApi,
    renameSavedWorkout,
} from '@/apis/savedWorkouts/client';
import type {
    AddExerciseToSavedWorkoutRequest,
    RemoveExerciseFromSavedWorkoutRequest,
} from '@/apis/savedWorkouts/types';
import type { ExerciseDefinition as ApiExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { ExerciseBase } from '@/common/types/training';
import type { ClientWorkoutDisplay } from '../types';

interface WorkoutsPageState {
    savedWorkout_workouts: ClientWorkoutDisplay[];
    savedWorkout_error: string | null;
    savedWorkout_successMessage: string | null;
    savedWorkout_deleteDialogOpen: boolean;
    savedWorkout_workoutToDeleteId: string | null;
    savedWorkout_renameDialogOpen: boolean;
    savedWorkout_workoutToRename: ClientWorkoutDisplay | null;
    savedWorkout_newWorkoutName: string;
    savedWorkout_expandedWorkoutId: string | null;
    savedWorkout_addExerciseDialogOpen: boolean;
    savedWorkout_workoutToAddExerciseTo: ClientWorkoutDisplay | null;
    savedWorkout_searchTerm: string;
    savedWorkout_isLoadingDialogExercises: boolean;
    savedWorkout_dialogPlanContextError: string | null;
    savedWorkout_planExercises: Array<{
        exerciseId: string;
        definitionId: string;
        definition: ApiExerciseDefinition;
    }>;
    savedWorkout_isAddWorkoutDialogOpen: boolean;
    savedWorkout_newWorkoutNameForAdd: string;
    savedWorkout_addWorkoutError: string | null;
    savedWorkout_isRemovingExercise: string | null;
    savedWorkout_isRenamingWorkoutId: string | null;
    savedWorkout_selectedExerciseIds: Set<string>;
    savedWorkout_isAddingMultipleExercises: boolean;
    newWorkoutDialog_selectedExerciseIds: Set<string>;
    newWorkoutDialog_planExercises: Array<{ exerciseId: string; definitionId: string; definition: ApiExerciseDefinition; }>;
    newWorkoutDialog_isLoadingExercises: boolean;
    newWorkoutDialog_errorLoadingExercises: string | null;
    newWorkoutDialog_searchTerm: string;
}

const getDefaultWorkoutsState = (): WorkoutsPageState => ({
    savedWorkout_workouts: [],
    savedWorkout_error: null,
    savedWorkout_successMessage: null,
    savedWorkout_deleteDialogOpen: false,
    savedWorkout_workoutToDeleteId: null,
    savedWorkout_renameDialogOpen: false,
    savedWorkout_workoutToRename: null,
    savedWorkout_newWorkoutName: '',
    savedWorkout_expandedWorkoutId: null,
    savedWorkout_addExerciseDialogOpen: false,
    savedWorkout_workoutToAddExerciseTo: null,
    savedWorkout_searchTerm: '',
    savedWorkout_isLoadingDialogExercises: false,
    savedWorkout_dialogPlanContextError: null,
    savedWorkout_planExercises: [],
    savedWorkout_isAddWorkoutDialogOpen: false,
    savedWorkout_newWorkoutNameForAdd: '',
    savedWorkout_addWorkoutError: null,
    savedWorkout_isRemovingExercise: null,
    savedWorkout_isRenamingWorkoutId: null,
    savedWorkout_selectedExerciseIds: new Set(),
    savedWorkout_isAddingMultipleExercises: false,
    newWorkoutDialog_selectedExerciseIds: new Set(),
    newWorkoutDialog_planExercises: [],
    newWorkoutDialog_isLoadingExercises: false,
    newWorkoutDialog_errorLoadingExercises: null,
    newWorkoutDialog_searchTerm: '',
});

export const useWorkoutHooks = (planId: string | undefined, generalDefinitions: ApiExerciseDefinition[], generalExercises: ExerciseBase[]) => {
    const [workoutsState, setWorkoutsState] = useState<WorkoutsPageState>(getDefaultWorkoutsState());

    const { savedWorkouts, loadSavedWorkouts, createSavedWorkout, deleteSavedWorkout } = useSavedWorkouts(planId || '');
    const { exercises } = useExercises(planId || '');

    const generalDefinitionsRef = useRef(generalDefinitions);
    const generalExercisesRef = useRef(generalExercises);

    useEffect(() => {
        generalDefinitionsRef.current = generalDefinitions;
    }, [generalDefinitions]);

    useEffect(() => {
        generalExercisesRef.current = generalExercises;
    }, [generalExercises]);

    const updateWorkoutsState = useCallback((partialState: Partial<WorkoutsPageState>) => {
        setWorkoutsState(prevState => ({ ...prevState, ...partialState }));
    }, []);

    const clearMessages = useCallback(() => {
        const timeoutId = setTimeout(() => {
            updateWorkoutsState({ savedWorkout_error: null, savedWorkout_successMessage: null });
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, [updateWorkoutsState]);

    const savedWorkout_exerciseDefinitionMap = useMemo(() => {
        const map = new Map<string, ApiExerciseDefinition>();
        generalDefinitions.forEach(def => {
            map.set(def._id.toString(), def);
        });
        return map;
    }, [generalDefinitions]);

    const fetchSavedWorkoutsForPlan = useCallback(async () => {
        if (!planId) {
            updateWorkoutsState({ savedWorkout_error: "Training Plan ID not found." });
            return Promise.reject("Training Plan ID not found for workouts");
        }
        updateWorkoutsState({ savedWorkout_error: null, savedWorkout_successMessage: null });
        try {
            await loadSavedWorkouts();
            // The state will be synchronized by the reactive effect below.
            return Promise.resolve();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading workouts for this plan';
            updateWorkoutsState({ savedWorkout_error: errorMessage });
            return Promise.reject(errorMessage);
        }
    }, [planId, updateWorkoutsState, loadSavedWorkouts]);

    // Keep local workouts state in sync with context changes (e.g., after create/delete/rename)
    useEffect(() => {
        if (!planId) return;

        const formatDate = (dateValue: string | number | Date | null | undefined): string => {
            if (!dateValue) return new Date().toISOString();
            if (dateValue instanceof Date) return dateValue.toISOString();
            if (typeof dateValue === 'string') { try { return new Date(dateValue).toISOString(); } catch { /* ignore */ } }
            if (typeof dateValue === 'number') return new Date(dateValue).toISOString();
            return new Date().toISOString();
        };

        const clientWorkouts: ClientWorkoutDisplay[] = savedWorkouts.map(workout => ({
            _id: workout._id,
            userId: workout.userId,
            name: workout.name,
            trainingPlanId: workout.trainingPlanId,
            createdAt: formatDate(workout.createdAt),
            updatedAt: formatDate(workout.updatedAt),
            exercises: exercises ? workout.exercises.map(ex => exercises.find(e => e._id === ex.exerciseId)).filter(Boolean) as ExerciseBase[] : [],
            isExercisesLoading: false,
            exercisesError: null,
        }));

        updateWorkoutsState({ savedWorkout_workouts: clientWorkouts });
    }, [planId, savedWorkouts, exercises, updateWorkoutsState]);

    const savedWorkout_handleToggleExpand = async (workoutId: string) => {
        const isCurrentlyExpanded = workoutsState.savedWorkout_expandedWorkoutId === workoutId;
        const newExpandedId = isCurrentlyExpanded ? null : workoutId;
        updateWorkoutsState({ savedWorkout_expandedWorkoutId: newExpandedId });
    };

    const savedWorkout_openDeleteDialog = (workoutId: string) => {
        updateWorkoutsState({ savedWorkout_workoutToDeleteId: workoutId, savedWorkout_deleteDialogOpen: true });
    };

    const savedWorkout_handleDeleteWorkout = async () => {
        if (!workoutsState.savedWorkout_workoutToDeleteId) return;
        updateWorkoutsState({
            savedWorkout_isRemovingExercise: `${workoutsState.savedWorkout_workoutToDeleteId}_delete_action`,
            savedWorkout_error: null,
            savedWorkout_deleteDialogOpen: false
        });

        try {
            await deleteSavedWorkout(workoutsState.savedWorkout_workoutToDeleteId);
            await fetchSavedWorkoutsForPlan();
            updateWorkoutsState({ savedWorkout_successMessage: 'Workout deleted successfully!' });
        } catch (err) {
            updateWorkoutsState({ savedWorkout_error: `An error occurred: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            updateWorkoutsState({ savedWorkout_isRemovingExercise: null, savedWorkout_workoutToDeleteId: null });
            clearMessages();
        }
    };

    const savedWorkout_openRenameDialog = (workout: ClientWorkoutDisplay) => {
        updateWorkoutsState({
            savedWorkout_workoutToRename: workout,
            savedWorkout_newWorkoutName: workout.name,
            savedWorkout_renameDialogOpen: true
        });
    };

    const savedWorkout_handleRenameWorkout = async () => {
        if (!workoutsState.savedWorkout_workoutToRename || !workoutsState.savedWorkout_newWorkoutName.trim()) return;
        updateWorkoutsState({
            savedWorkout_isRenamingWorkoutId: workoutsState.savedWorkout_workoutToRename._id,
            savedWorkout_error: null,
            savedWorkout_successMessage: null
        });

        try {
            const response = await renameSavedWorkout({ workoutId: workoutsState.savedWorkout_workoutToRename._id, newName: workoutsState.savedWorkout_newWorkoutName.trim() });
            if (response.data && 'error' in response.data) {
                updateWorkoutsState({ savedWorkout_error: `Failed to rename workout: ${response.data.error}` });
            } else if (response.data) {
                await fetchSavedWorkoutsForPlan();
                updateWorkoutsState({
                    savedWorkout_successMessage: 'Workout renamed successfully!',
                    savedWorkout_renameDialogOpen: false,
                    savedWorkout_workoutToRename: null,
                    savedWorkout_newWorkoutName: ''
                });
            } else {
                updateWorkoutsState({ savedWorkout_error: 'Failed to rename workout: No data returned' });
            }
        } catch (err) {
            updateWorkoutsState({ savedWorkout_error: `An error occurred: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            updateWorkoutsState({ savedWorkout_isRenamingWorkoutId: null });
            clearMessages();
        }
    };

    const savedWorkout_handleOpenAddExerciseDialog = async (targetWorkout: ClientWorkoutDisplay) => {
        updateWorkoutsState({
            savedWorkout_workoutToAddExerciseTo: targetWorkout,
            savedWorkout_searchTerm: '',
            savedWorkout_dialogPlanContextError: null,
            savedWorkout_addExerciseDialogOpen: true,
            savedWorkout_isLoadingDialogExercises: true,
            savedWorkout_planExercises: []
        });

        const currentPlanId = planId;

        if (currentPlanId) {
            try {
                const definitionsToFilter: ApiExerciseDefinition[] = generalDefinitionsRef.current;
                if (definitionsToFilter.length === 0) {
                }

                let planExercisesToUse = generalExercisesRef.current;
                if (planExercisesToUse.length === 0 && currentPlanId) {
                    planExercisesToUse = exercises;
                    if (planExercisesToUse.length === 0) {
                        updateWorkoutsState({ savedWorkout_dialogPlanContextError: 'Could not load plan exercises.', savedWorkout_isLoadingDialogExercises: false });
                        return;
                    }
                }

                const exercisesWithDefinitions = planExercisesToUse.map(exercise => {
                    const definitionId = exercise.exerciseDefinitionId.toString();
                    const definitionDetail = definitionsToFilter.find(def => def._id.toString() === definitionId);
                    const definition = definitionDetail || ({
                        _id: 'unknown',
                        name: 'Unknown Exercise',
                        imageUrl: '',
                        primaryMuscle: '',
                        secondaryMuscles: [],
                        bodyWeight: false,
                        type: 'strength',
                        static: false
                    } as unknown as ApiExerciseDefinition);
                    return { exerciseId: exercise._id.toString(), definitionId, definition };
                });
                updateWorkoutsState({ savedWorkout_planExercises: exercisesWithDefinitions });

                if (exercisesWithDefinitions.length === 0) {
                    updateWorkoutsState({ savedWorkout_dialogPlanContextError: "No exercises available from the current plan to add." });
                }

            } catch {
                updateWorkoutsState({ savedWorkout_dialogPlanContextError: 'Error loading exercise details. Please try again.' });
            }
        } else {
            updateWorkoutsState({ savedWorkout_dialogPlanContextError: 'Plan context is missing. Cannot load exercises.' });
        }
        updateWorkoutsState({ savedWorkout_isLoadingDialogExercises: false });
    };

    const savedWorkout_handleCloseAddExerciseDialog = () => {
        updateWorkoutsState({
            savedWorkout_addExerciseDialogOpen: false,
            savedWorkout_workoutToAddExerciseTo: null,
            savedWorkout_selectedExerciseIds: new Set(),
            savedWorkout_searchTerm: '',
            savedWorkout_dialogPlanContextError: null
        });
    };

    const savedWorkout_handleToggleExerciseSelection = (exerciseId: string) => {
        const newSelectedIds = new Set(workoutsState.savedWorkout_selectedExerciseIds);
        if (newSelectedIds.has(exerciseId)) {
            newSelectedIds.delete(exerciseId);
        } else {
            newSelectedIds.add(exerciseId);
        }
        updateWorkoutsState({ savedWorkout_selectedExerciseIds: newSelectedIds });
    };

    const newWorkoutDialog_handleToggleExerciseSelection = (exerciseId: string) => {
        const newSelectedIds = new Set(workoutsState.newWorkoutDialog_selectedExerciseIds);
        if (newSelectedIds.has(exerciseId)) {
            newSelectedIds.delete(exerciseId);
        } else {
            newSelectedIds.add(exerciseId);
        }
        updateWorkoutsState({ newWorkoutDialog_selectedExerciseIds: newSelectedIds });
    };

    const savedWorkout_handleConfirmAddMultipleExercises = async () => {
        if (!workoutsState.savedWorkout_workoutToAddExerciseTo || workoutsState.savedWorkout_selectedExerciseIds.size === 0) return;

        updateWorkoutsState({ savedWorkout_isAddingMultipleExercises: true, savedWorkout_error: null, savedWorkout_successMessage: null });

        const workoutId = workoutsState.savedWorkout_workoutToAddExerciseTo._id.toString();
        const exerciseIdsToAdd = Array.from(workoutsState.savedWorkout_selectedExerciseIds);
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
            }
        }

        updateWorkoutsState({ savedWorkout_isAddingMultipleExercises: false });

        if (errors.length === 0 && successes > 0) {
            updateWorkoutsState({ savedWorkout_successMessage: `${successes} exercise${successes > 1 ? 's' : ''} added successfully to ${workoutsState.savedWorkout_workoutToAddExerciseTo.name}!` });
            await fetchSavedWorkoutsForPlan();
            savedWorkout_handleCloseAddExerciseDialog();
        } else {
            const errorMsg = errors.join('; ');
            updateWorkoutsState({ savedWorkout_error: errorMsg || 'An unknown error occurred while adding exercises.' });
            if (successes > 0) {
                updateWorkoutsState({ savedWorkout_successMessage: `Successfully added ${successes} exercise${successes > 1 ? 's' : ''}. Some exercises failed.` });
                await fetchSavedWorkoutsForPlan();
            }
        }
        clearMessages();
    };

    const savedWorkout_handleRemoveExercise = async (workoutIdToRemoveFrom: string, exerciseIdToRemove: string) => {
        const removingKey = `${workoutIdToRemoveFrom}_${exerciseIdToRemove}`;
        updateWorkoutsState({ savedWorkout_isRemovingExercise: removingKey, savedWorkout_error: null, savedWorkout_successMessage: null });
        try {
            const requestParams: RemoveExerciseFromSavedWorkoutRequest = { workoutId: workoutIdToRemoveFrom, exerciseIdToRemove: exerciseIdToRemove };
            const response = await removeExerciseFromSavedWorkoutApi(requestParams);
            if (response.data && 'error' in response.data) {
                updateWorkoutsState({ savedWorkout_error: `Failed to remove exercise: ${response.data.error}` });
            } else if (response.data) {
                await fetchSavedWorkoutsForPlan();
                updateWorkoutsState({ savedWorkout_successMessage: 'Exercise removed successfully!' });
            } else {
                updateWorkoutsState({ savedWorkout_error: 'Failed to remove exercise: No data returned or unexpected response' });
            }
        } catch (err) {
            updateWorkoutsState({ savedWorkout_error: `An error occurred: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            updateWorkoutsState({ savedWorkout_isRemovingExercise: null });
            clearMessages();
        }
    };

    const savedWorkout_handleOpenAddWorkoutDialog = async () => {
        updateWorkoutsState({
            savedWorkout_newWorkoutNameForAdd: '',
            savedWorkout_addWorkoutError: null,
            newWorkoutDialog_selectedExerciseIds: new Set(),
            newWorkoutDialog_planExercises: [],
            newWorkoutDialog_isLoadingExercises: true,
            newWorkoutDialog_errorLoadingExercises: null,
            savedWorkout_isAddWorkoutDialogOpen: true
        });

        const currentPlanId = planId;
        if (currentPlanId) {
            try {
                const definitionsToFilter: ApiExerciseDefinition[] = generalDefinitionsRef.current;
                if (definitionsToFilter.length === 0) {
                }

                let planExercisesToUse = generalExercisesRef.current;
                if (planExercisesToUse.length === 0 && currentPlanId) {
                    planExercisesToUse = exercises;
                    if (planExercisesToUse.length === 0) {
                        updateWorkoutsState({ newWorkoutDialog_errorLoadingExercises: 'Could not load plan exercises.', newWorkoutDialog_isLoadingExercises: false });
                        return;
                    }
                }

                const exercisesWithDefinitions = planExercisesToUse.map(exercise => {
                    const definitionId = exercise.exerciseDefinitionId.toString();
                    const definitionDetail = definitionsToFilter.find(def => def._id.toString() === definitionId);
                    const definition = definitionDetail || ({
                        _id: 'unknown',
                        name: 'Unknown Exercise',
                        imageUrl: '',
                        primaryMuscle: '',
                        secondaryMuscles: [],
                        bodyWeight: false,
                        type: 'strength',
                        static: false
                    } as unknown as ApiExerciseDefinition);
                    return { exerciseId: exercise._id.toString(), definitionId, definition };
                });
                updateWorkoutsState({ newWorkoutDialog_planExercises: exercisesWithDefinitions });
                if (exercisesWithDefinitions.length === 0) {
                    updateWorkoutsState({ newWorkoutDialog_errorLoadingExercises: "No exercises available in the current plan to add to a new workout." });
                }

            } catch {
                updateWorkoutsState({ newWorkoutDialog_errorLoadingExercises: 'Error loading exercise details. Please try again.' });
            }
        } else {
            updateWorkoutsState({ newWorkoutDialog_errorLoadingExercises: 'Plan context is missing. Cannot load exercises for new workout.' });
        }

        updateWorkoutsState({ newWorkoutDialog_isLoadingExercises: false });
    };

    const savedWorkout_handleCloseAddWorkoutDialog = () => {
        updateWorkoutsState({
            savedWorkout_isAddWorkoutDialogOpen: false,
            savedWorkout_newWorkoutNameForAdd: '',
            savedWorkout_addWorkoutError: null,
            newWorkoutDialog_selectedExerciseIds: new Set(),
            newWorkoutDialog_planExercises: [],
            newWorkoutDialog_errorLoadingExercises: null,
            newWorkoutDialog_searchTerm: ''
        });
    };

    const savedWorkout_handleConfirmAddNewWorkout = async () => {
        if (!planId) {
            updateWorkoutsState({ savedWorkout_addWorkoutError: "Cannot create workout: Training Plan ID is missing." });
            return;
        }
        if (!workoutsState.savedWorkout_newWorkoutNameForAdd.trim()) {
            updateWorkoutsState({ savedWorkout_addWorkoutError: "Workout name cannot be empty." });
            return;
        }

        updateWorkoutsState({ savedWorkout_addWorkoutError: null, savedWorkout_successMessage: null });

        try {
            const selectedExerciseIdsArray = Array.from(workoutsState.newWorkoutDialog_selectedExerciseIds);
            await createSavedWorkout({
                name: workoutsState.savedWorkout_newWorkoutNameForAdd.trim(),
                exerciseIds: selectedExerciseIdsArray,
            });

            updateWorkoutsState({ savedWorkout_successMessage: 'Workout created successfully!' });
            savedWorkout_handleCloseAddWorkoutDialog();
            await fetchSavedWorkoutsForPlan();
        } catch (err) {
            updateWorkoutsState({ savedWorkout_addWorkoutError: `An error occurred: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            clearMessages();
        }
    };

    return {
        savedWorkout_workouts: workoutsState.savedWorkout_workouts,
        savedWorkout_error: workoutsState.savedWorkout_error,
        savedWorkout_successMessage: workoutsState.savedWorkout_successMessage,
        savedWorkout_setSuccessMessage: (message: string | null) => updateWorkoutsState({ savedWorkout_successMessage: message }),
        savedWorkout_setError: (message: string | null) => updateWorkoutsState({ savedWorkout_error: message }),
        savedWorkout_deleteDialogOpen: workoutsState.savedWorkout_deleteDialogOpen,
        savedWorkout_openDeleteDialog,
        savedWorkout_handleDeleteWorkout,
        savedWorkout_setDeleteDialogOpen: (isOpen: boolean) => updateWorkoutsState({ savedWorkout_deleteDialogOpen: isOpen }),
        savedWorkout_workoutToDeleteId: workoutsState.savedWorkout_workoutToDeleteId,
        savedWorkout_renameDialogOpen: workoutsState.savedWorkout_renameDialogOpen,
        savedWorkout_openRenameDialog,
        savedWorkout_handleRenameWorkout,
        savedWorkout_setRenameDialogOpen: (isOpen: boolean) => updateWorkoutsState({ savedWorkout_renameDialogOpen: isOpen }),
        savedWorkout_workoutToRename: workoutsState.savedWorkout_workoutToRename,
        savedWorkout_newWorkoutName: workoutsState.savedWorkout_newWorkoutName,
        savedWorkout_setNewWorkoutName: (name: string) => updateWorkoutsState({ savedWorkout_newWorkoutName: name }),
        savedWorkout_isRenamingWorkoutId: workoutsState.savedWorkout_isRenamingWorkoutId,
        savedWorkout_expandedWorkoutId: workoutsState.savedWorkout_expandedWorkoutId,
        savedWorkout_handleToggleExpand,
        savedWorkout_exerciseDefinitionMap,
        savedWorkout_addExerciseDialogOpen: workoutsState.savedWorkout_addExerciseDialogOpen,
        savedWorkout_handleOpenAddExerciseDialog,
        savedWorkout_handleCloseAddExerciseDialog,
        savedWorkout_workoutToAddExerciseTo: workoutsState.savedWorkout_workoutToAddExerciseTo,
        savedWorkout_searchTerm: workoutsState.savedWorkout_searchTerm,
        savedWorkout_setSearchTerm: (term: string) => updateWorkoutsState({ savedWorkout_searchTerm: term }),
        savedWorkout_isLoadingDialogExercises: workoutsState.savedWorkout_isLoadingDialogExercises,
        savedWorkout_dialogPlanContextError: workoutsState.savedWorkout_dialogPlanContextError,
        savedWorkout_planExercises: workoutsState.savedWorkout_planExercises,
        savedWorkout_handleRemoveExercise,
        savedWorkout_isRemovingExercise: workoutsState.savedWorkout_isRemovingExercise,
        savedWorkout_selectedExerciseIds: workoutsState.savedWorkout_selectedExerciseIds,
        savedWorkout_handleToggleExerciseSelection,
        savedWorkout_handleConfirmAddMultipleExercises,
        savedWorkout_isAddingMultipleExercises: workoutsState.savedWorkout_isAddingMultipleExercises,
        savedWorkout_isAddWorkoutDialogOpen: workoutsState.savedWorkout_isAddWorkoutDialogOpen,
        savedWorkout_handleOpenAddWorkoutDialog,
        savedWorkout_handleCloseAddWorkoutDialog,
        savedWorkout_newWorkoutNameForAdd: workoutsState.savedWorkout_newWorkoutNameForAdd,
        savedWorkout_setNewWorkoutNameForAdd: (name: string) => updateWorkoutsState({ savedWorkout_newWorkoutNameForAdd: name }),
        savedWorkout_addWorkoutError: workoutsState.savedWorkout_addWorkoutError,
        savedWorkout_handleConfirmAddNewWorkout,
        newWorkoutDialog_selectedExerciseIds: workoutsState.newWorkoutDialog_selectedExerciseIds,
        newWorkoutDialog_planExercises: workoutsState.newWorkoutDialog_planExercises,
        newWorkoutDialog_isLoadingExercises: workoutsState.newWorkoutDialog_isLoadingExercises,
        newWorkoutDialog_errorLoadingExercises: workoutsState.newWorkoutDialog_errorLoadingExercises,
        newWorkoutDialog_handleToggleExerciseSelection,
        newWorkoutDialog_searchTerm: workoutsState.newWorkoutDialog_searchTerm,
        setNewWorkoutDialog_searchTerm: (term: string) => updateWorkoutsState({ newWorkoutDialog_searchTerm: term }),
        fetchSavedWorkoutsForPlan,
        clearMessages,
    };
}; 