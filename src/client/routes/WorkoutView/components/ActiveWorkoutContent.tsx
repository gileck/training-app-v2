import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { WorkoutExercise } from '@/client/types/workout';
import { LargeExerciseCard } from './LargeExerciseCard';

interface ActiveWorkoutContentProps {
    exercises: WorkoutExercise[];
    workoutName?: string | null;
    onIncrementSet: (exerciseId: string) => void;
    onDecrementSet: (exerciseId: string) => void;
    onCompleteExercise: (exerciseId: string) => void;
    onEndWorkout: () => void;
    onRemoveExerciseFromSession: (exerciseId: string) => void;
}

export const ActiveWorkoutContent: React.FC<ActiveWorkoutContentProps> = ({ 
    exercises, 
    workoutName, 
    onIncrementSet,
    onDecrementSet,
    onCompleteExercise,
    onEndWorkout,
    onRemoveExerciseFromSession
}) => {
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', flexGrow: 1, textAlign: 'center' }}>
                        {workoutName}
                    </Typography>
                    <Button 
                        variant="outlined"
                        color="error"
                        onClick={onEndWorkout}
                        sx={{ textTransform: 'none', fontWeight: 'bold' }}
                    >
                        End Workout
                    </Button>
                </Box>
            )}
            {!workoutName && (
                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                     <Button variant="outlined" color="error" onClick={onEndWorkout} sx={{ textTransform: 'none', fontWeight: 'bold' }}>End Workout</Button>
                 </Box>
            )}
            {exercises.map((exercise) => (
                <LargeExerciseCard 
                    key={exercise._id.toString()} 
                    exercise={exercise} 
                    onIncrementSet={onIncrementSet}
                    onDecrementSet={onDecrementSet}
                    onCompleteExercise={onCompleteExercise}
                    onRemoveExercise={onRemoveExerciseFromSession}
                />
            ))}
        </Box>
    );
}; 