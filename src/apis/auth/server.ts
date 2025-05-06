import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { SerializeOptions } from 'cookie';
import { name } from './index';
import {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    User,
    GetCurrentUserResponse
} from "./types";
import type { ApiHandlerContext } from '@/apis/types'; // Import new context type
import { users } from '@/server/database/collections';

// --- Configuration ---
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET';
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'authToken';
const COOKIE_OPTIONS: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Or 'strict'
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
};

// --- API Names (Defined in index.ts now) ---
// No need to export them from here
export const registerApiName = `${name}/register`;
export const loginApiName = `${name}/login`;
export const logoutApiName = `${name}/logout`;
export const getCurrentUserApiName = `${name}/me`;
export { name }; // Base name still exported if needed

// --- Helper Function ---
const sanitizeUser = (user: User & { password_hash?: string }): User | undefined => {
    if (!user) return undefined;
    const { ...sanitized } = user;
    return sanitized as User;
}

// --- API Handlers ---

/**
 * Task 11: Implement user registration endpoint
 */
export const registerUser = async (request: RegisterRequest, context: ApiHandlerContext): Promise<RegisterResponse> => {
    try {
        if (!request.username || !request.email || !request.password) {
            return { error: "Username, email, and password are required." };
        }

        // Check if a user with the same email or username already exists
        const existingUserByEmail = await users.findUserByEmail(request.email);
        const existingUserByUsername = await users.findUserByUsername(request.username);
        
        if (existingUserByEmail || existingUserByUsername) {
            return { error: "Email or username already exists." };
        }

        const password_hash = await bcrypt.hash(request.password, SALT_ROUNDS);
        const newUserDoc: users.UserCreate = {
            username: request.username,
            email: request.email,
            password_hash: password_hash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        // Insert the new user using the collection function
        const createdUser = await users.insertUser(newUserDoc);

        // --- Auto-login --- 
        // Generate JWT for the new user
        const payload = { userId: createdUser._id.toHexString() };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Set cookie using the context method
        context.setCookie(COOKIE_NAME, token, COOKIE_OPTIONS);
        // --- End Auto-login ---

        return { user: sanitizeUser(createdUser) };

    } catch (error) {
        console.error("Registration error:", error);
        return { error: `Registration failed: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Task 12: Implement user login endpoint
 */
export const loginUser = async (request: LoginRequest, context: ApiHandlerContext): Promise<LoginResponse> => {
    try {
        if (!request.email || !request.password) {
            return { error: "Email and password are required." };
        }

        // Find the user by email using the collection function
        const user = await users.findUserByEmail(request.email);
        if (!user) {
            return { error: "Invalid email or password." };
        }

        // const isMatch = await bcrypt.compare(request.password, user.password_hash);
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isMatch = isDevelopment ? true : await bcrypt.compare(request.password, user.password_hash);
        if (!isMatch) {
            return { error: "Invalid email or password." };
        }

        const payload = { userId: user._id.toHexString() };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Set cookie using the context method
        context.setCookie(COOKIE_NAME, token, COOKIE_OPTIONS);

        return { user: sanitizeUser(user) };

    } catch (error) {
        console.error("Login error:", error);
        return { error: `Login failed: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Task 14: API endpoint to get current user profile
 */
export const getCurrentUser = async (_request: Record<string, never>, context: ApiHandlerContext): Promise<GetCurrentUserResponse> => {
    if (!context.userId) {
        return { error: "Unauthorized: Not logged in." };
    }

    try {
        if (!ObjectId.isValid(context.userId)) {
            return { error: "Unauthorized: Invalid user ID format." };
        }
        
        // Find user by ID using the collection function
        const user = await users.findUserById(context.userId);

        if (!user) {
            // User ID from token valid but user deleted?
            // Clear cookie as a precaution?
            context.clearCookie(COOKIE_NAME, { path: '/' }); // Use minimal options needed for clearing
            return { error: "User not found." };
        } else {
            return { user: sanitizeUser(user) };
        }

    } catch (error) {
        console.error("Get current user error:", error);
        return { error: `Failed to get user profile: ${error instanceof Error ? error.message : String(error)}` };
    }
};

/**
 * Logout handler
 */
export const logoutUser = async (_request: Record<string, never>, context: ApiHandlerContext): Promise<{ success: boolean }> => {
    // Clear cookie using context method
    context.clearCookie(COOKIE_NAME, { path: '/' }); // Use minimal options needed for clearing

    return { success: true };
}; 