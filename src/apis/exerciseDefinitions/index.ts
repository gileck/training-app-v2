// src/apis/exerciseDefinitions/index.ts
// Export types for both client and server
export * from './types';

// Export the API base name - must be unique across all APIs
export const name = "exerciseDefinitions";

// --- API Names ---
export const getAllOptionsApiName = `${name}/getAllOptions`;
export const getByIdApiName = `${name}/getById`;