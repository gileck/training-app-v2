import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { WorkoutExercise } from '@/client/types/workout';

interface LargeExerciseCardProps {
    exercise: WorkoutExercise;
    onIncrementSet: (exerciseId: string) => void;
    onDecrementSet: (exerciseId: string) => void;
    onCompleteExercise: (exerciseId: string) => void;
}

export const LargeExerciseCard: React.FC<LargeExerciseCardProps> = ({ 
    exercise, 
    onIncrementSet, 
    onDecrementSet, 
    onCompleteExercise 
}) => {
    const { _id, name, sets: targetSets, reps, weight, durationSeconds, definition, progress } = exercise;
    const exerciseId = _id.toString();
    const imageUrl = definition?.imageUrl || '/placeholder-image.jpg';
    const setsCompleted = progress?.setsCompleted || 0;

    const handleIncrement = () => {
        if (setsCompleted < targetSets) {
            onIncrementSet(exerciseId);
        }
    };

    const handleDecrement = () => {
        if (setsCompleted > 0) {
            onDecrementSet(exerciseId);
        }
    };

    const handleComplete = () => {
        onCompleteExercise(exerciseId);
    };

    return (
        <Card sx={{ display: 'flex', mb: 2, alignItems: 'center', p: 1, position: 'relative' }}>
            <CardMedia
                component="img"
                sx={{ width: 100, height: 100, objectFit: 'contain', mr: 2, borderRadius: 1 }}
                image={imageUrl}
                alt={name || 'Exercise'}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <CardContent sx={{ flex: '1 0 auto', p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography component="div" variant="h6">
                        {name || 'Unnamed Exercise'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                        Target: {targetSets} sets x {reps} reps
                    </Typography>
                    {weight != null && (
                        <Typography variant="body2" color="text.secondary" component="div">
                            Weight: {weight}kg
                        </Typography>
                    )}
                    {durationSeconds != null && (
                        <Typography variant="body2" color="text.secondary" component="div">
                            Duration: {durationSeconds}s
                        </Typography>
                    )}
                    <Typography variant="h6" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                        Sets: {setsCompleted} / {targetSets}
                    </Typography>
                </CardContent>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', p: 1, alignSelf:'stretch' }}>
                <IconButton onClick={handleIncrement} disabled={setsCompleted >= targetSets} size="large" color="primary">
                    <AddCircleOutlineIcon fontSize="large" />
                </IconButton>
                <IconButton onClick={handleDecrement} disabled={setsCompleted <= 0} size="large" color="secondary">
                    <RemoveCircleOutlineIcon fontSize="large" />
                </IconButton>
                <IconButton onClick={handleComplete} disabled={setsCompleted >= targetSets} size="large" sx={{color: 'green'}}>
                    <CheckCircleIcon fontSize="large" />
                </IconButton>
            </Box>
        </Card>
    );
}; 