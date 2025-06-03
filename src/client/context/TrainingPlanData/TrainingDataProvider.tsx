import React, { ReactNode } from 'react';
import { TrainingDataContext, TrainingDataContextType } from './TrainingDataContext';
import { useTrainingDataHooks } from './hooks/useTrainingDataHooks';
import { Snackbar, Alert } from '@mui/material';

interface TrainingDataProviderProps {
    children: ReactNode;
}

export const TrainingDataProvider: React.FC<TrainingDataProviderProps> = ({ children }) => {
    const hooks = useTrainingDataHooks();

    const contextValue: TrainingDataContextType = {
        state: hooks.state,
        updateState: hooks.updateState,
        isLoadingFromServer: hooks.isLoadingFromServer,
        loadTrainingPlans: hooks.loadTrainingPlans,
        createTrainingPlan: hooks.createTrainingPlan,
        updateTrainingPlan: hooks.updateTrainingPlan,
        deleteTrainingPlan: hooks.deleteTrainingPlan,
        duplicateTrainingPlan: hooks.duplicateTrainingPlan,
        setActiveTrainingPlan: hooks.setActiveTrainingPlan,
        loadPlanData: hooks.loadPlanData,
        loadExercises: hooks.loadExercises,
        createExercise: hooks.createExercise,
        updateExercise: hooks.updateExercise,
        deleteExercise: hooks.deleteExercise,
        loadWeeklyProgress: hooks.loadWeeklyProgress,
        updateSetCompletion: hooks.updateSetCompletion,
        loadSavedWorkouts: hooks.loadSavedWorkouts,
        createSavedWorkout: hooks.createSavedWorkout,
        updateSavedWorkout: hooks.updateSavedWorkout,
        deleteSavedWorkout: hooks.deleteSavedWorkout
    };

    return (
        <TrainingDataContext.Provider value={contextValue}>
            {children}

            {/* Notification for sync errors */}
            <Snackbar
                open={hooks.notification.open}
                autoHideDuration={4000}
                onClose={hooks.closeNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={hooks.closeNotification}
                    severity={hooks.notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {hooks.notification.message}
                </Alert>
            </Snackbar>
        </TrainingDataContext.Provider>
    );
}; 