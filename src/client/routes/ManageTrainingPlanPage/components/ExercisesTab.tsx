import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ExerciseItemCard } from './ExerciseItemCard';
import { LoadingErrorDisplay } from './LoadingErrorDisplay';
import type { ExerciseHooksType } from '../hooks/useExerciseHooks';
import type { ExerciseBase } from '@/apis/exercises/types';
import type { ExerciseDefinition } from '@/apis/exerciseDefinitions/types';

interface ExercisesTabProps {
    planId?: string;
    isPageLoading: boolean;
    planDetails: { name: string } | null;
    error: string | null;
    exercises: ExerciseBase[];
    exerciseHooks: ExerciseHooksType;
    definitionsMapMPE: Record<string, ExerciseDefinition>;
    existingExerciseDefinitionIdsInPlan: string[];
}

export const ExercisesTab: React.FC<ExercisesTabProps> = ({
    isPageLoading,
    planDetails,
    error,
    exercises,
    exerciseHooks,
    definitionsMapMPE
}) => {
    const handleDuplicateWithRefresh = React.useCallback(async (exercise: ExerciseBase) => {
        await exerciseHooks.handleDuplicateExercise(exercise);
    }, [exerciseHooks]);
    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={exerciseHooks.handleOpenExerciseBrowser}
                    disabled={isPageLoading || !planDetails || !!error}
                    data-testid="add-exercise-to-plan-button"
                >
                    Add Exercise
                </Button>
            </Box>
            <LoadingErrorDisplay
                isLoading={isPageLoading}
                error={error && error !== 'Training plan not found.' ? error : null}
            />
            {!isPageLoading && planDetails && (!error || error === 'Training plan not found.') && (
                <Box>
                    {exercises?.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ mb: 2 }}>
                                No exercises found for this plan. Click &quot;Add Exercise&quot; above to get started.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {exercises?.map((exercise) => {
                                const definition = definitionsMapMPE[exercise.exerciseDefinitionId.toString()];
                                return (
                                    <ExerciseItemCard
                                        key={exercise._id.toString()}
                                        exercise={exercise}
                                        definition={definition}
                                        onRequestDelete={exerciseHooks.handleRequestDeleteExercise}
                                        onEdit={exerciseHooks.handleOpenEditForm}
                                        onDuplicate={handleDuplicateWithRefresh}
                                        isDeleting={exerciseHooks.deletingExerciseId === exercise._id.toString()}
                                        isDuplicating={exerciseHooks.duplicatingExerciseId === exercise._id.toString()}
                                    />
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            )}
        </>
    );
}; 