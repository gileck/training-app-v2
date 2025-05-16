import React from 'react';
import { ExerciseFormDialog } from '../dialogs/ExerciseFormDialog';
import { ExerciseDetailsDialog } from '../dialogs/ExerciseDetailsDialog';
import { ConfirmDeleteDialog } from '../dialogs/ConfirmDeleteDialog';
import { SavedWorkoutRenameDialog } from '../dialogs/SavedWorkoutRenameDialog';
import { SavedWorkoutAddExerciseDialog } from '../dialogs/SavedWorkoutAddExerciseDialog';
import { SavedWorkoutAddWorkoutDialog } from '../dialogs/SavedWorkoutAddWorkoutDialog';
import type { ClientWorkoutDisplay } from '../types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';
import type { ExerciseHooksType } from '../hooks/useExerciseHooks';
import type { TrainingPlan } from '@/apis/trainingPlans/types';

interface DialogsSectionProps {
    planId: string | undefined;
    definitionsMapMPE: Record<string, ExerciseDefinition>;
    existingExerciseDefinitionIdsInPlan: string[];
    exerciseHooks: ExerciseHooksType;
    workoutHooks: {
        savedWorkout_deleteDialogOpen: boolean;
        savedWorkout_setDeleteDialogOpen: (isOpen: boolean) => void;
        savedWorkout_handleDeleteWorkout: () => Promise<void>;
        savedWorkout_renameDialogOpen: boolean;
        savedWorkout_workoutToRename: ClientWorkoutDisplay | null;
        savedWorkout_setRenameDialogOpen: (isOpen: boolean) => void;
        savedWorkout_handleRenameWorkout: () => Promise<void>;
        savedWorkout_newWorkoutName: string;
        savedWorkout_setNewWorkoutName: (name: string) => void;
        savedWorkout_isRenamingWorkoutId: string | null;
        savedWorkout_addExerciseDialogOpen: boolean;
        savedWorkout_workoutToAddExerciseTo: ClientWorkoutDisplay | null;
        savedWorkout_handleCloseAddExerciseDialog: () => void;
        savedWorkout_searchTerm: string;
        savedWorkout_setSearchTerm: (term: string) => void;
        savedWorkout_isLoadingDialogExercises: boolean;
        savedWorkout_dialogPlanContextError: string | null;
        savedWorkout_planExercises: Array<{ exerciseId: string; definitionId: string; definition: ExerciseDefinition }>;
        savedWorkout_selectedExerciseIds: Set<string>;
        savedWorkout_handleToggleExerciseSelection: (exerciseId: string) => void;
        savedWorkout_handleConfirmAddMultipleExercises: () => Promise<void>;
        savedWorkout_isAddingMultipleExercises: boolean;
        savedWorkout_isAddWorkoutDialogOpen: boolean;
        savedWorkout_handleCloseAddWorkoutDialog: () => void;
        savedWorkout_handleConfirmAddNewWorkout: () => Promise<void>;
        savedWorkout_newWorkoutNameForAdd: string;
        savedWorkout_setNewWorkoutNameForAdd: (name: string) => void;
        savedWorkout_addWorkoutError: string | null;
        newWorkoutDialog_searchTerm: string;
        setNewWorkoutDialog_searchTerm: (term: string) => void;
        newWorkoutDialog_planExercises: Array<{ exerciseId: string; definitionId: string; definition: ExerciseDefinition }>;
        newWorkoutDialog_isLoadingExercises: boolean;
        newWorkoutDialog_errorLoadingExercises: string | null;
        newWorkoutDialog_selectedExerciseIds: Set<string>;
        newWorkoutDialog_handleToggleExerciseSelection: (exerciseId: string) => void;
    };
    planDetails: TrainingPlan | null;
    isPageLoading: boolean;
}

export const DialogsSection: React.FC<DialogsSectionProps> = ({
    planId,
    definitionsMapMPE,
    existingExerciseDefinitionIdsInPlan,
    exerciseHooks,
    workoutHooks,
    planDetails,
    isPageLoading
}) => {
    return (
        <>
            {exerciseHooks.isExerciseBrowserOpen && (
                <ExerciseFormDialog
                    open={exerciseHooks.isExerciseBrowserOpen}
                    onClose={exerciseHooks.handleBrowserDialogClose}
                    onExerciseSelect={exerciseHooks.handleExerciseSelectFromBrowser}
                    existingExerciseDefinitionIds={existingExerciseDefinitionIdsInPlan}
                />
            )}

            {exerciseHooks.isExerciseDetailsDialogOpen && exerciseHooks.selectedDefinitionForDetails && (
                <ExerciseDetailsDialog
                    open={exerciseHooks.isExerciseDetailsDialogOpen}
                    onClose={exerciseHooks.handleDetailsDialogClose}
                    onSave={exerciseHooks.handleDetailsDialogSave}
                    planId={planId || ''}
                    exerciseDefinition={exerciseHooks.selectedDefinitionForDetails}
                    exerciseToEdit={exerciseHooks.exerciseBeingEdited}
                />
            )}

            {exerciseHooks.isConfirmDeleteExerciseDialogOpen && exerciseHooks.exercisePendingDeletion && (
                <ConfirmDeleteDialog
                    open={exerciseHooks.isConfirmDeleteExerciseDialogOpen}
                    onClose={exerciseHooks.handleConfirmDeleteExerciseDialogClose}
                    onConfirm={exerciseHooks.executeDeleteExercise}
                    itemName={definitionsMapMPE[exerciseHooks.exercisePendingDeletion.exerciseDefinitionId.toString()]?.name || 'Unknown'}
                    itemType="Exercise"
                />
            )}

            {workoutHooks.savedWorkout_deleteDialogOpen && (
                <ConfirmDeleteDialog
                    open={workoutHooks.savedWorkout_deleteDialogOpen}
                    onClose={() => workoutHooks.savedWorkout_setDeleteDialogOpen(false)}
                    onConfirm={workoutHooks.savedWorkout_handleDeleteWorkout}
                    itemName="workout"
                    itemType="workout"
                />
            )}

            {workoutHooks.savedWorkout_renameDialogOpen && workoutHooks.savedWorkout_workoutToRename && (
                <SavedWorkoutRenameDialog
                    open={workoutHooks.savedWorkout_renameDialogOpen}
                    onClose={() => workoutHooks.savedWorkout_setRenameDialogOpen(false)}
                    onConfirm={workoutHooks.savedWorkout_handleRenameWorkout}
                    workoutToRename={workoutHooks.savedWorkout_workoutToRename}
                    newWorkoutName={workoutHooks.savedWorkout_newWorkoutName}
                    onNewWorkoutNameChange={workoutHooks.savedWorkout_setNewWorkoutName}
                    isRenaming={!!workoutHooks.savedWorkout_isRenamingWorkoutId}
                />
            )}

            {workoutHooks.savedWorkout_addExerciseDialogOpen && workoutHooks.savedWorkout_workoutToAddExerciseTo && (
                <SavedWorkoutAddExerciseDialog
                    open={workoutHooks.savedWorkout_addExerciseDialogOpen}
                    onClose={workoutHooks.savedWorkout_handleCloseAddExerciseDialog}
                    workoutToAddExerciseTo={workoutHooks.savedWorkout_workoutToAddExerciseTo}
                    searchTerm={workoutHooks.savedWorkout_searchTerm}
                    onSearchTermChange={workoutHooks.savedWorkout_setSearchTerm}
                    isLoadingDialogExercises={workoutHooks.savedWorkout_isLoadingDialogExercises}
                    dialogPlanContextError={workoutHooks.savedWorkout_dialogPlanContextError}
                    planExercises={workoutHooks.savedWorkout_planExercises}
                    selectedExerciseIds={workoutHooks.savedWorkout_selectedExerciseIds}
                    onToggleExerciseSelection={workoutHooks.savedWorkout_handleToggleExerciseSelection}
                    onConfirmAddMultipleExercises={workoutHooks.savedWorkout_handleConfirmAddMultipleExercises}
                    isAddingMultipleExercises={workoutHooks.savedWorkout_isAddingMultipleExercises}
                />
            )}

            {workoutHooks.savedWorkout_isAddWorkoutDialogOpen && (
                <SavedWorkoutAddWorkoutDialog
                    open={workoutHooks.savedWorkout_isAddWorkoutDialogOpen}
                    onClose={workoutHooks.savedWorkout_handleCloseAddWorkoutDialog}
                    onConfirm={workoutHooks.savedWorkout_handleConfirmAddNewWorkout}
                    planName={planDetails?.name}
                    newWorkoutName={workoutHooks.savedWorkout_newWorkoutNameForAdd}
                    onNewWorkoutNameChange={workoutHooks.savedWorkout_setNewWorkoutNameForAdd}
                    addWorkoutError={workoutHooks.savedWorkout_addWorkoutError}
                    isProcessing={isPageLoading || workoutHooks.newWorkoutDialog_isLoadingExercises}
                    searchTerm={workoutHooks.newWorkoutDialog_searchTerm}
                    onSearchTermChange={workoutHooks.setNewWorkoutDialog_searchTerm}
                    planExercises={workoutHooks.newWorkoutDialog_planExercises}
                    isLoadingExercises={workoutHooks.newWorkoutDialog_isLoadingExercises}
                    errorLoadingExercises={workoutHooks.newWorkoutDialog_errorLoadingExercises}
                    selectedExerciseIds={workoutHooks.newWorkoutDialog_selectedExerciseIds}
                    onToggleExerciseSelection={workoutHooks.newWorkoutDialog_handleToggleExerciseSelection}
                />
            )}
        </>
    );
}; 