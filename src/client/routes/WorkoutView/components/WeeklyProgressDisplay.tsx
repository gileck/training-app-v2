import React from 'react';
import {
    Box,
    Typography,
    Paper,
    LinearProgress,
    alpha
} from '@mui/material';
import { WeeklyProgressDisplayProps } from './types';

// --- Color constants (can be shared or moved to a theme file later) ---
const LIGHT_PAPER = '#F5F5F7';
const NEON_BLUE = '#3D5AFE';
const NEON_GREEN = '#00C853';

export const WeeklyProgressDisplay: React.FC<WeeklyProgressDisplayProps> = ({
    progressPercentage,
    completedExercisesCount,
    totalExercises
}) => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 4,
                p: 2,
                bgcolor: LIGHT_PAPER,
                borderRadius: 3,
                border: `1px solid ${alpha(NEON_BLUE, 0.2)}`,
                boxShadow: `0 4px 12px ${alpha(NEON_BLUE, 0.1)}`
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: alpha('#000000', 0.8) }}>
                    Weekly Progress
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 'bold',
                        color: progressPercentage >= 100 ? NEON_GREEN : NEON_BLUE
                    }}
                >
                    {progressPercentage.toFixed(0)}%
                </Typography>
            </Box>

            <Box sx={{ position: 'relative', height: 8, mb: 1 }}>
                <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(NEON_BLUE, 0.1),
                        '& .MuiLinearProgress-bar': {
                            bgcolor: progressPercentage >= 100 ? NEON_GREEN : NEON_BLUE,
                            borderRadius: 4
                        }
                    }}
                />
            </Box>

            <Typography
                variant="body2"
                align="center"
                sx={{ color: alpha('#000000', 0.6) }}
            >
                {completedExercisesCount} of {totalExercises} exercises completed
            </Typography>
        </Paper>
    );
}; 