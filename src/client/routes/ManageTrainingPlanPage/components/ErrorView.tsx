import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LoadingErrorDisplay } from './LoadingErrorDisplay';

interface ErrorViewProps {
    planId?: string;
    isMobile: boolean;
    navigate: (path: string) => void;
    error: string | null;
    isLoading: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
    isMobile,
    navigate,
    error,
    isLoading
}) => {
    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Button
                onClick={() => navigate('/training-plans')}
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                {isMobile ? 'Back' : 'Back to Training Plans'}
            </Button>
            <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>
            <LoadingErrorDisplay isLoading={isLoading} error={error} />
        </Box>
    );
}; 