import { ObjectId } from 'mongodb';
import { exerciseDefinitions } from '@/server/database/collections';

export * from './index';

import { name as baseName } from './index';
import type {
    GetAllExerciseDefinitionsResponse,
    GetExerciseDefinitionByIdRequestParams,
    GetExerciseDefinitionByIdResponse,
    ExerciseDefinition
} from './types';

export { baseName as name };

// Helper to map DB ExerciseDefinition to API ExerciseDefinition
function mapToApiExerciseDefinition(definition: exerciseDefinitions.ExerciseDefinition): ExerciseDefinition {
    return {
        _id: definition._id,
        name: definition.name,
        primaryMuscle: definition.primaryMuscle,
        secondaryMuscles: definition.secondaryMuscles,
        bodyWeight: definition.bodyWeight,
        type: definition.type,
        static: definition.static,
        imageUrl: definition.imageUrl
    };
}

/**
 * Fetches all exercise definitions.
 * Now returns full ExerciseDefinition objects.
 * API name might still be exerciseDefinitions/getAllOptions for backward compatibility,
 * but the client-side function (e.g., in ExerciseFormDialog) should expect ExerciseDefinition[].
 */
export const processGetAllOptions = async (): Promise<GetAllExerciseDefinitionsResponse> => {
    try {
        // This database layer function now needs to return full ExerciseDefinition-like objects
        const definitionsFromDb = await exerciseDefinitions.getAllExerciseDefinitionOptions();

        // Map to ensure all fields align with the ExerciseDefinition type for the response.
        // If definitionsFromDb already provides perfect ExerciseDefinition objects, this map might simplify.
        return definitionsFromDb.map(def => ({
            _id: def._id,
            name: def.name,
            imageUrl: def.imageUrl,
            primaryMuscle: def.primaryMuscle,
            secondaryMuscles: def.secondaryMuscles,
            bodyWeight: def.bodyWeight,
            type: def.type,
            static: def.static
        }));
    } catch (error) {
        console.error('Error fetching exercise definitions:', error);
        // Consider returning a structured error response instead of throwing directly
        // For now, rethrow as per existing pattern.
        throw new Error('Failed to fetch exercise definitions');
    }
};

/**
 * Fetches a single exercise definition by its ID.
 * Corresponds to API: exerciseDefinitions/getById
 */
export const processGetById = async (params: GetExerciseDefinitionByIdRequestParams): Promise<GetExerciseDefinitionByIdResponse> => {
    try {
        const { definitionId } = params;

        if (!definitionId || !ObjectId.isValid(definitionId)) {
            // Consider returning a structured error object instead of throwing
            throw new Error('Invalid Definition ID');
        }

        const definitionFromDb = await exerciseDefinitions.findExerciseDefinitionById(definitionId);

        if (!definitionFromDb) {
            // Consider returning a structured error or null as per GetExerciseDefinitionByIdResponse
            return null; // Matching GetExerciseDefinitionByIdResponse which allows null
        }

        return mapToApiExerciseDefinition(definitionFromDb);
    } catch (error) {
        console.error('Error fetching exercise definition:', error);
        // Consider returning a structured error response
        throw new Error(`Failed to fetch exercise definition: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 