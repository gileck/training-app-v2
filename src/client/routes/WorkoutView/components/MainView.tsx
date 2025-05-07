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
    Tabs,
    Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { WorkoutViewProps, WeekNavigatorProps } from './types';
import { PlanHeader } from './PlanHeader';
import { WeeklyProgressDisplay } from './WeeklyProgressDisplay';
import { SelectedExercisesBar } from './SelectedExercisesBar';
import { ActiveWorkoutContent } from './ActiveWorkoutContent';
import { ExerciseTabContent } from './ExerciseTabContent';
import { WorkoutTabContent } from './WorkoutTabContent';

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

    activeWorkoutSession,
    activeWorkoutName,

    // Destructure new callback props
    onIncrementActiveSet,
    onDecrementActiveSet,
    onCompleteActiveExercise,
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
    React.useEffect(() => {
        if (!showSelectionMode) {
            handleStartSelectionMode();
        }
    }, [showSelectionMode, handleStartSelectionMode]);

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
        // This case should ideally be caught by PlanHeader or indicate an unexpected state.
        // Render a fallback or an error if PlanHeader didn't catch it.
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
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: LIGHT_BG, color: '#333', minHeight: '100vh' }}>
            {planHeaderOutputComponent}

            {planDetails && planDetails.durationWeeks > 0 && (
                <WeekNavigator
                    currentWeek={weekNumber}
                    maxWeeks={planDetails.durationWeeks}
                    onNavigate={handleLocalWeekNavigate}
                    isWeekLoading={isWeekLoading}
                />
            )}

            <WeeklyProgressDisplay
                progressPercentage={progressPercentage}
                completedExercisesCount={completedExercisesCount}
                totalExercises={totalExercises}
            />

            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 3, '& .MuiTabs-indicator': { backgroundColor: NEON_PURPLE } }}
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
                    onCompleteExercise={onCompleteActiveExercise}
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