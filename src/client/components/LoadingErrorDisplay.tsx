import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

interface LoadingErrorDisplayProps {
    isLoading: boolean;
    error: string | null;
}

export const LoadingErrorDisplay: React.FC<LoadingErrorDisplayProps> = ({ isLoading, error }) => {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    return null;
}; 