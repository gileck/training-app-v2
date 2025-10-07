import React from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material';

import { useManageTrainingPlanPage } from './hooks/useManageTrainingPlanPage';
import { ExercisesTab } from './components/ExercisesTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { AIChatTab } from './components/AIChatTab';
import { DialogsSection } from './components/DialogsSection';
import { ErrorView } from './components/ErrorView';
import { PageHeader } from './components/PageHeader';

export const ManageTrainingPlanPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const {
        planId,
        router,
        page,
        planData,
        exerciseHooks,
        workoutHooks,
        definitionsMapMPE,
        existingExerciseDefinitionIdsInPlan
    } = useManageTrainingPlanPage();

    const { navigate } = router;
    const { currentTab, handleTabChange, isPageLoading, error } = page;
    const { exercises } = exerciseHooks;
    const { planDetails } = planData;
    const combinedError = error || exerciseHooks.error || planData.error;

    // Handle error states
    if (!planId && !isPageLoading && currentTab === 0) {
        return (
            <ErrorView
                planId={planId}
                isMobile={isMobile}
                navigate={navigate}
                error={combinedError}
                isLoading={false}
            />
        );
    }

    if (!planId && !isPageLoading && currentTab === 1) {
        return (
            <ErrorView
                planId={planId}
                isMobile={isMobile}
                navigate={navigate}
                error={workoutHooks.savedWorkout_error || "Training Plan ID is required to manage workouts."}
                isLoading={false}
            />
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
            {/* Page Header */}
            <PageHeader
                planName={planDetails?.name ?? ''}
                planId={planId}
                isMobile={isMobile}
                navigate={navigate}
                successMessage={workoutHooks.savedWorkout_successMessage}
                setSuccessMessage={workoutHooks.savedWorkout_setSuccessMessage}
            />

            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="Plan management tabs">
                    <Tab label="Exercises" />
                    <Tab label="Workouts" />
                    <Tab label="AI Assistant" />
                </Tabs>
            </Box>

            {/* Tab Content */}
            {currentTab === 0 && (
                <ExercisesTab
                    planId={planId}
                    isPageLoading={isPageLoading}
                    planDetails={planDetails}
                    error={combinedError}
                    exercises={exercises}
                    exerciseHooks={exerciseHooks}
                    definitionsMapMPE={definitionsMapMPE}
                    existingExerciseDefinitionIdsInPlan={existingExerciseDefinitionIdsInPlan}
                />
            )}

            {currentTab === 1 && (
                <WorkoutsTab
                    isPageLoading={isPageLoading}
                    planDetails={planDetails}
                    workoutHooks={workoutHooks}
                />
            )}

            {currentTab === 2 && (
                <AIChatTab planId={planId} />
            )}

            {/* Dialogs */}
            <DialogsSection
                planId={planId}
                definitionsMapMPE={definitionsMapMPE}
                existingExerciseDefinitionIdsInPlan={existingExerciseDefinitionIdsInPlan}
                exerciseHooks={exerciseHooks}
                workoutHooks={workoutHooks}
                planDetails={planDetails}
                isPageLoading={isPageLoading}
            />
        </Box>
    );
}; 