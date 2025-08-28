import React, { FC } from 'react';
import {
    Box,
    Paper,
    Stack,
    Skeleton,
    alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SKELETON_OPACITY = 0.08;

export const PlanWeekHeaderSkeleton: FC = () => {
    const theme = useTheme();
    const paperBg = theme.palette.background.paper;
    const skeletonBg = alpha(theme.palette.text.primary, SKELETON_OPACITY);
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 3,
                bgcolor: paperBg,
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 1)}`, // Subtle border for skeleton
                p: { xs: 2, sm: 2.5 },
            }}
        >
            {/* Week Navigator Skeleton */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: skeletonBg }} />
                <Skeleton variant="text" width={120} height={30} sx={{ bgcolor: skeletonBg, fontSize: '1.25rem' }} />
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: skeletonBg }} />
            </Stack>

            {/* Weekly Progress Skeleton */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Skeleton variant="text" width={150} height={24} sx={{ bgcolor: skeletonBg, fontSize: '1rem' }} />
                    <Skeleton variant="text" width={50} height={24} sx={{ bgcolor: skeletonBg, fontSize: '1rem' }} />
                </Stack>
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, bgcolor: skeletonBg }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                    <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: skeletonBg, fontSize: '0.875rem' }} />
                    <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: skeletonBg, fontSize: '0.875rem' }} />
                </Stack>
            </Box>
        </Paper>
    );
}; 