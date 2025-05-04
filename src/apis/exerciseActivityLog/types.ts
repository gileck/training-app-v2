import { Document } from 'mongodb';

export interface ExerciseActivityLogBase {
    userId: string;
    date: Date;
    planId: string;
    exerciseId: string;
    exerciseDefinitionId: string;
    setsCompleted: number;
    weekNumber: number;
}

export interface ExerciseActivityLog extends Document, ExerciseActivityLogBase {}

export interface GetActivityLogParams {
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    planId?: string;
    exerciseId?: string;
}

export interface GetActivityLogResponse {
    success: boolean;
    data?: ExerciseActivityLogWithDetails[];
    error?: string;
}

export interface ExerciseActivityLogWithDetails extends ExerciseActivityLogBase {
    _id: string;
    exerciseName: string;
    planName: string;
    primaryMuscle?: string;
    weight?: string;
    reps?: number;
}

export interface UpdateActivityLogParams {
    activityId: string;
    setsCompleted?: number;
    date?: string; // ISO date string
}

export interface UpdateActivityLogResponse {
    success: boolean;
    data?: ExerciseActivityLogWithDetails;
    error?: string;
}

export interface DeleteActivityLogParams {
    activityId: string;
}

export interface DeleteActivityLogResponse {
    success: boolean;
    error?: string;
}

export interface GetActivitySummaryParams {
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    groupBy?: 'day' | 'week' | 'month';
}

export interface DailyActivitySummary {
    date: string;
    totalSets: number;
    exerciseCount: number;
    muscleGroups: { [key: string]: number }; // muscle group -> sets count
}

export interface GetActivitySummaryResponse {
    success: boolean;
    data?: DailyActivitySummary[];
    error?: string;
} 