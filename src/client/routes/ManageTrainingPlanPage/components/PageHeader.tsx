import React from 'react';
import { Button, Typography, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface PageHeaderProps {
    planId?: string;
    isMobile: boolean;
    navigate: (path: string) => void;
    successMessage: string | null;
    setSuccessMessage: (message: string | null) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    isMobile,
    navigate,
    successMessage,
    setSuccessMessage
}) => {
    return (
        <>
            <Button
                onClick={() => navigate('/training-plans')}
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                {isMobile ? 'Back' : 'Back to Training Plans'}
            </Button>
            <Typography variant="h5" gutterBottom>Manage Plan Content</Typography>

            {successMessage && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    onClose={() => setSuccessMessage(null)}
                >
                    {successMessage}
                </Alert>
            )}
        </>
    );
}; 