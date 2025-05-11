import React from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material'; // Commented out as they are unused
import { MainView } from './components/MainView';
// import { useWorkoutView } from './hooks/useWorkoutView'; // No longer used here

export const WorkoutView: React.FC = () => {
    // const workoutViewProps = useWorkoutView(); // Hook is called in NeonLightWorkoutView

    // if (workoutViewProps.isLoading && !workoutViewProps.planDetails) {
    //     return (
    //         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    //             <CircularProgress />
    //         </Box>
    //     );
    // }

    // if (workoutViewProps.error && !workoutViewProps.isLoading) {
    //     return (
    //         <Box sx={{ p: 3, textAlign: 'center' }}>
    //             <Typography variant="h6" color="error">Error</Typography>
    //             <Typography>{workoutViewProps.error}</Typography>
    //         </Box>
    //     );
    // }

    return (
        <MainView /> // Render without props
    );
}; 