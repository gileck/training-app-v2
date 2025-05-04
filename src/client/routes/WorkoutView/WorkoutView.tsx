import React from 'react';
import { Box } from '@mui/material';

import { useWorkoutView } from './hooks/useWorkoutView';
import { UI_VARIANTS } from './ui';
export const WorkoutView = () => {
    // Hard-code to the "neon-light" UI index (4)
    // const neonLightIndex = UI_VARIANTS.findIndex(ui => ui.id === 'neon-light');
    // const [currentUIIndex] = useState(neonLightIndex >= 0 ? neonLightIndex : 0);

    const workoutViewProps = useWorkoutView();

    // Get the current UI component
    // const CurrentUIComponent = UI_VARIANTS[currentUIIndex].component;
    const CurrentUIComponent = UI_VARIANTS[0].component;

    return (
        <Box>
            <CurrentUIComponent {...workoutViewProps} />
        </Box>
    );
}; 