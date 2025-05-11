import React from 'react';
import {
    Box,
    CircularProgress,
    Alert,
} from '@mui/material';

export const LoadingErrorDisplay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    return null;
}; 