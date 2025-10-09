import { UserResponse } from './types';
import { User } from '@/server/database/collections/users/types';

export const COOKIE_NAME = 'auth_user';
export const COOKIE_OPTIONS = {
    path: '/',
    maxAge: 7 * 24 * 60 * 60
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

