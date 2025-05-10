import React from 'react';
import { Box, Paper, Skeleton, alpha } from '@mui/material';

const LIGHT_PAPER = '#F5F5F7';
const NEON_BLUE = '#3D5AFE';

export const WorkoutItemSkeleton: React.FC = () => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 2,
                borderRadius: 3,
                bgcolor: LIGHT_PAPER,
                border: `1px solid ${alpha(NEON_BLUE, 0.2)}`,
                boxShadow: `0 4px 12px ${alpha(NEON_BLUE, 0.1)}`,
            }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box flexGrow={1}>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="40%" height={18} />
                </Box>
                <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 2, ml: 1 }} />
                <Skeleton variant="circular" width={32} height={32} sx={{ ml: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width="100%" height={4} />
            {/* Optionally, if skeletons for expanded items are desired, add them here */}
            {/* For now, keeping it simple and only skeletonizing the collapsed view */}
        </Paper>
    );
}; 