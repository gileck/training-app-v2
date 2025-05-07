import React from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PlanHeaderProps } from './types'; // Should now correctly import from types.ts

// --- Color constants for the light theme --- //
const LIGHT_BG = '#FFFFFF';
const NEON_PURPLE = '#9C27B0';

// Inline definitions removed as they are now in types.ts

export const PlanHeader: React.FC<PlanHeaderProps> = ({
    planId,
    weekNumber,
    planDetails,
    isLoading,
    error,
    navigate
}) => {
    if (!planId) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 2, color: '#D32F2F', fontWeight: 'bold' }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: alpha('#000000', 0.6) }}>
                    {error || "Please select a training plan to view."}
                </Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        bgcolor: NEON_PURPLE,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    // Error when plan is selected but there's an error, and not in a loading state for plan details
    if (error && planId && !isLoading) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 2, color: NEON_PURPLE, fontWeight: 'bold' }}>
                    {planDetails?.name || `Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <Box sx={{ my: 2 }}>
                    <Alert
                        severity="error"
                        sx={{
                            bgcolor: alpha('#FF0000', 0.1),
                            color: '#D32F2F',
                            border: `1px solid ${alpha('#FF0000', 0.2)}`,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                color: '#D32F2F'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                </Box>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        mt: 2,
                        bgcolor: NEON_PURPLE,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    // Show full page loading only for initial plan details load
    if (isLoading && !planDetails && planId) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress sx={{ color: NEON_PURPLE }} />
            </Box>
        );
    }

    // If not loading, but planDetails are still null/undefined after attempting to load for a specific planId
    if (!isLoading && !planDetails && planId) {
        return (
            <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                <Typography variant="h5" sx={{ mb: 2, color: NEON_PURPLE, fontWeight: 'bold' }}>
                    {`Plan ${planId}`} - Week {weekNumber}
                </Typography>
                <Typography sx={{ color: '#D32F2F', fontWeight: 'bold' }}>Plan details could not be loaded.</Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        mt: 2,
                        bgcolor: NEON_PURPLE,
                        '&:hover': {
                            bgcolor: alpha(NEON_PURPLE, 0.9)
                        }
                    }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    // If none of the above error/loading conditions specific to this header are met, render null.
    // This allows the main NeonLightWorkoutView to decide if it shows its own loading state (e.g. for week changes)
    // or the rest of the content if planDetails are available.
    return null;
}; 