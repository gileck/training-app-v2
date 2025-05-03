// Base interface for aggregated daily activity
export interface DailyActivitySummary {
    date: string; // ISO date string 'YYYY-MM-DD'
    totalSetsCompleted: number;
    totalExercisesCompleted: number;
    exerciseTypes: {
        [exerciseType: string]: number; // Count by exercise type
    };
}

// --- API Types for GET /progress-view/daily-activity --- //
export interface GetDailyActivityRequest {
    startDate: string; // ISO date string 'YYYY-MM-DD'
    endDate: string; // ISO date string 'YYYY-MM-DD'
}

export type GetDailyActivityResponse = DailyActivitySummary[]; 