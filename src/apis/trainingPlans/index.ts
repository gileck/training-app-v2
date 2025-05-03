// Export types for both client and server
export * from './types';

// Export the API base name
export const name = "trainingPlans";

// --- API Names ---
export const getAllApiName = `${name}/getAll`;
export const getByIdApiName = `${name}/getById`;
export const createApiName = `${name}/create`;
export const updateApiName = `${name}/update`;
export const deleteApiName = `${name}/delete`;
export const duplicateApiName = `${name}/duplicate`;
export const setActiveApiName = `${name}/setActive`;
export const getActiveApiName = `${name}/getActive`;

