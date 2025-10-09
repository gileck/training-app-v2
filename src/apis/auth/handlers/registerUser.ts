import { register } from '../index';
import {
    ApiHandlerContext,
    RegisterRequest,
    RegisterResponse,
} from '../types';
import * as users from '@/server/database/collections/users/users';
import { COOKIE_NAME, sanitizeUser } from '../server';

// Register endpoint
export const registerUser = async (
    request: RegisterRequest,
    context: ApiHandlerContext
): Promise<RegisterResponse> => {
    try {
        // Validate input
        if (!request.username || !request.password) {
            return { error: "Username and password are required" };
        }

        const newUser = await users.insertUser({
            username: request.username,
            password: request.password,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Set cookie with user id for simple auth
        context.setCookie(COOKIE_NAME, newUser._id.toHexString());

        return { user: sanitizeUser(newUser) };
    } catch (error: unknown) {
        console.error("Registration error:", error);
        return { error: error instanceof Error ? error.message : "Registration failed" };
    }
};

// Export API endpoint name
export { register }; 