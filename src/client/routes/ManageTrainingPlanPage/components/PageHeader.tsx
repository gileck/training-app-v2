import React from 'react';
import { Typography, Alert } from '@mui/material';

interface PageHeaderProps {
    planId?: string;
    isMobile: boolean;
    navigate: (path: string) => void;
    successMessage: string | null;
    setSuccessMessage: (message: string | null) => void;
    planName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    successMessage,
    setSuccessMessage,
    planName
}) => {
    return (
        <>
            {/* <Button
                onClick={() => navigate('/training-plans')}
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                {isMobile ? 'Back' : 'Back to Training Plans'}
            </Button> */}
            <Typography variant="h5" gutterBottom>
                {planName || ''}
            </Typography>

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