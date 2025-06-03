import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import { addExercise, updateExercise } from '@/apis/exercises/client';
import type { AddExerciseRequest, UpdateExerciseRequest, ExerciseBase } from '@/apis/exercises/types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';

interface ExerciseDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (savedExercise: ExerciseBase) => void;
    planId: string;
    exerciseDefinition: ExerciseDefinition | null; // The definition of the exercise to add/edit
    exerciseToEdit?: ExerciseBase | null; // Existing exercise data if in edit mode
}

export const ExerciseDetailsDialog: React.FC<ExerciseDetailsDialogProps> = ({
    open,
    onClose,
    onSave,
    planId,
    exerciseDefinition,
    exerciseToEdit,
}) => {
    const isEditMode = !!exerciseToEdit;

    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [durationSeconds, setDurationSeconds] = useState('');
    const [comments, setComments] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setError(null);
            const isStatic = exerciseDefinition?.static;
            const isBodyweight = exerciseDefinition?.bodyWeight;

            if (isEditMode && exerciseToEdit) {
                setSets(String(exerciseToEdit.sets || ''));
                setReps(isStatic ? '' : String(exerciseToEdit.reps || ''));
                setWeight(isBodyweight ? '' : String(exerciseToEdit.weight ?? ''));
                setDurationSeconds(isStatic ? String(exerciseToEdit.durationSeconds ?? '') : '');
                setComments(exerciseToEdit.comments || '');
            } else {
                setSets('');
                setReps(isStatic ? '' : '');
                setWeight(isBodyweight ? '' : '');
                setDurationSeconds(isStatic ? '' : '');
                setComments('');
            }
        }
    }, [open, exerciseToEdit, isEditMode, exerciseDefinition]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!exerciseDefinition) {
            setError('Exercise definition is missing. Cannot proceed.');
            return;
        }

        const currentDefinitionId = isEditMode ? exerciseToEdit!.exerciseDefinitionId.toString() : exerciseDefinition._id.toString();

        const setsNum = parseInt(sets, 10);
        const repsNum = reps ? parseInt(reps, 10) : 0
        const durationNum = durationSeconds ? parseInt(durationSeconds, 10) : 0; // Default to 0 if duration is empty

        const isStaticExercise = exerciseDefinition?.static === true;

        if (isNaN(setsNum) || setsNum <= 0) {
            setError('Please provide a valid positive number for Sets.');
            return;
        }

        if (!isStaticExercise && (isNaN(repsNum) || repsNum <= 0)) {
            setError('Please provide a valid positive number for Reps for non-static exercises.');
            return;
        }

        if (isStaticExercise && (isNaN(durationNum) || durationNum <= 0)) {
            setError('Please provide a valid positive number for Duration for static exercises.');
            return;
        }

        const weightNum = weight ? parseFloat(weight) : undefined;

        // General validation for weight and duration if they have values
        if ((weight && (isNaN(weightNum as number) || (weightNum as number) < 0))) {
            setError('Weight must be a valid non-negative number if provided.');
            return;
        }
        // Duration validation for positive value is now more specific above for static exercises
        // For non-static, durationNum will be 0 or undefined if field was empty, which is fine.
        // If durationSeconds has a value for a non-static exercise (field was not empty), it should be positive.
        if (!isStaticExercise && durationSeconds && (isNaN(durationNum) || durationNum < 0)) {
            setError('Duration must be a valid non-negative number if provided for non-static exercises.');
            return;
        }

        setIsSubmitting(true);
        try {
            let savedExerciseData: ExerciseBase | null = null;

            const finalReps = isStaticExercise ? 0 : repsNum;
            const finalDuration = isStaticExercise ? durationNum : 0;

            if (isEditMode && exerciseToEdit) {
                const updates: Partial<Omit<ExerciseBase, '_id' | 'exerciseDefinitionId' | 'trainingPlanId' | 'order' | 'name'>> = {};

                if (setsNum !== exerciseToEdit.sets) updates.sets = setsNum;
                // Only update reps if it's not a static exercise and reps have changed
                if (!isStaticExercise && finalReps !== exerciseToEdit.reps) updates.reps = finalReps;
                // Only update duration if it's a static exercise and duration has changed
                if (isStaticExercise && finalDuration !== exerciseToEdit.durationSeconds) updates.durationSeconds = finalDuration;

                // Clear the other field if exercise type changed (e.g. from static to non-static)
                if (isStaticExercise && exerciseToEdit.reps !== 0) updates.reps = 0;
                if (!isStaticExercise && exerciseToEdit.durationSeconds !== 0) updates.durationSeconds = 0;


                if (weightNum !== exerciseToEdit.weight || (weight === '' && exerciseToEdit.weight !== undefined)) {
                    updates.weight = weightNum;
                }

                if (comments !== exerciseToEdit.comments) updates.comments = comments;

                if (Object.keys(updates).length > 0) {
                    const requestData: UpdateExerciseRequest = {
                        exerciseId: exerciseToEdit._id.toString(),
                        trainingPlanId: planId,
                        updates
                    };
                    const response = await updateExercise(requestData);
                    if (response.data && '_id' in response.data) {
                        savedExerciseData = response.data;
                    } else {
                        throw new Error((response.data as { error?: string })?.error || 'Failed to update exercise.');
                    }
                } else {
                    savedExerciseData = exerciseToEdit;
                }
            } else {
                const requestData: AddExerciseRequest = {
                    trainingPlanId: planId,
                    exerciseDefinitionId: currentDefinitionId,
                    sets: setsNum,
                    reps: finalReps,
                    durationSeconds: finalDuration ? finalDuration : undefined,
                    ...(weightNum !== undefined && { weight: weightNum }),
                    ...(comments && { comments }),
                };
                const response = await addExercise(requestData);
                if (response.data && '_id' in response.data) {
                    savedExerciseData = response.data;
                } else {
                    throw new Error((response.data as { error?: string })?.error || 'Failed to add exercise.');
                }
            }

            if (savedExerciseData) {
                onSave(savedExerciseData);
                onClose();
            }

        } catch (err) {
            console.error(`Failed to ${isEditMode ? 'update' : 'add'} exercise:`, err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    // Fallback if exerciseDefinition is somehow null when the dialog is open
    // This condition should ideally be prevented by the parent component's logic
    if (!exerciseDefinition) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">Exercise definition is missing. Cannot display details.</Alert></DialogContent>
                <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
            </Dialog>
        );
    }

    const dialogTitleText = isEditMode
        ? `Edit ${exerciseDefinition.name}`
        : `Add ${exerciseDefinition.name}`;

    const isWeightDisabled = exerciseDefinition?.bodyWeight === true;
    const isStaticExercise = exerciseDefinition?.static === true;
    const isRepsDisabled = isStaticExercise;
    const isDurationDisabled = !isStaticExercise;

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>{dialogTitleText}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    required
                    margin="dense"
                    id={isEditMode ? `edit-sets-${exerciseToEdit?._id}` : `add-sets-${exerciseDefinition._id}`}
                    name="sets"
                    label="Sets"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    disabled={isSubmitting}
                    inputProps={{ min: 1 }}
                />
                <TextField
                    required
                    margin="dense"
                    id={isEditMode ? `edit-reps-${exerciseToEdit?._id}` : `add-reps-${exerciseDefinition._id}`}
                    name="reps"
                    label="Reps"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    disabled={isSubmitting || isRepsDisabled}
                    inputProps={{ min: 1 }}
                    helperText={isRepsDisabled ? "Reps are not applicable for static exercises." : ""}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? `edit-weight-${exerciseToEdit?._id}` : `add-weight-${exerciseDefinition._id}`}
                    name="weight"
                    label="Weight (kg, optional)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={isSubmitting || isWeightDisabled}
                    inputProps={{ step: "any", min: 0 }}
                    helperText={isWeightDisabled ? "Weight is not applicable for bodyweight exercises." : ""}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? `edit-duration-${exerciseToEdit?._id}` : `add-duration-${exerciseDefinition._id}`}
                    label="Duration (seconds, optional)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    disabled={isSubmitting || isDurationDisabled}
                    inputProps={{ min: 0 }}
                    helperText={isDurationDisabled ? "Duration is not applicable for non-static exercises." :
                        (isStaticExercise ? "Enter duration for this static hold." : "")}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? `edit-comments-${exerciseToEdit?._id}` : `add-comments-${exerciseDefinition._id}`}
                    label="Comments (optional)"
                    type="text"
                    fullWidth
                    multiline
                    rows={2}
                    variant="standard"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={isSubmitting}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} data-testid="save-exercise-button">
                    {isSubmitting ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Exercise')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 