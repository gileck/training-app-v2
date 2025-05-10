import type { ObjectId } from 'mongodb';

// Basic User Structure (adjust based on actual user data needed)
export interface User {
    _id: ObjectId;
    username: string;
    email: string;
    // Avoid sending password hash to client
    createdAt?: Date;
    updatedAt?: Date;
}

// Registration
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    user?: User; // Return created user on success
    error?: string;
}

// Login
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user?: User;
    // Token is typically handled via HttpOnly cookie, not in response body
    error?: string;
}

// Get Current User (Me)
// No request body needed, user identified by token/session
export interface GetCurrentUserResponse {
    user?: User;
    error?: string;
} 