import React from 'react';
import {
    Box,
    Paper,
    Skeleton,
    Stack,
    Divider,
    alpha
} from '@mui/material';

const LIGHT_CARD = '#FFFFFF'; // Matching WorkoutExerciseItem
const SKELETON_BG = alpha('#000000', 0.05); // A light grey for skeleton elements

export const WorkoutExerciseItemSkeleton: React.FC = () => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 2.5,
                bgcolor: LIGHT_CARD,
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha('#000000', 0.1)}`, // Subtle border
            }}
        >
            {/* Main content area: Image on left, details on right */}
            <Box sx={{ display: 'flex', p: 1.5, gap: 2 }}>
                {/* Image placeholder on the left */}
                <Skeleton
                    variant="rectangular"
                    width={100}
                    height={100}
                    sx={{ borderRadius: 2, bgcolor: SKELETON_BG, flexShrink: 0 }}
                />

                {/* Details section on the right */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                        {/* Exercise Name Placeholder */}
                        <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '70%', bgcolor: SKELETON_BG, mb: 0.5 }} />
                        {/* Reps Placeholder */}
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '50%', bgcolor: SKELETON_BG, mb: 0.5 }} />
                        {/* Sets Placeholder */}
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '40%', bgcolor: SKELETON_BG, mb: 1 }} />
                    </Box>

                    {/* Progress bar placeholder */}
                    <Skeleton
                        variant="rectangular"
                        height={6}
                        sx={{ borderRadius: 1, bgcolor: SKELETON_BG, my: 1 }}
                    />
                </Box>
            </Box>

            {/* Controls and Chips Section Placeholder */}
            <Box sx={{ px: 1.5, pb: 0.5 }}>
                <Divider sx={{ bgcolor: alpha('#000000', 0.08), my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    {/* Chip Placeholder */}
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '16px', bgcolor: SKELETON_BG }} />

                    {/* Control Buttons Placeholder */}
                    <Stack direction="row" spacing={1}>
                        <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: SKELETON_BG }} />
                        <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: SKELETON_BG }} />
                        <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: SKELETON_BG }} />
                    </Stack>
                </Box>
            </Box>
        </Paper>
    );
}; 