import { Paper, BottomNavigation, BottomNavigationAction, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useRouter } from '../../router';
import { NavItem } from '../../components/layout/types';
import { getActiveTrainingPlan } from '@/apis/trainingPlans/client'; // Import API client
import { useAuth } from '@/client/context/AuthContext'; // To check auth status
import React, { useState } from 'react'; // Import useState

interface BottomNavBarProps {
  navItems: NavItem[];
  isStandalone?: boolean;
}

export const BottomNavBar = ({ navItems, isStandalone }: BottomNavBarProps) => {
  const { currentPath, navigate } = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' });

  // Get the current navigation value based on the path
  const getCurrentNavValue = () => {
    // Adjust to handle /workout path potentially matching the workout button index
    const activePath = currentPath.startsWith('/workout/') ? '/workout' : currentPath;
    const index = navItems.findIndex(item => item.path === activePath);
    return index >= 0 ? index : 0; // Default to first item if no match
  };

  const handleWorkoutNavigation = async () => {
    if (!isAuthenticated) {
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }
    setIsLoadingWorkout(true);
    setSnackbar({ open: false, message: '', severity: 'info' });
    try {
      const response = await getActiveTrainingPlan();
      if (response.data && '_id' in response.data) {
        navigate(`/workout/${response.data._id}/1`); // Navigate to week 1 of active plan
      } else if (response.data?.plan === null) {
        // No active plan set
        setSnackbar({ open: true, message: 'No active training plan set. Please select one from Training Plans.', severity: 'info' });
        // Optional: navigate to training plans page
        navigate('/training-plans');
      } else {
        // Handle potential API error message
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

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', sm: 'none' },
        zIndex: 1100,
        borderRadius: 0,
        ...(isStandalone && {
          paddingBottom: 'env(safe-area-inset-bottom)'
        })
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getCurrentNavValue()}
        onChange={(_, newValue) => {
          const selectedItem = navItems[newValue];
          if (selectedItem) {
            handleNavigation(selectedItem.path);
          }
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.path === '/workout' && isLoadingWorkout ? <CircularProgress size={24} /> : item.icon}
            disabled={isLoadingWorkout} // Disable all buttons while loading workout
          />
        ))}
      </BottomNavigation>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default BottomNavBar;
