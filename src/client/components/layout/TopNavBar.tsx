import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from '../../router';
import { NavItem } from '../../components/layout/types';
import { getActiveTrainingPlan } from '@/apis/trainingPlans/client';
import { useAuth } from '@/client/context/AuthContext';

interface TopNavBarProps {
  navItems: NavItem[];
  isStandalone?: boolean;
  onDrawerToggle: () => void;
}

export const TopNavBar = ({ navItems, isStandalone, onDrawerToggle }: TopNavBarProps) => {
  const { currentPath, navigate } = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' });

  const handleWorkoutNavigation = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsLoadingWorkout(true);
    setSnackbar({ open: false, message: '', severity: 'info' });
    try {
      const response = await getActiveTrainingPlan();
      if (response.data && '_id' in response.data) {
        navigate(`/workout/${response.data._id}/1`);
      } else if (response.data?.plan === null) {
        setSnackbar({ open: true, message: 'No active training plan set. Please select one from Training Plans.', severity: 'info' });
        navigate('/training-plans');
      } else {
        setSnackbar({ open: true, message: response.data?.error || 'Could not load active workout.', severity: 'error' });
      }
    } catch (error) {
      console.error("Failed to get active training plan:", error);
      setSnackbar({ open: true, message: 'An error occurred while loading the workout.', severity: 'error' });
    } finally {
      setIsLoadingWorkout(false);
    }
  };

  const handleNavigation = (path: string) => {
    if (path === '/workout') {
      handleWorkoutNavigation();
    } else {
      navigate(path);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isActivePath = (itemPath: string) => {
    if (itemPath === '/workout') {
      return currentPath.startsWith('/workout/') || currentPath === '/workout';
    }
    return currentPath === itemPath;
  }

  return (
    <AppBar
      position="sticky"
      component="nav"
      sx={{
        ...(isStandalone && {
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
        })
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              sx={{
                color: '#fff',
                backgroundColor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                mx: 0.5,
                ...(item.path === '/workout' && isLoadingWorkout && {
                  color: 'transparent'
                })
              }}
              startIcon={item.path === '/workout' && isLoadingWorkout ? null : item.icon}
              onClick={() => handleNavigation(item.path)}
              disabled={isLoadingWorkout}
            >
              {item.path === '/workout' && isLoadingWorkout ? <CircularProgress size={24} color="inherit" /> : item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default TopNavBar;
