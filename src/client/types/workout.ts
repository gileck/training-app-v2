import type { ExerciseBase, WeeklyProgressBase } from '@/common/types/training';

// Type for combined exercise data with progress and definition details
export interface WorkoutExercise extends ExerciseBase {
    name?: string;
    progress?: WeeklyProgressBase;
    definition?: {
        primaryMuscle?: string;
        secondaryMuscles?: string[];
        bodyWeight?: boolean;
        type?: string;
        imageUrl?: string;
        hasComments?: boolean;
    };
} 