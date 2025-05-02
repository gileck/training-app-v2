// import { NextApiRequest } from 'next'; // Remove unused import
import { SerializeOptions } from 'cookie';

/**
 * Context object passed to API handlers.
 * Contains request info, authenticated user ID (if available),
 * and methods to interact with cookies.
 */
export interface ApiHandlerContext {
  // req: NextApiRequest; // Remove direct access to req
  userId?: string;     // Populated by middleware if user is authenticated
  getCookieValue: (name: string) => string | undefined;
  setCookie: (name: string, value: string, options?: SerializeOptions) => void;
  clearCookie: (name: string, options?: SerializeOptions) => void;
}

/**
 * Type definition for a single API handler process function.
 * Accepts request parameters and context, performs actions (including cookie side effects via context),
 * and returns the data payload.
 */
export interface ApiHandler {
  process: (params: unknown, context: ApiHandlerContext) => Promise<unknown>; // Use unknown for generic params/return
  // Add other potential handler properties here if needed (e.g., requiresAuth: true)
}

/**
 * Registry mapping API names to their handlers.
 */
export type ApiHandlers = Record<string, ApiHandler>;

/**
 * Generic error response structure.
 */
export type ErrorResponse = {
  error: string;
};
