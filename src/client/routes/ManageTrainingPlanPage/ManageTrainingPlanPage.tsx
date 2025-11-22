import React from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material';
import { useTrainingData } from '@/client/hooks/useTrainingData';
import { useManageTrainingPlanPage } from './hooks/useManageTrainingPlanPage';
import { useAIAssistant } from './hooks/useAIAssistant';
import { ExercisesTab } from './components/ExercisesTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { DialogsSection } from './components/DialogsSection';
import { ErrorView } from './components/ErrorView';
import { PageHeader } from './components/PageHeader';
import { AIChatPanel } from './components/AIChatPanel';

export const ManageTrainingPlanPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { refreshExercises, refreshSavedWorkouts } = useTrainingData();

    const {
        planId,
        router,
        page,
        planData,
        exerciseHooks,
        workoutHooks,
        definitionsMapMPE,
        existingExerciseDefinitionIdsInPlan,
    } = useManageTrainingPlanPage();

    const { navigate } = router;
    const { currentTab, handleTabChange, isPageLoading, error } = page;
    const { exercises } = exerciseHooks;
    const { planDetails } = planData;
    const combinedError = error || exerciseHooks.error || planData.error;

    // Callback to refresh data after AI action execution
    const handleActionExecuted = React.useCallback(async () => {
        // Use refresh functions that bypass cache
        if (planId) {
            try {
                await Promise.all([
                    refreshExercises(planId),
                    refreshSavedWorkouts(planId)
                ]);
            } catch (err) {
                console.error('Error reloading data after AI action:', err);
            }
        }
    }, [planId, refreshExercises, refreshSavedWorkouts]);

    // AI Assistant hook
    const aiAssistant = useAIAssistant({
        planId,
        onActionExecuted: handleActionExecuted,
    });

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

            {/* AI Chat Panel */}
            <AIChatPanel
                planId={planId}
                messages={aiAssistant.messages}
                isProcessing={aiAssistant.isProcessing}
                error={aiAssistant.error}
                selectedModel={aiAssistant.selectedModel}
                onModelChange={aiAssistant.setSelectedModel}
                onSendMessage={aiAssistant.sendMessage}
                onConfirmAction={aiAssistant.confirmAction}
                onConfirmMultipleActions={aiAssistant.confirmMultipleActions}
                onRejectAction={aiAssistant.rejectAction}
                onUndoAction={aiAssistant.undoAction}
                actionHistory={aiAssistant.actionHistory}
            />
        </Box>
    );
}; 