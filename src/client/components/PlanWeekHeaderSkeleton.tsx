import React, { FC } from 'react';
import {
    Box,
    Paper,
    Stack,
    Skeleton,
    alpha
} from '@mui/material';

const LIGHT_PAPER = '#F5F5F7'; // Matching PlanWeekHeader
const SKELETON_BG = alpha('#000000', 0.05);

export const PlanWeekHeaderSkeleton: FC = () => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 3,
                bgcolor: LIGHT_PAPER,
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha('#000000', 0.1)}`, // Subtle border for skeleton
                p: { xs: 2, sm: 2.5 },
            }}
        >
            {/* Week Navigator Skeleton */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: SKELETON_BG }} />
                <Skeleton variant="text" width={120} height={30} sx={{ bgcolor: SKELETON_BG, fontSize: '1.25rem' }} />
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: SKELETON_BG }} />
            </Stack>

            {/* Weekly Progress Skeleton */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Skeleton variant="text" width={150} height={24} sx={{ bgcolor: SKELETON_BG, fontSize: '1rem' }} />
                    <Skeleton variant="text" width={50} height={24} sx={{ bgcolor: SKELETON_BG, fontSize: '1rem' }} />
                </Stack>
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, bgcolor: SKELETON_BG }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                    <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: SKELETON_BG, fontSize: '0.875rem' }} />
                    <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: SKELETON_BG, fontSize: '0.875rem' }} />
                </Stack>
            </Box>
        </Paper>
    );
}; 