import { NextApiRequest, NextApiResponse } from "next";
import { parse, serialize } from 'cookie';
import { COOKIE_NAME } from '@/apis/auth/server';

export function getUserContext(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.LOCAL_USER_ID) {
      throw new Error("LOCAL_USER_ID is not set")
    }
    return {
      userId: process.env.LOCAL_USER_ID,
      getCookieValue: () => undefined,
      setCookie: () => undefined,
      clearCookie: () => undefined
    };
  }

  const cookies = parse(req.headers.cookie || '');
  const userId = cookies[COOKIE_NAME];

  const context = {
    userId,
    getCookieValue: (name: string) => cookies[name],
    setCookie: (name: string, value: string, options: Record<string, unknown> = {}) => {
      res.setHeader('Set-Cookie', serialize(name, value, { path: '/', ...options } as Record<string, string | number | boolean>));
    },
    clearCookie: (name: string, options: Record<string, unknown> = {}) => {
      res.setHeader('Set-Cookie', serialize(name, '', {
        path: '/',
        expires: new Date(0),
        ...options as Record<string, string | number | boolean>
      }));
    }
  };

  return context;
}