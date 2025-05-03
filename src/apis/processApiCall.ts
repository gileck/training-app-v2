import { NextApiRequest, NextApiResponse } from "next";
import { apiHandlers } from "./apis";
import { withCache } from "@/server/cache";
import { CacheResult } from "@/server/cache/types";
import type { ApiOptions } from "@/client/utils/apiClient";
import { ApiHandlerContext } from "./types";
import { parse, serialize, SerializeOptions } from 'cookie';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET';
const COOKIE_NAME = 'authToken';

// Define a type for the decoded JWT payload
interface AuthTokenPayload {
  userId: string;
  // Add other fields like roles if needed
}

/**
 * Processes the API call, handling context creation, authentication, caching, and cookie operations.
 * @param req NextApiRequest
 * @param res NextApiResponse - Needed for setting cookies
 * @returns Promise<CacheResult<unknown>> - Returns the data payload wrapped in CacheResult
 */
export const processApiCall = async (
  req: NextApiRequest,
  res: NextApiResponse // Need response object to set cookies
): Promise<CacheResult<unknown>> => {

  const name = req.body.name as keyof typeof apiHandlers;
  const params = req.body.params;
  const options = req.body.options as ApiOptions;

  const apiHandler = apiHandlers[name];

  if (!apiHandler) {
    // Note: In a real app, return a proper JSON error response with status 404/400
    throw new Error(`API handler not found for name: ${name}`);
  }

  // --- Context Creation & Auth --- 
  let userId: string | undefined = undefined;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      userId = decoded.userId; // Extract userId if token is valid
    } catch (err) {
      // Invalid token - ignore it, user is considered logged out
      console.warn('Invalid auth token received:', err);
      // Optionally clear the invalid cookie
      const clearOptions: SerializeOptions = { path: '/', expires: new Date(0) };
      res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', clearOptions));
    }
  }

  // Cookie helper functions using the captured 'res' object
  const setCookie = (cookieName: string, value: string, cookieOptions?: SerializeOptions) => {
    // Accumulate cookies; careful about overwriting headers
    let existingCookies = res.getHeader('Set-Cookie') || [];
    if (!Array.isArray(existingCookies)) {
      existingCookies = [String(existingCookies)];
    }
    res.setHeader('Set-Cookie', [...existingCookies, serialize(cookieName, value, cookieOptions || {})]);
  };

  const clearCookie = (cookieName: string, cookieOptions?: SerializeOptions) => {
    const options = { ...cookieOptions, path: '/', expires: new Date(0) }; // Ensure expiry
    let existingCookies = res.getHeader('Set-Cookie') || [];
    if (!Array.isArray(existingCookies)) {
      existingCookies = [String(existingCookies)];
    }
    res.setHeader('Set-Cookie', [...existingCookies, serialize(cookieName, '', options)]);
  };

  const getCookieValue = (cookieName: string): string | undefined => {
    return cookies[cookieName];
  };

  // Create the context for the handler
  const context: ApiHandlerContext = {
    userId,
    getCookieValue,
    setCookie,
    clearCookie
  };

  // --- Execute Handler & Caching ---
  // The function passed to withCache now calls the handler process method
  // with parameters and the created context. Cookie side effects happen within `process`.
  const resultPayload = await withCache(() => apiHandler.process(params, context), {
    key: name,
    params: { ...params, userId }, // Include userId in cache key if endpoint depends on user
  }, {
    bypassCache: options?.bypassCache || false,
    disableCache: options?.disableCache || false
  });

  // `resultPayload` here is CacheResult<HandlerReturnType>
  // Cookies have already been set via context methods during apiHandler.process execution.

  return resultPayload;
};

