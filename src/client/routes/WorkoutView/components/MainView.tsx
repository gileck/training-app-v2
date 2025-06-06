import React from 'react';
import { Box, Tabs, Tab, Typography, Button, Alert, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useWorkoutView } from '../hooks/useWorkoutView';
import { ExerciseTabContent } from './ExerciseTabContent';
import { WorkoutTabContent } from './WorkoutTabContent';
import { ActiveWorkoutContent } from './ActiveWorkoutContent';
import { PlanWeekHeader } from '@/client/components/PlanWeekHeader';
import { PlanWeekHeaderSkeleton } from '@/client/components/PlanWeekHeaderSkeleton';
import { SelectedExercisesBar } from './SelectedExercisesBar';
import { useTrainingData } from '@/client/hooks/useTrainingData';

// --- Color constants for the light theme --- //
const LIGHT_BG = '#FFFFFF';
const NEON_PURPLE = '#9C27B0';

// Main Component
export const MainView: React.FC = () => {
    const {
        planId,
        weekNumber,
        planDetails,
        isLoading: isPlanDataLoading,
        error,
        activeExercises,
        completedExercises,
        showCompleted,
        toggleShowCompleted,
        progressPercentage,
        completedSetsCount,
        totalSetsCount,
        selectedExercises,
        showSelectionMode,
        handleExerciseSelect,
        activeWorkoutSession,
        activeWorkoutName,
        startActiveWorkout,
        handleStartWorkout,
        onIncrementActiveSet,
        onDecrementActiveSet,
        onEndActiveWorkout,
        onRemoveExerciseFromActiveSession,
        savedWorkouts,
        isWorkoutsLoading,
        toggleWorkoutExpanded,
        activeTab,
        handleTabChange,
        navigate,
        handleNavigateWeek,
        handleSetCompletionUpdate,
        handleSavedWorkoutExerciseSetCompletionUpdate,
        isSavingWorkout,
        saveError,
        handleSaveActiveSessionAsNewWorkout,
        EXERCISES_TAB_INDEX,
        WORKOUTS_TAB_INDEX,
        ACTIVE_WORKOUT_TAB_INDEX
    } = useWorkoutView();

    const { isLoadingFromServer } = useTrainingData();

    const isWeekLoading = isPlanDataLoading && !!planDetails && !!planId && activeExercises.length === 0;

    if (isWeekLoading) {
        return <></>
    }

    // If there is no planId, show a message and a button to navigate to training plans.
    // This was previously handled by PlanHeader.
    if (!planId) {
        return (
            <Box sx={{ p: 3, bgcolor: '#FFFFFF', color: '#333', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h5" sx={{ mb: 2, color: '#D32F2F', fontWeight: 'bold' }}>
                    No Training Plan Selected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: alpha('#000000', 0.6), textAlign: 'center' }}>
                    Please select a training plan to view its details and workouts.
                </Typography>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="contained"
                    sx={{
                        bgcolor: '#9C27B0', // NEON_PURPLE from PlanHeader
                        '&:hover': {
                            bgcolor: alpha('#9C27B0', 0.9)
                        }
                    }}
                >
                    Go to Training Plans
                </Button>
            </Box>
        );
    }

    // If there is an error
    // This was also partially handled by PlanHeader.
    if (error) {
        return (
            <Box sx={{ p: 3, bgcolor: '#FFFFFF', color: '#333', textAlign: 'center' }}>
                <Typography variant="h5" sx={{ mb: 2, color: '#9C27B0', fontWeight: 'bold' }}>
                    {planDetails?.name || `Training Plan`} - Week {weekNumber}
                </Typography>
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: alpha('#FF0000', 0.1),
                        color: '#D32F2F',
                        border: `1px solid ${alpha('#FF0000', 0.2)}`,
                        borderRadius: 2,
                        textAlign: 'left',
                        mb: 2,
                        mx: 'auto', // Center the alert
                        maxWidth: 'sm' // Max width for better readability
                    }}
                >
                    {error}
                </Alert>
                <Button
                    onClick={() => navigate('/training-plans')}
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    sx={{
                        color: '#9C27B0',
                        borderColor: '#9C27B0',
                        '&:hover': {
                            borderColor: alpha('#9C27B0', 0.7),
                            bgcolor: alpha('#9C27B0', 0.05)
                        }
                    }}
                >
                    Back to Plans
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 0, sm: 2, md: 3 }, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
            {/* Plan Header - Active Plan Name */}
            {planDetails && (
                <Box sx={{ mb: 2, px: { xs: 2, sm: 0 } }}>
                    <Typography data-testid="active-plan-name" variant="h5" sx={{
                        fontWeight: 'bold',
                        color: NEON_PURPLE,
                        mb: 1
                    }}>
                        {planDetails.name}
                    </Typography>
                    <Typography data-testid="workout-plan-name" variant="h6" sx={{
                        fontWeight: 'medium',
                        color: alpha('#000000', 0.7),
                        display: 'none' // Hidden but available for tests
                    }}>
                        {planDetails.name}
                    </Typography>
                </Box>
            )}

            {planDetails && planDetails.durationWeeks > 0 && (
                isWeekLoading ? (
                    <PlanWeekHeaderSkeleton />
                ) : (
                    <PlanWeekHeader
                        currentWeek={weekNumber}
                        maxWeeks={planDetails.durationWeeks}
                        onNavigate={handleNavigateWeek}
                        isWeekLoading={isWeekLoading}
                        isSyncingFromServer={isLoadingFromServer}
                        progressPercentage={progressPercentage}
                        completedSetsCount={completedSetsCount}
                        totalSetsCount={totalSetsCount}
                    />
                )
            )}

            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ '& .MuiTabs-indicator': { backgroundColor: NEON_PURPLE } }}
            >
                <Tab label="Exercises" sx={{ textTransform: 'none', fontWeight: 'bold', color: activeTab === EXERCISES_TAB_INDEX ? NEON_PURPLE : alpha('#000000', 0.6), '&.Mui-selected': { color: NEON_PURPLE } }} />
                <Tab label="Workouts" sx={{ textTransform: 'none', fontWeight: 'bold', color: activeTab === WORKOUTS_TAB_INDEX ? NEON_PURPLE : alpha('#000000', 0.6), '&.Mui-selected': { color: NEON_PURPLE } }} />
                <Tab
                    label="Active Workout"
                    disabled={!activeWorkoutSession || activeWorkoutSession.length === 0}
                    sx={{ textTransform: 'none', fontWeight: 'bold', color: activeTab === ACTIVE_WORKOUT_TAB_INDEX ? NEON_PURPLE : alpha('#000000', 0.6), '&.Mui-selected': { color: NEON_PURPLE } }}
                />
            </Tabs>

            {activeTab === EXERCISES_TAB_INDEX && (
                <ExerciseTabContent
                    planId={planId}
                    weekNumber={weekNumber}
                    activeExercises={activeExercises}
                    completedExercises={completedExercises}
                    showCompleted={showCompleted}
                    selectedExercises={selectedExercises}
                    showSelectionMode={showSelectionMode}
                    isLoading={isPlanDataLoading && activeExercises.length === 0}
                    handleSetCompletionUpdate={handleSetCompletionUpdate}
                    handleExerciseSelect={handleExerciseSelect}
                    toggleShowCompleted={toggleShowCompleted}
                />
            )}
            {activeTab === WORKOUTS_TAB_INDEX && (
                <WorkoutTabContent
                    planId={planId}
                    weekNumber={weekNumber}
                    savedWorkouts={savedWorkouts}
                    isWorkoutsLoading={isWorkoutsLoading}
                    toggleWorkoutExpanded={toggleWorkoutExpanded}
                    handleSavedWorkoutExerciseSetCompletionUpdate={handleSavedWorkoutExerciseSetCompletionUpdate}
                    startActiveWorkout={startActiveWorkout}
                />
            )}
            {activeTab === ACTIVE_WORKOUT_TAB_INDEX && activeWorkoutSession && activeWorkoutSession.length > 0 && (
                <ActiveWorkoutContent
                    exercises={activeWorkoutSession}
                    workoutName={activeWorkoutName}
                    onIncrementSet={onIncrementActiveSet}
                    onDecrementSet={onDecrementActiveSet}
                    onEndWorkout={onEndActiveWorkout}
                    onRemoveExerciseFromSession={onRemoveExerciseFromActiveSession}
                    onSaveActiveSession={handleSaveActiveSessionAsNewWorkout}
                    isSavingWorkout={isSavingWorkout}
                    saveError={saveError}
                />
            )}

            {showSelectionMode && selectedExercises.length > 0 && activeTab === EXERCISES_TAB_INDEX && (
                <SelectedExercisesBar
                    selectedExercises={selectedExercises}
                    activeTab={activeTab}
                    handleStartWorkout={handleStartWorkout}
                />
            )}
        </Box>
    );
};