import { useEffect, useState, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    CircularProgress,
    TextField,
    Button,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { apiUpdateProfile, apiFetchCurrentUser } from '@/apis/auth/client';
import { UpdateProfileRequest, UserResponse } from '@/apis/auth/types';

export const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { navigate } = useRouter();
    const [editing, setEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [localUser, setLocalUser] = useState<UserResponse | null>(null);
    const [loadingUserData, setLoadingUserData] = useState(false);
    const initialUsernameRef = useRef<string>('');

    const fetchUserData = async () => {
        try {
            setLoadingUserData(true);
            const response = await apiFetchCurrentUser({ bypassCache: true });
            if (response.data?.user) {
                setLocalUser(response.data.user);
                setUsername(response.data.user.username);
                initialUsernameRef.current = response.data.user.username;
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setLoadingUserData(false);
        }
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        if (user) {
            setLocalUser(user);
            setUsername(user.username);
            initialUsernameRef.current = user.username;
        }
    }, [user]);

    if (isLoading || loadingUserData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const handleEditClick = () => {
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setUsername(initialUsernameRef.current);
    };

    const handleSaveProfile = async () => {
        if (!username.trim()) {
            setSnackbar({
                open: true,
                message: 'Username cannot be empty',
                severity: 'error'
            });
            return;
        }

        if (username === initialUsernameRef.current) {
            setEditing(false);
            return;
        }

        setSavingProfile(true);

        try {
            const updateData: UpdateProfileRequest = {
                username
            };

            const response = await apiUpdateProfile(updateData, { bypassCache: true });

            if (response.data?.success && response.data.user) {
                setLocalUser(response.data.user);
                initialUsernameRef.current = response.data.user.username;
                setEditing(false);
                setSnackbar({
                    open: true,
                    message: 'Profile updated successfully',
                    severity: 'success'
                });
            } else {
                await fetchUserData();
                setSnackbar({
                    open: true,
                    message: response.data?.error || 'Failed to update profile',
                    severity: 'error'
                });
            }
        } catch (err) {
            await fetchUserData();
            const errorMessage = err instanceof Error ? err.message : 'Profile update error';
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const displayUser = localUser || user;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                My Profile
                {!editing && (
                    <IconButton color="primary" onClick={handleEditClick} sx={{ ml: 2 }}>
                        <EditIcon />
                    </IconButton>
                )}
            </Typography>

            {displayUser && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                        <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: '3rem',
                                    mb: 2,
                                    bgcolor: 'primary.main'
                                }}
                            >
                                {username.charAt(0).toUpperCase()}
                            </Avatar>
                            {editing ? (
                                <TextField
                                    label="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                    size="small"
                                    disabled={savingProfile}
                                />
                            ) : (
                                <Typography variant="h5">{username}</Typography>
                            )}

                            {editing && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<CancelIcon />}
                                        onClick={handleCancelEdit}
                                        disabled={savingProfile}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Account Information</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Username"
                                        secondary={username}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText
                                        primary="Member Since"
                                        secondary={new Date(displayUser.createdAt).toLocaleDateString()}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Box>
                </Stack>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile; 