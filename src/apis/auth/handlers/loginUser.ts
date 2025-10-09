import { login } from '../index';
import {
    ApiHandlerContext,
    LoginRequest,
    LoginResponse,
} from '../types';
import * as users from '@/server/database/collections/users/users';
import { COOKIE_NAME, sanitizeUser } from '../server';

// Login endpoint
export const loginUser = async (
    request: LoginRequest,
    context: ApiHandlerContext
): Promise<LoginResponse> => {
    try {
        // Validate input
        if (!request.username || !request.password) {
            return { error: "Username and password are required" };
        }

        // Find user by username
        const user = await users.findUserByUsername(request.username);
        if (!user) {
            return { error: "Invalid username or password" };
        }

        // Verify password directly (simplest possible auth per requirements)
        if (user.password !== request.password) {
            return { error: "Invalid username or password" };
        }

        // Set auth cookie to user id
        context.setCookie(COOKIE_NAME, user._id.toHexString());

        return { user: sanitizeUser(user) };
    } catch (error: unknown) {
        console.error("Login error:", error);
        return { error: error instanceof Error ? error.message : "Login failed" };
    }
};

// Export API endpoint name
export { login }; 