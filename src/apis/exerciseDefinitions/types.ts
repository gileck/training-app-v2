import type { Document, Types } from 'mongoose';

// Base interface for the full ExerciseDefinition data structure
export interface ExerciseDefinitionBase {
    name: string;
    description?: string;
    primaryMuscle: string;        // Primary muscle targeted
    secondaryMuscles: string[];   // Array of secondary muscles targeted
    bodyWeight: boolean;          // Whether it's a bodyweight exercise
    type: string;                 // Exercise category/type
    equipment?: string; // e.g., 'Barbell', 'Dumbbells', 'Bodyweight'
    imageUrl?: string;
    videoUrl?: string;
    // Assuming createdAt/updatedAt are added by Mongoose timestamps
}

// Interface for ExerciseDefinition document returned from Mongoose
export interface ExerciseDefinition extends ExerciseDefinitionBase, Document {
    _id: Types.ObjectId;
    createdAt: Date; // Add Mongoose timestamp fields
    updatedAt: Date; // Add Mongoose timestamp fields
}

// Simple type for dropdowns/autocomplete fetched from a specific endpoint
// Note: Uses string ID as presumably returned by that specific API
export interface ExerciseDefinitionOption {
    _id: string;
    name: string;
}

// --- API Types for GET /api/exercise-definitions (Get All Options) --- //
export type GetAllExerciseDefinitionsRequest = Record<string, never>;
export type GetAllExerciseDefinitionsResponse = ExerciseDefinitionOption[];

// --- API Types for GET /api/exercise-definitions/[definitionId] (Get One) --- //
export interface GetExerciseDefinitionByIdRequestParams {
    definitionId: string; // Passed as query param
}

// Response includes the full definition details
// Ensure the API returns fields consistent with ExerciseDefinitionBase + _id
export type GetExerciseDefinitionByIdResponse = ExerciseDefinition | null; 