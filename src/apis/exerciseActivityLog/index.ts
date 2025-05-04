// Export types for both client and server
export * from './types';

// Export the API names - must be unique across all APIs
export const name = "exerciseActivityLog";
export const getActivityLogsApiName = `${name}/get`;
export const updateActivityLogApiName = `${name}/update`;
export const deleteActivityLogApiName = `${name}/delete`;
export const getActivitySummaryApiName = `${name}/summary`; 