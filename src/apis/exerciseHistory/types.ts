// Interface representing an exercise activity entry
export interface ExerciseActivityEntry {
    date: string; // ISO date string 'YYYY-MM-DD'
    setsCompleted: number;
}

// Request parameters for getting exercise history
export interface GetExerciseHistoryRequest {
    exerciseId: string;
    startDate?: string; // Optional ISO date string 'YYYY-MM-DD'
    endDate?: string; // Optional ISO date string 'YYYY-MM-DD'
    limit?: number; // Optional limit for number of entries
}

// Response for the exercise history API
export interface GetExerciseHistoryResponse {
    exerciseId: string;
    activityEntries: ExerciseActivityEntry[];
} 