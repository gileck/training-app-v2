import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, Button, Typography, Link, CircularProgress, Alert } from '@mui/material';

const LoginForm: React.FC = () => {
    const { login, register, isLoading, error } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Only for registration

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isRegistering) {
            await register({ username, email, password });
        } else {
            await login({ username, password });
        }
        // AuthProvider handles state updates based on success/failure
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
            >
                {isLoading ? <CircularProgress size={24} /> : (isRegistering ? 'Sign Up' : 'Sign In')}
            </Button>
            <Typography variant="body2" align="center">
                {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                <Link href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); }} sx={{ cursor: 'pointer' }}>
                    {isRegistering ? 'Login' : 'Sign Up'}
                </Link>
            </Typography>
        </Box>
    );
};

export default LoginForm; 