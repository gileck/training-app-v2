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
        imageUrl: definition.imageUrl,
        createdAt: definition.createdAt,
        updatedAt: definition.updatedAt
    } as ExerciseDefinition;
}

/**
 * Fetches all exercise definitions (simplified for options list).
 * Corresponds to API: exerciseDefinitions/getAllOptions
 */
export const processGetAllOptions = async (): Promise<GetAllExerciseDefinitionsResponse> => {
    try {
        // Use the new database layer to get options
        const options = await exerciseDefinitions.getAllExerciseDefinitionOptions();

        // Map to expected API response format
        return options.map(opt => ({
            _id: opt._id,
            name: opt.name
        }));
    } catch (error) {
        console.error('Error fetching exercise definitions:', error);
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
            throw new Error('Invalid Definition ID');
        }

        // Use the new database layer to get definition by ID
        const definition = await exerciseDefinitions.findExerciseDefinitionById(definitionId);

        if (!definition) {
            throw new Error('Exercise Definition not found');
        }

        // Map to expected API response format
        return mapToApiExerciseDefinition(definition);
    } catch (error) {
        console.error('Error fetching exercise definition:', error);
        throw new Error(`Failed to fetch exercise definition: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 