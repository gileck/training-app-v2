import { NextApiRequest, NextApiResponse } from "next";
import { parse, serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from "./auth/types";

// Create server-side cache instance

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'xxxxx';
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set")
}
const COOKIE_NAME = 'auth_token';


export function getUserContext(req: NextApiRequest, res: NextApiResponse) {
  // Check for test environment first
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    if (!process.env.TEST_USER_ID) {
      throw new Error("TEST_USER_ID is not set for test environment")
    }
    console.log('🧪 TEST MODE: Using TEST_USER_ID:', process.env.TEST_USER_ID);
    return {
      userId: process.env.TEST_USER_ID,
      getCookieValue: () => undefined,
      setCookie: () => undefined,
      clearCookie: () => undefined
    };
  }

  // Check for development environment
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.LOCAL_USER_ID) {
      throw new Error("LOCAL_USER_ID is not set for development environment")
    }
    console.log('🔧 DEV MODE: Using LOCAL_USER_ID:', process.env.LOCAL_USER_ID);
    return {
      userId: process.env.LOCAL_USER_ID,
      getCookieValue: () => undefined,
      setCookie: () => undefined,
      clearCookie: () => undefined
    };
  }

  console.log('🔒 PROD MODE: Using JWT token authentication');

  let userId = undefined;
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];

  if (token) {
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthTokenPayload;
      userId = decoded.userId;
      console.log('🔒 PROD MODE: Decoded userId from JWT:', userId);
    } catch (err) {
      // Invalid token - clear it
      console.warn('Invalid auth token:', err);
      res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
        path: '/',
        expires: new Date(0)
      }));
    }
  }

  // Create context with auth info and cookie helpers
  const context = {
    userId,
    getCookieValue: (name: string) => cookies[name],
    setCookie: (name: string, value: string, options: Record<string, unknown>) => {
      res.setHeader('Set-Cookie', serialize(name, value, options as Record<string, string | number | boolean>));
    },
    clearCookie: (name: string, options: Record<string, unknown>) => {
      res.setHeader('Set-Cookie', serialize(name, '', {
        ...(options as Record<string, string | number | boolean>),
        path: '/',
        expires: new Date(0)
      }));
    }
  };

  return context;
}