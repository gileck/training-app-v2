import { UserResponse } from './types';
import { User } from '@/server/database/collections/users/types';

export const COOKIE_NAME = 'auth_user';
export const COOKIE_OPTIONS = {
    path: '/',
    // 7 days persistence
    maxAge: 7 * 24 * 60 * 60,
    // Ensure cookie is not accessible via JS in the browser
    httpOnly: true,
    // Required by Safari for cross-site or some redirect flows; set lax for typical app
    sameSite: 'lax' as const,
    // Only send cookie over HTTPS in production
    secure: process.env.NODE_ENV === 'production'
};

export const sanitizeUser = (user: User): UserResponse => {
    return {
        id: user._id.toString(),
        username: user.username,
        createdAt: user.createdAt.toISOString(),
        profilePicture: user.profilePicture
    };
};

// Import and re-export handlers from the handlers directory
export { registerUser } from './handlers/registerUser';
export { loginUser } from './handlers/loginUser';
export { getCurrentUser } from './handlers/getCurrentUser';
export { updateUserProfile } from './handlers/updateUserProfile';
export { logoutUser } from './handlers/logoutUser';

// Export API endpoint names and types from index.ts as per guidelines
export * from './index';

