// Re-export shared types for training plans
export type {
    TrainingPlan,
    CreateTrainingPlanRequest,
    UpdateTrainingPlanRequest,
    GetTrainingPlanRequest,
    DeleteTrainingPlanRequest,
    DuplicateTrainingPlanRequest,
    SetActiveTrainingPlanRequest,
    GetAllTrainingPlansRequest,
    GetAllTrainingPlansResponse,
    GetTrainingPlanResponse,
    CreateTrainingPlanResponse,
    UpdateTrainingPlanResponse,
    DeleteTrainingPlanResponse,
    DuplicateTrainingPlanResponse,
    SetActiveTrainingPlanResponse,
    GetActiveTrainingPlanRequest,
    GetActiveTrainingPlanResponse
} from '@/common/types/training';

// API name constants
export const nameSetActive = 'trainingPlans.setActive';
export const nameGetActive = 'trainingPlans.getActive'; 