import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    alpha,
    Stack,
    Divider,
    LinearProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
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
    onRemoveExercise: (exerciseId: string) => void;
}

export const LargeExerciseCard: React.FC<LargeExerciseCardProps> = ({ 
    exercise, 
    onIncrementSet, 
    onDecrementSet, 
    onRemoveExercise
}) => {
    const { _id, name, sets: targetSets, reps, weight, comments, definition, progress } = exercise;
    const exerciseId = _id.toString();
    const imageUrl = definition?.imageUrl || '/placeholder-image.jpg';
    const setsCompleted = progress?.setsCompleted || 0;
    const isExerciseComplete = setsCompleted >= targetSets;
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
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ 
                    p: 1.5, 
                    bgcolor: alpha(accentColor, 0.05), // Softer background for header
                    borderBottom: `1px solid ${alpha(accentColor, 0.15)}` 
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: accentColor }}>
                    {name || 'Unnamed Exercise'}
                </Typography>
                <IconButton 
                    onClick={handleRemove} 
                    size="medium" 
                    sx={{ color: alpha('#000000', 0.6), '&:hover': { color: '#FF0000', bgcolor: alpha('#FF0000', 0.1) } }}
                >
                    <CloseIcon fontSize="medium" />
                </IconButton>
            </Stack>

            <Stack 
                direction='row' 
                spacing={{ xs: 1.5, sm: 2 }} 
                sx={{ p: { xs: 1.5, sm: 2 }, alignItems: 'center' }}
            >
                <Box sx={{ 
                    width: { xs: 80, sm: 90 },
                    height: { xs: 80, sm: 90 }, 
                    position: 'relative', 
                    flexShrink: 0, 
                    borderRadius: 1.5, 
                    overflow:'hidden', 
                    bgcolor: alpha(accentColor, 0.03) 
                }}>
                    <Image src={imageUrl} alt={name || 'Exercise'} fill style={{ objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }} />
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ color: alpha('#000000', 0.9), fontWeight: 500, lineHeight: 1.3 }}>
                        {reps} reps {weight != null ? `x ${weight}kg` : '(Bodyweight)'}
                    </Typography>
                    {comments && (
                        <Typography variant="body2" sx={{ color: alpha('#000000', 0.7), fontStyle:'italic', mt: 0.5, lineHeight: 1.2 }}>
                            Comments: {comments}
                        </Typography>
                    )}
                </Box>
            </Stack>

            <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 1 }}>
                <LinearProgress 
                    variant="determinate" 
                    value={(setsCompleted / targetSets) * 100}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(accentColor, 0.1),
                        '& .MuiLinearProgress-bar': {
                            bgcolor: accentColor,
                            borderRadius: 4,
                        }
                    }}
                />
            </Box>

            <Divider sx={{ mx: 2, my: 1, borderStyle: 'dashed' }} />

            <Stack 
                direction="row" 
                justifyContent="space-around" 
                alignItems="center" 
                sx={{ 
                    p: {xs: 1, sm: 1.5},
                    bgcolor: ACTIONS_BG, 
                    borderTop: `1px solid ${ACTIONS_BORDER}` 
                }}
            >
                <IconButton onClick={handleDecrement} disabled={setsCompleted <= 0} sx={{ color: NEON_BLUE, '&.Mui-disabled': { color: alpha(NEON_BLUE, 0.4)} }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: { xs: '2.8rem', sm: '3rem' } }}/>
                </IconButton>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: accentColor, fontSize: {xs: '1.8rem', sm: '2.25rem'} }}>
                    {setsCompleted} / {targetSets}
                </Typography>
                <IconButton onClick={handleIncrement} disabled={setsCompleted >= targetSets} sx={{ color: NEON_BLUE, '&.Mui-disabled': { color: alpha(NEON_BLUE, 0.4)} }}>
                    <AddCircleOutlineIcon sx={{ fontSize: { xs: '2.8rem', sm: '3rem' } }}/>
                </IconButton>
            </Stack>
        </Paper>
    );
}; 