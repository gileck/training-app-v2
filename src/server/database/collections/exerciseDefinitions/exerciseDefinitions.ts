import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import {
  ExerciseDefinition,
  ExerciseDefinitionCreate,
  ExerciseDefinitionUpdate,
  ExerciseDefinitionFilter,
} from './types';

/**
 * Get a reference to the exerciseDefinitions collection
 */
const getExerciseDefinitionsCollection = async (): Promise<Collection<ExerciseDefinition>> => {
  const db = await getDb();
  return db.collection<ExerciseDefinition>('exerciseDefinitions');
};

/**
 * Find all exercise definitions
 * @param filter - Optional filter to apply
 * @returns Array of exercise definitions
 */
export const findAllExerciseDefinitions = async (
  filter?: ExerciseDefinitionFilter
): Promise<ExerciseDefinition[]> => {
  const collection = await getExerciseDefinitionsCollection();
  return collection.find(filter || {}).sort({ name: 1 }).toArray();
};

/**
 * Find a single exercise definition by ID
 * @param definitionId - The ID of the definition
 * @returns The exercise definition or null if not found
 */
export const findExerciseDefinitionById = async (
  definitionId: ObjectId | string
): Promise<ExerciseDefinition | null> => {
  const collection = await getExerciseDefinitionsCollection();
  const idObj = typeof definitionId === 'string' ? new ObjectId(definitionId) : definitionId;
  return collection.findOne({ _id: idObj });
};

/**
 * Get all exercise definitions as options (simplified format for selection lists)
 * Includes global exercises (userId = null) and user-specific exercises
 * @param userId - Optional user ID to include user-specific exercises
 * @returns Array of exercise definition options
 */
export const getAllExerciseDefinitionOptions = async (userId?: ObjectId | string | null): Promise<ExerciseDefinition[]> => {
  const collection = await getExerciseDefinitionsCollection();
  
  // Build filter: include global exercises and user-specific exercises
  if (userId) {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    // Find exercises where userId is null (global) OR matches the user's ID
    const definitions = await collection.find({
      $or: [
        { userId: null },
        { userId: { $exists: false } }, // For backward compatibility with existing data
        { userId: userIdObj }
      ]
    }).sort({ name: 1 }).toArray();
    return definitions;
  } else {
    // If no userId provided, only return global exercises
    const definitions = await collection.find({
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    }).sort({ name: 1 }).toArray();
    return definitions;
  }
};

/**
 * Insert a new exercise definition
 * @param definition - The exercise definition data to insert
 * @returns The inserted exercise definition with _id
 */
export const insertExerciseDefinition = async (
  definition: ExerciseDefinitionCreate
): Promise<ExerciseDefinition> => {
  const collection = await getExerciseDefinitionsCollection();

  // Check if name already exists for this user's scope
  // For global exercises (userId is null/undefined), check globally
  // For user-specific exercises, check within that user's exercises
  let existingDefinition;
  
  if (definition.userId) {
    // User-specific exercise: check if name exists for this user
    existingDefinition = await collection.findOne({ 
      name: definition.name,
      userId: definition.userId
    });
  } else {
    // Global exercise: check if name exists in global scope
    existingDefinition = await collection.findOne({
      name: definition.name,
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    });
  }
  
  if (existingDefinition) {
    const scope = definition.userId ? 'your custom exercises' : 'global exercises';
    throw new Error(`Exercise definition with name "${definition.name}" already exists in ${scope}`);
  }

  const result = await collection.insertOne(definition as ExerciseDefinition);

  if (!result.insertedId) {
    throw new Error('Failed to insert exercise definition');
  }

  return { ...definition, _id: result.insertedId } as ExerciseDefinition;
};

/**
 * Update an existing exercise definition
 * @param definitionId - The ID of the definition to update
 * @param update - The update data
 * @returns The updated exercise definition or null if not found
 */
export const updateExerciseDefinition = async (
  definitionId: ObjectId | string,
  update: ExerciseDefinitionUpdate
): Promise<ExerciseDefinition | null> => {
  const collection = await getExerciseDefinitionsCollection();
  const idObj = typeof definitionId === 'string' ? new ObjectId(definitionId) : definitionId;

  // If name is being updated, check if it already exists
  if (update.name) {
    const existingDefinition = await collection.findOne({
      name: update.name,
      _id: { $ne: idObj }
    });

    if (existingDefinition) {
      throw new Error(`Exercise definition with name "${update.name}" already exists`);
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: idObj },
    { $set: update },
    { returnDocument: 'after' }
  );

  return result || null;
};

/**
 * Delete an exercise definition
 * @param definitionId - The ID of the definition to delete
 * @returns True if the definition was deleted, false otherwise
 */
export const deleteExerciseDefinition = async (
  definitionId: ObjectId | string
): Promise<boolean> => {
  const collection = await getExerciseDefinitionsCollection();
  const idObj = typeof definitionId === 'string' ? new ObjectId(definitionId) : definitionId;

  const result = await collection.deleteOne({ _id: idObj });
  return result.deletedCount === 1;
}; 