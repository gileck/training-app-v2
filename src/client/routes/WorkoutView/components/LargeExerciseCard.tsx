import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    LinearProgress,
    alpha,
    Stack
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { WorkoutExercise } from '@/client/types/workout';

// Neon color constants (can be moved to a shared theme file later)
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';
const LIGHT_CARD_BG = '#FFFFFF'; // Consistent with WorkoutExerciseItem
const ACTIONS_BG = alpha(NEON_BLUE, 0.08); // Background for actions area
const ACTIONS_BORDER = alpha(NEON_BLUE, 0.3);

interface LargeExerciseCardProps {
    exercise: WorkoutExercise;
    onIncrementSet: (exerciseId: string) => void;
    onDecrementSet: (exerciseId: string) => void;
    onCompleteExercise: (exerciseId: string) => void;
    onRemoveExercise: (exerciseId: string) => void;
}

export const LargeExerciseCard: React.FC<LargeExerciseCardProps> = ({ 
    exercise, 
    onIncrementSet, 
    onDecrementSet, 
    onCompleteExercise,
    onRemoveExercise
}) => {
    const { _id, name, sets: targetSets, reps, weight, durationSeconds, definition, progress, comments } = exercise;
    const exerciseId = _id.toString();
    const imageUrl = definition?.imageUrl || '/placeholder-image.jpg';
    const setsCompleted = progress?.setsCompleted || 0;
    const isExerciseComplete = setsCompleted >= targetSets;

    const progressPercent = targetSets > 0 ? (setsCompleted / targetSets) * 100 : 0;
    const accentColor = isExerciseComplete ? NEON_GREEN : NEON_BLUE;

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

    const handleRemove = () => {
        onRemoveExercise(exerciseId);
    };

    return (
        <Paper
            elevation={2}
            sx={{
                mb: 2.5,
                bgcolor: LIGHT_CARD_BG,
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha(accentColor, 0.3)}`,
                boxShadow: `0 4px 12px ${alpha(accentColor, 0.15)}`,
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: alpha(accentColor, 0.08), borderBottom: `1px solid ${alpha(accentColor, 0.2)}` }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: accentColor }}>
                    {name || 'Unnamed Exercise'}
                </Typography>
                <IconButton onClick={handleRemove} size="small" sx={{ color: alpha('#000000', 0.5), '&:hover': { color: 'red' } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>

            <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                    height: 5,
                    bgcolor: alpha(accentColor, 0.15),
                    '& .MuiLinearProgress-bar': { bgcolor: accentColor }
                }}
            />

            <Stack direction='row' spacing={{ xs: 1, sm: 2 }} sx={{ p: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    position: 'relative', 
                    flexShrink: 0, 
                    borderRadius: 1, 
                    overflow:'hidden', 
                    bgcolor: alpha(accentColor, 0.05) 
                }}>
                    <Image src={imageUrl} alt={name || 'Exercise'} fill style={{ objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }} />
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="body1" sx={{ color: alpha('#000000', 0.8), fontWeight: 'medium' }}>
                        Target: {targetSets} sets x {reps} reps
                    </Typography>
                    {weight != null && (
                        <Typography variant="body2" sx={{ color: alpha('#000000', 0.7) }}>Weight: {weight}kg</Typography>
                    )}
                    {durationSeconds != null && (
                        <Typography variant="body2" sx={{ color: alpha('#000000', 0.7) }}>Duration: {durationSeconds}s</Typography>
                    )}
                    {comments && (
                        <Typography variant="caption" sx={{ color: alpha('#000000', 0.6), display:'block', fontStyle:'italic' }}>Comments: {comments}</Typography>
                    )}
                    <Typography variant="h6" component="div" sx={{ mt: {xs: 0.5, sm:1}, fontWeight: 'bold', color: accentColor, fontSize: {xs: '1rem', sm: '1.25rem'} }}>
                        Sets Done: {setsCompleted} / {targetSets}
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ 
                p: 1.5, 
                bgcolor: ACTIONS_BG, 
                borderTop: `1px solid ${ACTIONS_BORDER}`,
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center' 
            }}>
                <IconButton onClick={handleIncrement} disabled={setsCompleted >= targetSets} size="large" sx={{ color: NEON_BLUE, '&.Mui-disabled': { color: alpha(NEON_BLUE, 0.3)} }}>
                    <AddCircleOutlineIcon sx={{ fontSize: {xs: '2.2rem', sm: '2.8rem'} }}/>
                </IconButton>
                <IconButton onClick={handleDecrement} disabled={setsCompleted <= 0} size="large" sx={{ color: NEON_BLUE, '&.Mui-disabled': { color: alpha(NEON_BLUE, 0.3)} }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: {xs: '2.2rem', sm: '2.8rem'} }}/>
                </IconButton>
                <IconButton onClick={handleComplete} disabled={isExerciseComplete} size="large" sx={{ color: NEON_GREEN, '&.Mui-disabled': { color: alpha(NEON_GREEN, 0.3)} }}>
                    <CheckCircleIcon sx={{ fontSize: {xs: '2.2rem', sm: '2.8rem'} }}/>
                </IconButton>
            </Box>
        </Paper>
    );
}; 