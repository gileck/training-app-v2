import React from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material'; // Commented out as they are unused
import { MainView } from './components/MainView';
// import { useWorkoutView } from './hooks/useWorkoutView'; // No longer used here

export const WorkoutView: React.FC = () => {
    return (
        <MainView /> // Render without props
    );
}; 