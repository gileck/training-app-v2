import React from 'react';
import {
    Box,
    Tabs,
    Tab,
    alpha
} from '@mui/material';
import { MainTabsProps } from './types';
import { ExerciseTabContent } from './ExerciseTabContent';
import { WorkoutTabContent } from './WorkoutTabContent';

// Placeholder components - these will be implemented in later steps
// const ExerciseTabContentPlaceholder: React.FC<any> = (props) => (
// <Box><Typography>Exercise Tab Content (Placeholder)</Typography></Box>
// );
// const WorkoutTabContentPlaceholder: React.FC<any> = (props) => (
// <Box><Typography>Workout Tab Content (Placeholder)</Typography></Box>
// );

// --- Color constants ---
const NEON_PURPLE = '#9C27B0';

export const MainTabs: React.FC<MainTabsProps> = ({
    activeTab,
    handleTabChange,
    // ExerciseTabContent props
    planId,
    weekNumber,
    activeExercises,
    completedExercises,
    showCompleted,
    selectedExercises,
    showSelectionMode,
    handleSetCompletionUpdate,
    handleExerciseSelect,
    toggleShowCompleted,
    // WorkoutTabContent props
    savedWorkouts,
    isWorkoutsLoading,
    toggleWorkoutExpanded,
    handleSavedWorkoutExerciseSetCompletionUpdate,
    startActiveWorkout
}) => {
    return (
        <Box>
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                    mb: 3,
                    '& .MuiTabs-indicator': {
                        backgroundColor: NEON_PURPLE
                    }
                }}
            >
                <Tab
                    label="Exercises"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        color: activeTab === 0 ? NEON_PURPLE : alpha('#000000', 0.6),
                        '&.Mui-selected': {
                            color: NEON_PURPLE
                        }
                    }}
                />
                <Tab
                    label="Workouts"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        color: activeTab === 1 ? NEON_PURPLE : alpha('#000000', 0.6),
                        '&.Mui-selected': {
                            color: NEON_PURPLE
                        }
                    }}
                />
            </Tabs>

            {/* Exercises Tab Content */}
            {activeTab === 0 && (
                <ExerciseTabContent
                    planId={planId}
                    weekNumber={weekNumber}
                    activeExercises={activeExercises}
                    completedExercises={completedExercises}
                    showCompleted={showCompleted}
                    selectedExercises={selectedExercises}
                    showSelectionMode={showSelectionMode}
                    handleSetCompletionUpdate={handleSetCompletionUpdate}
                    handleExerciseSelect={handleExerciseSelect}
                    toggleShowCompleted={toggleShowCompleted}
                />
            )}

            {/* Workouts Tab Content */}
            {activeTab === 1 && (
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
        </Box>
    );
}; 