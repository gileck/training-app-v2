// Export types for both client and server
export * from './types';

// Export the API base name
export const name = "trainingPlans";

// Export specific API endpoint names (safe for client/server)
export {
    getAllApiName,
    getByIdApiName,
    createApiName,
    updateApiName,
    deleteApiName,
    duplicateApiName
} from './server'; // Re-export names defined in server.ts 