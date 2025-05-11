import type { SavedWorkoutWithExercises as ApiSavedWorkoutWithExercises } from '@/apis/savedWorkouts/types';

export interface ClientWorkoutDisplay extends Omit<ApiSavedWorkoutWithExercises, '_id' | 'userId' | 'trainingPlanId' | 'createdAt' | 'updatedAt'> {
    _id: string;
    userId: string;
    trainingPlanId: string;
    createdAt: string;
    updatedAt: string;
    isExercisesLoading?: boolean;
    exercisesError?: string | null;
} 