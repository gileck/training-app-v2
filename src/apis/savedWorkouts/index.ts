// Export types for both client and server
export * from './types';

// Export the API base name - must be unique across all APIs
export const name = "savedWorkouts";

// Export full API endpoint names
export const getAllApiName = `${name}/getAll`;
export const createApiName = `${name}/create`;
export const deleteApiName = `${name}/delete`;
export const getDetailsApiName = `${name}/getDetails`;
export const addExerciseApiName = `${name}/addExercise`;

// Name for removing an exercise from a saved workout
export const removeExerciseApiName = `${name}/removeExercise`;

// Name for renaming a saved workout
export const renameApiName = `${name}/rename`; 