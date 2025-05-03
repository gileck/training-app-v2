import { getDb } from '@/server/database';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export * from './index';

import { name as baseName } from './index';
import type {
    GetAllExerciseDefinitionsResponse,
    GetExerciseDefinitionByIdRequestParams,
    GetExerciseDefinitionByIdResponse,
    ExerciseDefinition
} from './types';


export { baseName as name };

// --- Server-Side Processing Functions ---

/**
 * Fetches all exercise definitions (simplified for options list).
 * Corresponds to API: exerciseDefinitions/getAllOptions
 */
export const processGetAllOptions = async (): Promise<GetAllExerciseDefinitionsResponse> => {
    try {
        const db = await getDb();

        // Query using MongoDB driver directly instead of Mongoose
        const options = await db.collection('exerciseDefinitions')
            .find({}, { projection: { _id: 1, name: 1 } })
            .toArray();

        // Convert _id to string for client consumption
        const formattedOptions = options.map(opt => ({
            _id: opt._id.toString(),
            name: opt.name
        }));

        return formattedOptions;
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
        const db = await getDb();
        const { definitionId } = params;

        if (!definitionId || !mongoose.Types.ObjectId.isValid(definitionId)) {
            throw new Error('Invalid Definition ID');
        }

        const definition = await db.collection('exerciseDefinitions')
            .findOne({ _id: new ObjectId(definitionId) });

        if (!definition) {
            throw new Error('Exercise Definition not found');
        }

        // Cast the MongoDB document to ExerciseDefinition type
        return definition as ExerciseDefinition;
    } catch (error) {
        console.error('Error fetching exercise definition:', error);
        throw new Error(`Failed to fetch exercise definition: ${error instanceof Error ? error.message : String(error)}`);
    }
}; 