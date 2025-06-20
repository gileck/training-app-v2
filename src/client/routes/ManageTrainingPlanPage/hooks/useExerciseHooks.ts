import { useState, useCallback, useEffect } from 'react';
import { useExercises } from '@/client/hooks/useTrainingData';
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
import type { ExerciseBase } from '@/common/types/training';
import type { ExerciseDefinition as ApiExerciseDefinitionMPE } from '@/apis/exerciseDefinitions/types';

interface ExerciseState {
    deletingExerciseId: string | null;
    duplicatingExerciseId: string | null;
    isExerciseBrowserOpen: boolean;
    isExerciseDetailsDialogOpen: boolean;
    selectedDefinitionForDetails: ApiExerciseDefinitionMPE | null;
    exerciseBeingEdited: ExerciseBase | null;
    isConfirmDeleteExerciseDialogOpen: boolean;
    exercisePendingDeletion: ExerciseBase | null;
    exercises: ExerciseBase[];
    definitions: ApiExerciseDefinitionMPE[];
    error: string | null;
}

const getDefaultExerciseState = (): ExerciseState => ({
    deletingExerciseId: null,
    duplicatingExerciseId: null,
    isExerciseBrowserOpen: false,
    isExerciseDetailsDialogOpen: false,
    selectedDefinitionForDetails: null,
    exerciseBeingEdited: null,
    isConfirmDeleteExerciseDialogOpen: false,
    exercisePendingDeletion: null,
    exercises: [],
    definitions: [],
    error: null,
});

export type ExerciseHooksType = ReturnType<typeof useExerciseHooks>;

export const useExerciseHooks = (planId: string | undefined) => {
    const [exerciseState, setExerciseState] = useState<ExerciseState>(getDefaultExerciseState());
    const exerciseContext = useExercises(planId || '');
    const { exercises, error: contextError, deleteExercise, createExercise, loadExercises } = planId ? exerciseContext : {
        exercises: [],
        error: null,
        deleteExercise: () => Promise.reject('No plan ID'),
        createExercise: () => Promise.reject('No plan ID'),
        loadExercises: () => Promise.reject('No plan ID')
    };

    const updateExerciseState = useCallback((partialState: Partial<ExerciseState>) => {
        setExerciseState(prevState => ({ ...prevState, ...partialState }));
    }, []);

    // Update local state with context data
    useEffect(() => {
        updateExerciseState({ exercises, error: contextError });
    }, [exercises, contextError, updateExerciseState]);

    const fetchExercisesTabData = useCallback(async () => {
        if (!planId) {
            updateExerciseState({ error: "Training Plan ID not found in URL parameters." });
            return Promise.reject("Training Plan ID not found");
        }
        updateExerciseState({ error: null });
        try {
            const allDefinitionsResponse = await getAllExerciseDefinitionOptions();

            if (allDefinitionsResponse.data && Array.isArray(allDefinitionsResponse.data)) {
                const defsData = allDefinitionsResponse.data as ApiExerciseDefinitionMPE[];
                updateExerciseState({ definitions: defsData });
            } else {
                console.warn("Could not load exercise definitions.");
                updateExerciseState({ definitions: [] });
            }
            return Promise.resolve();
        } catch (err) {
            console.error("Failed to fetch exercise data:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred for Exercises Tab';
            updateExerciseState({ error: errorMessage, definitions: [] });
            return Promise.reject(errorMessage);
        }
    }, [planId, updateExerciseState]);

    useEffect(() => {
        if (planId) {
            fetchExercisesTabData();
        }
    }, [planId, fetchExercisesTabData]);

    const handleRequestDeleteExercise = useCallback((exercise: ExerciseBase) => {
        updateExerciseState({ exercisePendingDeletion: exercise, isConfirmDeleteExerciseDialogOpen: true });
    }, [updateExerciseState]);

    const handleConfirmDeleteExerciseDialogClose = useCallback(() => {
        updateExerciseState({ isConfirmDeleteExerciseDialogOpen: false, exercisePendingDeletion: null });
    }, [updateExerciseState]);

    const executeDeleteExercise = useCallback(async (loadInitialPageData?: () => Promise<void>) => {
        if (!exerciseState.exercisePendingDeletion || !planId) {
            updateExerciseState({ error: "Cannot delete exercise: Missing exercise data or Plan ID.", isConfirmDeleteExerciseDialogOpen: false, exercisePendingDeletion: null });
            return;
        }
        const exerciseIdToDelete = exerciseState.exercisePendingDeletion._id.toString();
        updateExerciseState({ deletingExerciseId: exerciseIdToDelete, error: null, isConfirmDeleteExerciseDialogOpen: false });

        try {
            await deleteExercise(exerciseIdToDelete);
            if (loadInitialPageData) {
                await loadInitialPageData();
            }
        } catch (err) {
            console.error("Failed to delete exercise:", err);
            updateExerciseState({ error: err instanceof Error ? err.message : 'An unknown error occurred during deletion' });
        } finally {
            updateExerciseState({ deletingExerciseId: null, exercisePendingDeletion: null });
        }
    }, [planId, exerciseState.exercisePendingDeletion, updateExerciseState, deleteExercise]);

    const handleDuplicateExercise = useCallback(async (exerciseToDuplicate: ExerciseBase, loadInitialPageData?: () => Promise<void>) => {
        if (!planId) {
            updateExerciseState({ error: "Cannot duplicate exercise without Plan ID." });
            return;
        }
        updateExerciseState({ duplicatingExerciseId: exerciseToDuplicate._id.toString(), error: null });
        try {
            const exerciseData: {
                trainingPlanId: string;
                exerciseDefinitionId: string;
                sets: number;
                reps: number;
                weight?: number;
                durationSeconds?: number;
                comments?: string;
            } = {
                trainingPlanId: planId,
                exerciseDefinitionId: exerciseToDuplicate.exerciseDefinitionId.toString(),
                sets: exerciseToDuplicate.sets,
                reps: exerciseToDuplicate.reps,
            };

            // Only add optional fields if they have values
            if (exerciseToDuplicate.weight !== undefined && exerciseToDuplicate.weight !== null) {
                exerciseData.weight = exerciseToDuplicate.weight;
            }
            if (exerciseToDuplicate.durationSeconds !== undefined && exerciseToDuplicate.durationSeconds !== null) {
                exerciseData.durationSeconds = exerciseToDuplicate.durationSeconds;
            }
            if (exerciseToDuplicate.comments !== undefined && exerciseToDuplicate.comments !== null && exerciseToDuplicate.comments.trim() !== '') {
                exerciseData.comments = exerciseToDuplicate.comments;
            }

            await createExercise(exerciseData);
            if (loadInitialPageData) {
                await loadInitialPageData();
            }
        } catch (err) {
            console.error("Failed to duplicate exercise:", err);
            updateExerciseState({ error: err instanceof Error ? err.message : 'An unknown error occurred during duplication' });
        } finally {
            updateExerciseState({ duplicatingExerciseId: null });
        }
    }, [planId, updateExerciseState, createExercise]);

    const handleOpenExerciseBrowser = useCallback(() => {
        updateExerciseState({ exerciseBeingEdited: null, isExerciseBrowserOpen: true });
    }, [updateExerciseState]);

    const handleOpenEditForm = useCallback((exercise: ExerciseBase) => {
        const definition = exerciseState.definitions.find(def => def._id.toString() === exercise.exerciseDefinitionId.toString());
        if (definition) {
            updateExerciseState({
                selectedDefinitionForDetails: definition,
                exerciseBeingEdited: exercise,
                isExerciseDetailsDialogOpen: true
            });
        }
        else {
            updateExerciseState({ error: "Could not find the definition for the exercise to edit." });
        }
    }, [exerciseState.definitions, updateExerciseState]);

    const handleBrowserDialogClose = useCallback(() => {
        updateExerciseState({ isExerciseBrowserOpen: false });
    }, [updateExerciseState]);

    const handleExerciseSelectFromBrowser = useCallback((definition: ApiExerciseDefinitionMPE) => {
        updateExerciseState({
            selectedDefinitionForDetails: definition,
            exerciseBeingEdited: null,
            isExerciseDetailsDialogOpen: true,
            isExerciseBrowserOpen: false
        });
    }, [updateExerciseState]);

    const handleDetailsDialogSave = useCallback(async (exerciseData: ExerciseBase) => {
        setExerciseState(prevState => {
            const isEditing = prevState.exerciseBeingEdited !== null;
            
            let updatedExercises;
            if (isEditing) {
                // Update existing exercise
                updatedExercises = prevState.exercises.map(ex => 
                    ex._id === exerciseData._id ? exerciseData : ex
                );
            } else {
                // Add new exercise
                updatedExercises = [...prevState.exercises, exerciseData];
            }
            
            return {
                ...prevState,
                exercises: updatedExercises,
                exerciseBeingEdited: null,
                isExerciseDetailsDialogOpen: false,
                selectedDefinitionForDetails: null
            };
        });
    }, []);

    const handleDetailsDialogClose = useCallback(() => {
        updateExerciseState({
            isExerciseDetailsDialogOpen: false,
            selectedDefinitionForDetails: null,
            exerciseBeingEdited: null
        });
    }, [updateExerciseState]);

    const setError = useCallback((newError: string | null) => {
        updateExerciseState({ error: newError });
    }, [updateExerciseState]);

    return {
        exercises: exerciseState.exercises,
        definitions: exerciseState.definitions,
        error: exerciseState.error,
        setError,
        isExerciseBrowserOpen: exerciseState.isExerciseBrowserOpen,
        handleOpenExerciseBrowser,
        handleBrowserDialogClose,
        isExerciseDetailsDialogOpen: exerciseState.isExerciseDetailsDialogOpen,
        selectedDefinitionForDetails: exerciseState.selectedDefinitionForDetails,
        exerciseBeingEdited: exerciseState.exerciseBeingEdited,
        handleOpenEditForm,
        handleExerciseSelectFromBrowser,
        handleDetailsDialogSave,
        handleDetailsDialogClose,
        isConfirmDeleteExerciseDialogOpen: exerciseState.isConfirmDeleteExerciseDialogOpen,
        exercisePendingDeletion: exerciseState.exercisePendingDeletion,
        handleRequestDeleteExercise,
        handleConfirmDeleteExerciseDialogClose,
        executeDeleteExercise,
        deletingExerciseId: exerciseState.deletingExerciseId,
        handleDuplicateExercise,
        duplicatingExerciseId: exerciseState.duplicatingExerciseId,
        fetchExercisesTabData,
        loadExercises,
    };
}; 