import type { ExerciseDefinition } from '@/server/database/collections/exerciseDefinitions/types';
export * from '@/server/database/collections/exerciseDefinitions/types';





// --- API Types for GET /api/exercise-definitions (Get All Options) --- //
export type GetAllExerciseDefinitionsRequest = Record<string, never>;
export type GetAllExerciseDefinitionsResponse = ExerciseDefinition[];
// --- API Types for GET /api/exercise-definitions/[definitionId] (Get One) --- //
export interface GetExerciseDefinitionByIdRequestParams {
    definitionId: string; // Passed as query param
}

// Response includes the full definition details
// Ensure the API returns fields consistent with ExerciseDefinitionBase + _id
export type GetExerciseDefinitionByIdResponse = ExerciseDefinition | null; 