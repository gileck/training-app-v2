import React, { useState, useEffect, useMemo } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import { addExercise, updateExercise } from '@/apis/exercises/client'; // Import both add and update
import { getAllExerciseDefinitionOptions } from '@/apis/exerciseDefinitions/client';
// Use AddExerciseRequest for add, UpdateExerciseRequest for update
import type { AddExerciseRequest, UpdateExerciseRequest, ExerciseBase } from '@/apis/exercises/types';
import type { ExerciseDefinitionOption } from '@/apis/exerciseDefinitions/types';

interface ExerciseFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (savedExercise: ExerciseBase) => void; // Consolidated callback
    exerciseToEdit?: ExerciseBase | null; // Make optional for add mode
    planId: string;
}

// Renamed component
export const ExerciseFormDialog: React.FC<ExerciseFormDialogProps> = ({
    open,
    onClose,
    onSave,
    exerciseToEdit,
    planId
}) => {
    const isEditMode = !!exerciseToEdit;

    // Form state (remains mostly the same)
    const [selectedDefinition, setSelectedDefinition] = useState<ExerciseDefinitionOption | null>(null);
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [restTimeSeconds, setRestTimeSeconds] = useState('');
    const [comments, setComments] = useState('');

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Definition fetching state
    const [definitions, setDefinitions] = useState<ExerciseDefinitionOption[]>([]);
    const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch definitions when dialog opens
    useEffect(() => {
        if (open) {
            setIsLoadingDefinitions(true);
            setFetchError(null);
            getAllExerciseDefinitionOptions()
                .then(response => {
                    if (response.data && Array.isArray(response.data)) {
                        setDefinitions(response.data);
                        // Pre-select definition only if editing
                        if (isEditMode && exerciseToEdit) {
                            const currentDef = response.data.find(def => def._id === exerciseToEdit.exerciseDefinitionId.toString());
                            setSelectedDefinition(currentDef || null);
                        }
                    } else {
                        throw new Error('Invalid data format for definitions');
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch exercise definitions:", err);
                    setFetchError(err instanceof Error ? err.message : 'Failed to load definitions');
                    setDefinitions([]);
                })
                .finally(() => {
                    setIsLoadingDefinitions(false);
                });
        }
    }, [open, isEditMode, exerciseToEdit]); // Depend on isEditMode too

    // Pre-fill or reset form based on mode and exerciseToEdit
    useEffect(() => {
        if (open && isEditMode && exerciseToEdit) {
            // Pre-fill for edit mode
            setSets(String(exerciseToEdit.sets || ''));
            setReps(String(exerciseToEdit.reps || ''));
            setWeight(String(exerciseToEdit.weight ?? ''));
            setRestTimeSeconds(String(exerciseToEdit.restTimeSeconds ?? ''));
            setComments(exerciseToEdit.comments || '');
            // Definition is selected in the fetch effect
            setError(null); // Clear errors when switching to edit
            setFetchError(null);
        } else if (open && !isEditMode) {
            // Reset for add mode
            setSelectedDefinition(null);
            setSets('');
            setReps('');
            setWeight('');
            setRestTimeSeconds('');
            setComments('');
            setError(null);
            setFetchError(null);
            setIsSubmitting(false);
        }
        // When closing (open becomes false), reset common fields
        if (!open) {
            setSelectedDefinition(null);
            setSets('');
            setReps('');
            setWeight('');
            setRestTimeSeconds('');
            setComments('');
            setError(null);
            setFetchError(null);
            setIsSubmitting(false);
            // Keep definitions loaded
        }
    }, [open, isEditMode, exerciseToEdit]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const setsNum = parseInt(sets, 10);
        const repsNum = parseInt(reps, 10);
        const weightNum = weight ? parseFloat(weight) : undefined;
        const restTimeNum = restTimeSeconds ? parseInt(restTimeSeconds, 10) : undefined;

        if (!selectedDefinition?._id || !sets || !reps || isNaN(setsNum) || isNaN(repsNum)) {
            setError('Please select an Exercise Definition and provide valid Sets and Reps.');
            return;
        }
        if ((weight && isNaN(weightNum as number)) || (restTimeSeconds && isNaN(restTimeNum as number))) {
            setError('Weight and Rest Time must be valid numbers if provided.');
            return;
        }

        setIsSubmitting(true);
        try {
            let savedExerciseData: ExerciseBase | null = null;

            if (isEditMode && exerciseToEdit) {
                // --- UPDATE Logic --- 
                const updates: Partial<ExerciseBase> = {};
                // Compare with original exerciseToEdit to build updates object if needed,
                // or just send all fields as done previously for simplicity.
                updates.sets = setsNum;
                updates.reps = repsNum;
                updates.weight = weightNum;
                updates.restTimeSeconds = restTimeNum;
                updates.comments = comments;
                // Definition ID cannot be changed in edit mode here

                const requestData: UpdateExerciseRequest = {
                    exerciseId: exerciseToEdit._id.toString(),
                    trainingPlanId: planId,
                    updates
                };
                const response = await updateExercise(requestData);
                if (response.data && '_id' in response.data) {
                    savedExerciseData = response.data;
                } else {
                    // Check for error structure
                    const errorMessage = (typeof response.data === 'object' && response.data !== null && 'error' in response.data)
                        ? String((response.data as { error: string }).error)
                        : 'Failed to update exercise.';
                    throw new Error(errorMessage);
                }
            } else {
                // --- ADD Logic --- 
                const requestData: AddExerciseRequest = {
                    trainingPlanId: planId,
                    exerciseDefinitionId: selectedDefinition._id,
                    sets: setsNum,
                    reps: repsNum,
                    ...(weightNum !== undefined && { weight: weightNum }),
                    ...(restTimeNum !== undefined && { restTimeSeconds: restTimeNum }),
                    ...(comments && { comments }),
                };
                const response = await addExercise(requestData);
                if (response.data && '_id' in response.data) {
                    savedExerciseData = response.data;
                } else {
                    // Check for error structure
                    const errorMessage = (typeof response.data === 'object' && response.data !== null && 'error' in response.data)
                        ? String((response.data as { error: string }).error)
                        : 'Failed to add exercise.';
                    throw new Error(errorMessage);
                }
            }

            if (savedExerciseData) {
                onSave(savedExerciseData); // Call unified save callback
                onClose(); // Close dialog on success
            }

        } catch (err) {
            console.error(`Failed to ${isEditMode ? 'update' : 'add'} exercise:`, err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const definitionOptions = useMemo(() => definitions, [definitions]);

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>{isEditMode ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {fetchError && <Alert severity="warning" sx={{ mb: 2 }}>{fetchError}</Alert>}

                <Autocomplete
                    id="exerciseDefinitionId-autocomplete"
                    options={definitionOptions}
                    getOptionLabel={(option) => option.name}
                    value={selectedDefinition}
                    onChange={(event, newValue) => {
                        // Allow changing definition only in add mode
                        if (!isEditMode) {
                            setSelectedDefinition(newValue);
                        }
                    }}
                    isOptionEqualToValue={(option, value) => option?._id === value?._id}
                    loading={isLoadingDefinitions}
                    disabled={isSubmitting || isEditMode} // Disable if submitting OR in edit mode
                    fullWidth
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Exercise Definition"
                            variant="standard"
                            required
                            margin="dense"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {isLoadingDefinitions ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                            // Indicate visually that it's not changeable in edit mode
                            helperText={isEditMode ? "Definition cannot be changed during edit." : ""}
                        />
                    )}
                />
                {/* Other TextFields (ensure unique IDs if needed, but labels differentiate) */}
                <TextField
                    required
                    margin="dense"
                    id={isEditMode ? "edit-sets" : "add-sets"}
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
                    id={isEditMode ? "edit-reps" : "add-reps"}
                    label="Reps"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    disabled={isSubmitting}
                    inputProps={{ min: 1 }}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? "edit-weight" : "add-weight"}
                    label="Weight (kg, optional)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={isSubmitting}
                    inputProps={{ step: "any" }}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? "edit-restTimeSeconds" : "add-restTimeSeconds"}
                    label="Rest Time (seconds, optional)"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={restTimeSeconds}
                    onChange={(e) => setRestTimeSeconds(e.target.value)}
                    disabled={isSubmitting}
                    inputProps={{ min: 0 }}
                />
                <TextField
                    margin="dense"
                    id={isEditMode ? "edit-comments" : "add-comments"}
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
                <Button type="submit" disabled={isSubmitting || isLoadingDefinitions}>
                    {isSubmitting ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Exercise')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 