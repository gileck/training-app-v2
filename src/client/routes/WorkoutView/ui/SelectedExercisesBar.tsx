import React from 'react';
import {
    Typography,
    Button,
    Paper,
    alpha
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { SelectedExercisesBarProps } from './types';

// --- Color constants ---
const LIGHT_PAPER = '#F5F5F7'; // Or get from theme
const NEON_PURPLE = '#9C27B0';
const NEON_GREEN = '#00C853';

export const SelectedExercisesBar: React.FC<SelectedExercisesBarProps> = ({
    selectedExercises,
    activeTab,
    handleStartWorkout
}) => {
    if (selectedExercises.length === 0 || activeTab !== 0) {
        return null;
    }

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'fixed',
                bottom: 72, // Increased to position above bottom navbar
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: 500,
                p: 2,
                borderRadius: 3,
                zIndex: 100,
                bgcolor: alpha(LIGHT_PAPER, 0.95),
                border: `1px solid ${alpha(NEON_PURPLE, 0.3)}`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 5px 15px ${alpha(NEON_PURPLE, 0.2)}`
            }}
        >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                {selectedExercises.length} {selectedExercises.length === 1 ? 'Exercise' : 'Exercises'} Selected
            </Typography>
            <Button
                variant="contained"
                onClick={handleStartWorkout}
                startIcon={<FlashOnIcon />}
                fullWidth
                sx={{
                    py: 1,
                    bgcolor: NEON_GREEN,
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: 8,
                    textTransform: 'none',
                    boxShadow: `0 4px 12px ${alpha(NEON_GREEN, 0.3)}`,
                    '&:hover': {
                        bgcolor: alpha(NEON_GREEN, 0.9),
                        boxShadow: `0 6px 14px ${alpha(NEON_GREEN, 0.4)}`
                    }
                }}
            >
                Start Workout
            </Button>
        </Paper>
    );
}; 