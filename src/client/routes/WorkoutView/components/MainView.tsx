import React from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    alpha,
    Tabs,
    Tab,
} from '@mui/material';

import { WorkoutViewProps } from './types';
import { PlanHeader } from './PlanHeader';
import { SelectedExercisesBar } from './SelectedExercisesBar';
import { ActiveWorkoutContent } from './ActiveWorkoutContent';
import { ExerciseTabContent } from './ExerciseTabContent';
import { WorkoutTabContent } from './WorkoutTabContent';
import { PlanWeekHeader } from '@/client/components/PlanWeekHeader';

// --- Color constants for the light theme --- //
const LIGHT_BG = '#FFFFFF';
const NEON_PURPLE = '#9C27B0';

// Main Component
export const NeonLightWorkoutView: React.FC<WorkoutViewProps> = ({
    planId,
    weekNumber,
    planDetails,
    isLoading,
    error,
    activeExercises,
    completedExercises,
    showCompleted,
    selectedExercises,
    showSelectionMode,
    progressPercentage,
    totalExercises,
    completedExercisesCount,
    completedSetsCount,
    totalSetsCount,
    savedWorkouts,
    isWorkoutsLoading,

    activeWorkoutSession,
    activeWorkoutName,

    // Destructure new callback props
    onIncrementActiveSet,
    onDecrementActiveSet,
    onEndActiveWorkout,
    onRemoveExerciseFromActiveSession,

    navigate,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    handleStartSelectionMode,
    handleStartWorkout,
    startActiveWorkout,
    toggleShowCompleted,
    handleNavigateWeek,
    toggleWorkoutExpanded,
    handleSavedWorkoutExerciseSetCompletionUpdate,

    // New props from hook for tab management
    activeTab,
    handleTabChange,
}) => {
    const [isWeekLoading, setIsWeekLoading] = React.useState(false);

    const EXERCISES_TAB_INDEX = 0;
    const WORKOUTS_TAB_INDEX = 1;
    const ACTIVE_WORKOUT_TAB_INDEX = 2;

    // Start selection mode by default
    // React.useEffect(() => {
    //     if (!showSelectionMode) {
    //         handleStartSelectionMode();
    //     }
    // }, [showSelectionMode, handleStartSelectionMode]);

    const handleLocalWeekNavigate = (week: number) => {
        setIsWeekLoading(true);
        handleNavigateWeek(week);
    };

    React.useEffect(() => {
        if (!isLoading) {
            setIsWeekLoading(false);
        }
    }, [isLoading, weekNumber]);

    // Call PlanHeader to get its output
    const planHeaderOutputComponent = (
        <PlanHeader
            planId={planId}
            weekNumber={weekNumber}
            planDetails={planDetails}
            isLoading={isLoading && !planDetails && !isWeekLoading}
            error={error}
            navigate={navigate}
        />
    );

    // If PlanHeader renders an element (not null), it means it's handling an initial loading/error state.
    // In this case, we return what PlanHeader rendered.
    if (planHeaderOutputComponent.props.children !== undefined && planHeaderOutputComponent.type !== React.Fragment) {
        if (!planId ||
            (error && planId && !(isLoading && planDetails)) ||
            (isLoading && !planDetails && planId) ||
            (!isLoading && !planDetails && planId && !error)
        ) {
            return planHeaderOutputComponent;
        }
    }

    // If PlanHeader did not render a blocking view, proceed to render the main layout.
    // We also need to ensure planId is defined before rendering the rest of the content
    // that relies on it (like WorkoutExerciseItem, WorkoutItem).
    // planDetails should also be available if we reach this point and planId is valid.
    if (!planId || !planDetails) {
        // Show a loader if data is still loading
        if (isLoading) {
            return (
                <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress sx={{ color: NEON_PURPLE, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: NEON_PURPLE, fontWeight: 'bold' }}>Loading workout plan...</Typography>
                </Box>
            );
        }
        // Only show error if loading is done and data is still missing
        if (!error) {
            return (
                <Box sx={{ p: 3, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
                    <Typography variant="h5" sx={{ mb: 2, color: NEON_PURPLE, fontWeight: 'bold' }}>
                        Error
                    </Typography>
                    <Typography>Workout plan data is unavailable. Please try again.</Typography>
                    <Button onClick={() => navigate('/training-plans')} sx={{ mt: 2 }}>Go to Plans</Button>
                </Box>
            );
        }
        return planHeaderOutputComponent;
    }

    // At this point, planId and planDetails are guaranteed to be defined due to the checks above.
    // The `planId` variable here is now effectively string, and `planDetails` is WorkoutDetails.

    return (
        <Box sx={{ p: { xs: 0, sm: 2, md: 3 }, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
            {planHeaderOutputComponent}

            {planDetails && planDetails.durationWeeks > 0 && (
                <PlanWeekHeader
                    currentWeek={weekNumber}
                    maxWeeks={planDetails.durationWeeks}
                    onNavigate={handleLocalWeekNavigate}
                    isWeekLoading={isWeekLoading}
                    progressPercentage={progressPercentage}
                    completedSetsCount={completedSetsCount}
                    totalSetsCount={totalSetsCount}
                />
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
                    planId={planId} weekNumber={weekNumber} activeExercises={activeExercises} completedExercises={completedExercises}
                    showCompleted={showCompleted} selectedExercises={selectedExercises} showSelectionMode={showSelectionMode}
                    handleSetCompletionUpdate={handleSetCompletionUpdate} handleExerciseSelect={handleExerciseSelect}
                    toggleShowCompleted={toggleShowCompleted}
                />
            )}
            {activeTab === WORKOUTS_TAB_INDEX && (
                <WorkoutTabContent
                    planId={planId} weekNumber={weekNumber} savedWorkouts={savedWorkouts} isWorkoutsLoading={isWorkoutsLoading}
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
                />
            )}

            {/* SelectedExercisesBar: only show on Exercises tab */}
            {showSelectionMode && selectedExercises.length > 0 && activeTab === EXERCISES_TAB_INDEX && (
                <SelectedExercisesBar
                    selectedExercises={selectedExercises}
                    activeTab={activeTab}
                    handleStartWorkout={handleStartWorkout} // This will now replace the active session if one exists
                />
            )}
        </Box>
    );
};