import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem, IconButton, Paper, Typography, SelectChangeEvent } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { useWorkoutView } from './hooks/useWorkoutView';
import { UI_VARIANTS } from './ui';

export const WorkoutView = () => {
    const [currentUIIndex, setCurrentUIIndex] = useState(0);
    const workoutViewProps = useWorkoutView();

    const handlePreviousUI = () => {
        setCurrentUIIndex((prev) => (prev === 0 ? UI_VARIANTS.length - 1 : prev - 1));
    };

    const handleNextUI = () => {
        setCurrentUIIndex((prev) => (prev === UI_VARIANTS.length - 1 ? 0 : prev + 1));
    };

    const handleUIChange = (event: SelectChangeEvent) => {
        const selectedIndex = UI_VARIANTS.findIndex(ui => ui.id === event.target.value);
        if (selectedIndex !== -1) {
            setCurrentUIIndex(selectedIndex);
        }
    };

    // Get the current UI component
    const CurrentUIComponent = UI_VARIANTS[currentUIIndex].component;

    return (
        <>
            {/* UI Switcher */}
            <Paper
                elevation={3}
                sx={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 100000000,
                    display: 'flex',
                    alignItems: 'center',
                    padding: 1,
                    borderRadius: 2,
                }}
            >
                <Typography variant="caption" sx={{ mr: 1 }}>UI:</Typography>
                <IconButton size="small" onClick={handlePreviousUI}>
                    <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                        value={UI_VARIANTS[currentUIIndex].id}
                        onChange={handleUIChange}
                        variant="outlined"
                        sx={{ mx: 1, fontSize: '0.875rem' }}
                    >
                        {UI_VARIANTS.map((ui) => (
                            <MenuItem key={ui.id} value={ui.id}>
                                {ui.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <IconButton size="small" onClick={handleNextUI}>
                    <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
            </Paper>

            {/* Render the selected UI component */}
            <Box>
                <CurrentUIComponent {...workoutViewProps} />
            </Box>
        </>
    );
}; 