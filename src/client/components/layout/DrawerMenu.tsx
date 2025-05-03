import React, { useState } from 'react';
import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useRouter } from '../../router';
import { NavItem } from '../../components/layout/types';
import { getActiveTrainingPlan } from '@/apis/trainingPlans/client';
import { useAuth } from '@/client/context/AuthContext';

interface DrawerMenuProps {
  navItems: NavItem[];
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

export const DrawerMenu = ({ navItems, mobileOpen, onDrawerToggle }: DrawerMenuProps) => {
  const { currentPath, navigate } = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' });

  const handleWorkoutNavigation = async () => {
    // Close drawer first
    onDrawerToggle();

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
      // Don't call onDrawerToggle here, handleWorkoutNavigation does it
    } else {
      navigate(path);
      onDrawerToggle();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper to check if a path is active (considering /workout/*)
  const isActivePath = (itemPath: string) => {
    if (itemPath === '/workout') {
      return currentPath.startsWith('/workout/') || currentPath === '/workout';
    }
    return currentPath === itemPath;
  }

  const drawerContent = (
    <Box sx={{ textAlign: 'center' }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              sx={{ textAlign: 'left' }}
              onClick={() => handleNavigation(item.path)}
              selected={isActivePath(item.path)}
              disabled={isLoadingWorkout}
            >
              <ListItemIcon>
                {item.path === '/workout' && isLoadingWorkout ? <CircularProgress size={24} /> : item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '90%', margin: 'auto' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onDrawerToggle}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default DrawerMenu;
