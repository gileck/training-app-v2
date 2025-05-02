// Export types for both client and server
export * from './types';

// Export the API base name - must be unique across all APIs
export const name = "auth";

// Export specific API endpoint names (safe for client/server)
export const registerApiName = `${name}/register`;
export const loginApiName = `${name}/login`;
export const logoutApiName = `${name}/logout`;
export const getCurrentUserApiName = `${name}/me`; 