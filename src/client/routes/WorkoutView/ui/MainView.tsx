import React from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Stack,
    Paper,
    alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { WorkoutViewProps, WeekNavigatorProps } from './types';
import { PlanHeader } from './PlanHeader';
import { WeeklyProgressDisplay } from './WeeklyProgressDisplay';
import { MainTabs } from './MainTabs';
import { SelectedExercisesBar } from './SelectedExercisesBar';

// --- Color constants for the light theme --- //
const LIGHT_BG = '#FFFFFF';
const LIGHT_PAPER = '#F5F5F7';
const NEON_PURPLE = '#9C27B0';
const NEON_BLUE = '#3D5AFE';

// --- Sub Components --- //

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentWeek, maxWeeks, onNavigate, isWeekLoading = false }) => {
    return (
        <Paper
            elevation={2}
            sx={{
                mb: 3,
                bgcolor: LIGHT_PAPER,
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha(NEON_PURPLE, 0.2)}`,
                boxShadow: `0 4px 12px ${alpha(NEON_PURPLE, 0.15)}`
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                <IconButton
                    onClick={() => onNavigate(currentWeek - 1)}
                    disabled={currentWeek <= 1 || isWeekLoading}
                    sx={{
                        color: NEON_PURPLE,
                        '&.Mui-disabled': {
                            color: alpha(NEON_PURPLE, 0.3)
                        }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {isWeekLoading ? (
                        <CircularProgress
                            size={24}
                            sx={{
                                color: NEON_BLUE,
                                position: 'absolute',
                                left: -36,
                                mx: 'auto'
                            }}
                        />
                    ) : null}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#333',
                            textShadow: `0 0 1px ${alpha(NEON_PURPLE, 0.3)}`
                        }}
                    >
                        WEEK {currentWeek} / {maxWeeks}
                    </Typography>
                </Box>
                <IconButton
                    onClick={() => onNavigate(currentWeek + 1)}
                    disabled={currentWeek >= maxWeeks || isWeekLoading}
                    sx={{
                        color: NEON_PURPLE,
                        '&.Mui-disabled': {
                            color: alpha(NEON_PURPLE, 0.3)
                        }
                    }}
                >
                    <ArrowForwardIcon />
                </IconButton>
            </Stack>
        </Paper>
    );
};

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
    savedWorkouts,
    isWorkoutsLoading,

    navigate,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    handleStartSelectionMode,
    handleStartWorkout,
    toggleShowCompleted,
    handleNavigateWeek,
    fetchSavedWorkouts,
    toggleWorkoutExpanded,
    handleSavedWorkoutExerciseSetCompletionUpdate
}) => {
    // State to track loading of week data
    const [isWeekLoading, setIsWeekLoading] = React.useState(false);
    // Add tab state
    const [activeTab, setActiveTab] = React.useState(0);

    // Start selection mode by default
    React.useEffect(() => {
        if (!showSelectionMode) {
            handleStartSelectionMode();
        }
    }, [showSelectionMode, handleStartSelectionMode]);

    // Modified navigate handler to show loading state
    const handleWeekNavigate = (week: number) => {
        setIsWeekLoading(true);
        handleNavigateWeek(week);
    };

    // Reset loading state when data arrives or week number changes
    React.useEffect(() => {
        if (!isLoading) {
            setIsWeekLoading(false);
        }
    }, [isLoading, weekNumber]);

    // Fetch saved workouts when tab is Workouts
    React.useEffect(() => {
        if (activeTab === 1) {
            fetchSavedWorkouts();
        }
    }, [activeTab, fetchSavedWorkouts]);

    // Handle tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        // Fetch saved workouts data when switching to workouts tab
        if (newValue === 1) {
            fetchSavedWorkouts();
        }
    };

    // Call PlanHeader to get its output
    const planHeaderOutput = (
        <PlanHeader
            planId={planId}
            weekNumber={weekNumber}
            planDetails={planDetails}
            isLoading={isLoading && !planDetails && !isWeekLoading} // Pass isLoading for initial plan details fetch
            error={error}
            navigate={navigate}
        />
    );

    // If PlanHeader renders an element (not null), it means it's handling an initial loading/error state.
    // In this case, we return what PlanHeader rendered.
    if (planHeaderOutput.props.children !== undefined && planHeaderOutput.type !== React.Fragment) { // A more robust check if it rendered actual content
        // A more direct check: if any of the conditions within PlanHeader that return JSX are met, it will render.
        // This check relies on the internal logic of PlanHeader, which is not ideal, but simpler than inspecting React elements.
        if (!planId ||
            (error && planId && !(isLoading && planDetails)) ||
            (isLoading && !planDetails && planId) ||
            (!isLoading && !planDetails && planId && !error) // Added !error here to distinguish from the error case above
        ) {
            return planHeaderOutput;
        }
    }

    // If PlanHeader did not render a blocking view, proceed to render the main layout.
    // We also need to ensure planId is defined before rendering the rest of the content
    // that relies on it (like WorkoutExerciseItem, WorkoutItem).
    // planDetails should also be available if we reach this point and planId is valid.
    if (!planId || !planDetails) {
        // This case should ideally be caught by PlanHeader or indicate an unexpected state.
        // Render a fallback or an error if PlanHeader didn't catch it.
        if (!error) { // Avoid double-rendering error if PlanHeader already did for planId issues.
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
        return planHeaderOutput; // Or return what PlanHeader decided if there was an error it handled.
    }

    // At this point, planId and planDetails are guaranteed to be defined due to the checks above.
    // The `planId` variable here is now effectively string, and `planDetails` is WorkoutDetails.

    return (
        <Box sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: LIGHT_BG,
            color: '#333',
            minHeight: '100vh',
            pb: 8
        }}>
            {planHeaderOutput /* Render PlanHeader output if it was null before, it won't show anything, but good to keep structure */}
            {/* WeekNavigator should be displayed if PlanHeader didn't render a blocking page */}
            {planDetails && (
                <WeekNavigator
                    currentWeek={weekNumber}
                    maxWeeks={planDetails.durationWeeks}
                    onNavigate={handleWeekNavigate}
                    isWeekLoading={isWeekLoading}
                />
            )}

            {planDetails && (
                <WeeklyProgressDisplay
                    progressPercentage={progressPercentage}
                    completedExercisesCount={completedExercisesCount}
                    totalExercises={totalExercises}
                />
            )}

            {/* Display content area loading state during week changes */}
            {(isLoading || isWeekLoading) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                    <CircularProgress sx={{ color: NEON_PURPLE }} />
                </Box>
            ) : (
                <MainTabs
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                    planId={planId as string} // planId is confirmed string here by previous checks
                    weekNumber={weekNumber}
                    activeExercises={activeExercises}
                    completedExercises={completedExercises}
                    showCompleted={showCompleted}
                    selectedExercises={selectedExercises}
                    showSelectionMode={showSelectionMode}
                    handleSetCompletionUpdate={handleSetCompletionUpdate}
                    handleExerciseSelect={handleExerciseSelect}
                    toggleShowCompleted={toggleShowCompleted}
                    savedWorkouts={savedWorkouts}
                    isWorkoutsLoading={isWorkoutsLoading}
                    toggleWorkoutExpanded={toggleWorkoutExpanded}
                    handleSavedWorkoutExerciseSetCompletionUpdate={handleSavedWorkoutExerciseSetCompletionUpdate}
                />
            )}

            <SelectedExercisesBar
                selectedExercises={selectedExercises}
                activeTab={activeTab}
                handleStartWorkout={handleStartWorkout}
            />
        </Box>
    );
};