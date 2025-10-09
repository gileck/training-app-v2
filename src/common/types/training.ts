// Core entity types with ObjectIds converted to strings for client-side usage
// These types are used across database, API, and state management

export interface TrainingPlan {
    _id: string;          // ObjectId → string
    userId: string;       // ObjectId → string  
    name: string;
    durationWeeks: number;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExerciseBase {
    _id: string;                    // ObjectId → string
    userId: string;                 // ObjectId → string
    trainingPlanId: string;         // ObjectId → string
    exerciseDefinitionId: string;   // ObjectId → string
    sets: number;
    reps: number;
    weight?: number;
    durationSeconds?: number;
    order?: number;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WeeklyNote {
    noteId: string;       // ObjectId → string
    date: Date;
    note: string;
}

export interface WeeklyProgressBase {
    _id: string;          // ObjectId → string
    userId: string;       // ObjectId → string
    planId: string;       // ObjectId → string
    exerciseId: string;   // ObjectId → string
    weekNumber: number;
    setsCompleted: number;
    isExerciseDone: boolean;
    completed?: boolean;
    lastUpdatedAt: Date;
    weeklyNotes: WeeklyNote[];
}

export interface SavedWorkoutExercise {
    exerciseId: string;   // ObjectId → string
    order: number;
}

export interface SavedWorkout {
    _id: string;             // ObjectId → string
    userId: string;          // ObjectId → string
    name: string;
    exercises: SavedWorkoutExercise[];
    trainingPlanId: string;  // ObjectId → string
    createdAt: Date;
    updatedAt: Date;
}

export interface SavedWorkoutWithExercises extends Omit<SavedWorkout, 'exercises'> {
    exercises: ExerciseBase[]; // Full exercise objects
}

// Request/response types for API layer
export interface CreateTrainingPlanRequest {
    name: string;
    durationWeeks: number;
}

export interface UpdateTrainingPlanRequest {
    planId: string;
    name?: string;
    durationWeeks?: number;
}

export interface GetTrainingPlanRequest {
    planId: string;
}

export interface DeleteTrainingPlanRequest {
    planId: string;
}

export interface DuplicateTrainingPlanRequest {
    planId: string;
}

export interface SetActiveTrainingPlanRequest {
    planId: string;
}

export interface AddExerciseRequest {
    trainingPlanId: string;
    exerciseDefinitionId: string;  // ObjectId → string
    sets: number;
    reps: number;
    weight?: number;
    durationSeconds?: number;
    comments?: string;
}

export interface UpdateExerciseRequest {
    exerciseId: string;
    trainingPlanId: string;
    updates: Partial<Pick<ExerciseBase, 'sets' | 'reps' | 'weight' | 'durationSeconds' | 'order' | 'comments'>>;
}

export interface GetExercisesRequest {
    trainingPlanId: string;
}

export interface DeleteExerciseRequest {
    exerciseId: string;
    trainingPlanId: string;
}

export interface CreateSavedWorkoutRequest {
    name: string;
    exerciseIds: string[];
    trainingPlanId: string;
}

export interface UpdateSetCompletionRequest {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    setsIncrement: number;
    totalSetsForExercise?: number;
    completeAll?: boolean;
}

export interface UpdateSetCompletionResponse {
    success: boolean;
    updatedProgress?: WeeklyProgressBase;
    message?: string;
}

export interface GetWeeklyProgressRequest {
    planId: string;
    exerciseId: string;
    weekNumber: number;
}

export interface GetAllSavedWorkoutsRequest {
    trainingPlanId?: string;
}

export interface DeleteSavedWorkoutRequest {
    workoutId: string;
}

export interface GetSavedWorkoutDetailsRequest {
    workoutId: string;
}

export interface AddExerciseToSavedWorkoutRequest {
    workoutId: string;
    exerciseId: string;
}

export interface RemoveExerciseFromSavedWorkoutRequest {
    workoutId: string;
    exerciseIdToRemove: string;
}

export interface RenameSavedWorkoutRequest {
    workoutId: string;
    newName: string;
}

export interface AddWeeklyNoteRequest {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    note: string;
}

export interface EditWeeklyNoteRequest {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    noteId: string;
    updatedNote: string;
}

export interface DeleteWeeklyNoteRequest {
    planId: string;
    exerciseId: string;
    weekNumber: number;
    noteId: string;
}

// API Response types
export type GetAllTrainingPlansRequest = Record<string, never>;
export type GetAllTrainingPlansResponse = TrainingPlan[];
export type GetTrainingPlanResponse = TrainingPlan;
export type CreateTrainingPlanResponse = TrainingPlan;
export type UpdateTrainingPlanResponse = TrainingPlan;
export type DeleteTrainingPlanResponse = { success: boolean; message?: string };
export type DuplicateTrainingPlanResponse = TrainingPlan;
export type SetActiveTrainingPlanResponse = { success: boolean; message?: string };
export type GetActiveTrainingPlanRequest = Record<string, never>;
export type GetActiveTrainingPlanResponse = TrainingPlan | null;

export type GetExercisesResponse = ExerciseBase[];
export type AddExerciseResponse = ExerciseBase;
export type UpdateExerciseResponse = ExerciseBase;
export type DeleteExerciseResponse = { success: boolean; message: string };

export type GetWeeklyProgressResponse = WeeklyProgressBase;

export type GetAllSavedWorkoutsResponse = SavedWorkout[];
export type CreateSavedWorkoutResponse = SavedWorkout;
export type DeleteSavedWorkoutResponse = { success: boolean; message: string };
export type GetSavedWorkoutDetailsResponse = SavedWorkoutWithExercises | null;
export type AddExerciseToSavedWorkoutResponse = { success: boolean; message: string } | { error: string };
export type RemoveExerciseFromSavedWorkoutResponse = SavedWorkoutWithExercises | { error: string };
export type RenameSavedWorkoutResponse = SavedWorkout | { error: string };

export type AddWeeklyNoteResponse = WeeklyNote | { error: string };
export type EditWeeklyNoteResponse = WeeklyNote | { error: string };
export type DeleteWeeklyNoteResponse = { success: boolean; message?: string }; 