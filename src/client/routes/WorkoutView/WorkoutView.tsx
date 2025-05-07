import React from 'react';
import { Box } from '@mui/material';

import { useWorkoutView } from './hooks/useWorkoutView';
import { NeonLightWorkoutView } from './components';
export const WorkoutView = () => {
    const workoutViewProps = useWorkoutView();
    return (
        <Box>
            <NeonLightWorkoutView {...workoutViewProps} />
        </Box>
    );
}; 