import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Modal, Typography, Paper } from '@mui/material';
import LoginForm from '../components/LoginForm';

interface AuthWrapperProps {
    children: ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isInitialLoading } = useAuth();

    if (isLoading || isInitialLoading) {
        // Show a loading spinner centered on the screen
        return <></>

        // <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        //     <CircularProgress />
        // </Box>
        // );
    }

    if (!isAuthenticated) {
        // Show the login/register form (e.g., in a modal that can't be dismissed easily)
        return (
            <Modal
                open={true} // Always open if not authenticated
                aria-labelledby="login-modal-title"
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <Paper elevation={3} sx={{ padding: 4, minWidth: 300, maxWidth: 400 }}>
                    <Typography id="login-modal-title" variant="h5" component="h2" gutterBottom align="center">
                        Welcome
                    </Typography>
                    <LoginForm />
                </Paper>
            </Modal>
        );
    }

    // User is authenticated, render the main application content
    return <>{children}</>;
};

export default AuthWrapper; 