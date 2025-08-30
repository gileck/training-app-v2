import React from 'react';
import {
    Typography,
    Button,
    Paper,
    alpha
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { SelectedExercisesBarProps } from './types';
import { useTheme } from '@mui/material/styles';

// Colors are derived from the theme to support light/dark modes

export const SelectedExercisesBar: React.FC<SelectedExercisesBarProps> = ({
    selectedExercises,
    activeTab,
    handleStartWorkout
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const paperBg = alpha(theme.palette.background.paper, isDark ? 0.85 : 0.95);
    const borderColor = alpha(theme.palette.primary.main, isDark ? 0.35 : 0.3);
    const shadowColor = alpha(theme.palette.primary.main, isDark ? 0.35 : 0.2);
    const successColor = theme.palette.success.main;
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
                p: 0,
                borderRadius: 8,
                zIndex: 100,
                bgcolor: paperBg,
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 5px 15px ${shadowColor}`
            }}
        >

            <Button
                variant="contained"
                onClick={handleStartWorkout}
                startIcon={<FlashOnIcon />}
                fullWidth
                sx={{
                    py: 1,
                    bgcolor: successColor,
                    color: theme.palette.getContrastText(successColor),
                    fontWeight: 'bold',
                    borderRadius: 8,
                    textTransform: 'none',
                    boxShadow: `0 4px 12px ${alpha(successColor, isDark ? 0.45 : 0.3)}`,
                    '&:hover': {
                        bgcolor: alpha(successColor, isDark ? 0.85 : 0.9),
                        boxShadow: `0 6px 14px ${alpha(successColor, isDark ? 0.55 : 0.4)}`
                    }
                }}
            >
                Start Workout ({selectedExercises.length} {selectedExercises.length === 1 ? 'Exercise' : 'Exercises'})
            </Button>
        </Paper>
    );
}; 