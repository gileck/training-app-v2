import type { ExerciseBase } from '@/apis/exercises/types';
import type { WeeklyProgressBase } from '@/apis/weeklyProgress/types';

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