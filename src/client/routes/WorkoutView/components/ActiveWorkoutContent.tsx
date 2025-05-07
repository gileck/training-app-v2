import React from 'react';
import { Box, Typography } from '@mui/material';
import { WorkoutExercise } from '@/client/types/workout';
import { LargeExerciseCard } from './LargeExerciseCard';

interface ActiveWorkoutContentProps {
    exercises: WorkoutExercise[];
    workoutName?: string | null; // Allow null to match the state type
    onIncrementSet: (exerciseId: string) => void;
    onDecrementSet: (exerciseId: string) => void;
    onCompleteExercise: (exerciseId: string) => void;
}

export const ActiveWorkoutContent: React.FC<ActiveWorkoutContentProps> = ({ exercises, workoutName, onIncrementSet, onDecrementSet, onCompleteExercise }) => {
    if (!exercises || exercises.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No exercises in this workout session.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pt: 2 }}>
            {workoutName && (
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold' }}>
                    {workoutName}
                </Typography>
            )}
            {exercises.map((exercise) => (
                <LargeExerciseCard 
                    key={exercise._id.toString()} 
                    exercise={exercise} 
                    onIncrementSet={onIncrementSet}
                    onDecrementSet={onDecrementSet}
                    onCompleteExercise={onCompleteExercise}
                />
            ))}
        </Box>
    );
}; 