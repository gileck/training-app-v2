export type AssistantMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type AddExerciseAction = {
    type: 'addExerciseToPlan';
    payload: {
        planId: string;
        exerciseDefinitionId: string;
        sets?: number;
        reps?: number;
    };
    summary: string;
    confidence: number; // 0..1
};

export type ProposedAction =
    | AddExerciseAction
    | { type: 'removeExerciseFromPlan'; payload: { planId: string; exerciseId: string }; summary: string; confidence: number }
    | { type: 'editExerciseInPlan'; payload: { planId: string; exerciseId: string; updates: Record<string, unknown> }; summary: string; confidence: number }
    | { type: 'addWorkoutToPlan'; payload: { planId: string; name?: string }; summary: string; confidence: number }
    | { type: 'removeWorkoutFromPlan'; payload: { planId: string; workoutId: string }; summary: string; confidence: number }
    | { type: 'renameWorkout'; payload: { planId: string; workoutId: string; newName: string }; summary: string; confidence: number };

export interface SuggestActionsRequest {
    planId: string;
    messages: AssistantMessage[];
    modelId: string;
}

export interface SuggestActionsResponse {
    actions: ProposedAction[];
    assistantMessages: AssistantMessage[];
    clarificationNeeded?: boolean;
    error?: string;
    cost: { totalCost: number;[k: string]: number };
}



